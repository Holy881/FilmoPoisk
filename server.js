// server.js
require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors =require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: API ключ TMDB не найден в переменных окружения (TMDB_API_KEY).');
}

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const upload = multer({ dest: UPLOADS_DIR });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Роуты для страниц ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'home.html')));
app.get('/auth', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'auth.html')));
app.get('/profile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'html', 'profile.html')));
app.get('/watch.html', (req, res) => {
    const watchPath = path.join(__dirname, 'public', 'html', 'watch.html');
    if (fs.existsSync(watchPath)) {
        res.sendFile(watchPath);
    } else {
        res.status(404).send(`Страница watch.html не найдена по пути: ${watchPath}.`);
    }
});

// --- Настройка Базы Данных ---
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite по пути:', dbPath);
        db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
            if (pragmaErr) console.error('Ошибка при включении внешних ключей:', pragmaErr);
            else console.log('Внешние ключи включены.');
        });
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                avatar TEXT
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS user_lists (
                item_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tmdb_id INTEGER,
                media_type TEXT,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                poster_path TEXT,
                rating INTEGER DEFAULT NULL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
                added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, tmdb_id, media_type),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`);
            db.run(`CREATE TABLE IF NOT EXISTS comments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                tmdb_id INTEGER NOT NULL,
                media_type TEXT NOT NULL,
                parent_id INTEGER DEFAULT NULL,
                content TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE 
            )`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_comments_tmdb_parent ON comments (tmdb_id, media_type, parent_id, created_at)`);
            
            db.run(`CREATE TABLE IF NOT EXISTS comment_votes (
                vote_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                comment_id INTEGER NOT NULL,
                vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, comment_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
            )`);
            db.run(`CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_user ON comment_votes (comment_id, user_id)`);
        });
    }
});

// --- API для Пользователей ---
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Все поля (имя пользователя, email, пароль) обязательны' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Пользователь с таким email или именем уже существует' });
                    }
                    console.error('Ошибка регистрации в БД:', err.message);
                    return res.status(500).json({ error: 'Ошибка сервера при регистрации' });
                }
                res.status(201).json({ id: this.lastID, username: username });
            }
        );
    } catch (error) {
        console.error('Ошибка хеширования пароля:', error);
        res.status(500).json({ error: 'Ошибка сервера при хешировании пароля' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Ошибка БД при поиске пользователя:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (!user) {
            return res.status(400).json({ error: 'Неверный email или пароль' });
        }
        try {
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                res.status(200).json({ id: user.id, username: user.username });
            } else {
                res.status(400).json({ error: 'Неверный email или пароль' });
            }
        } catch (compareError) {
            console.error('Ошибка сравнения паролей:', compareError);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
});

app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT id, username, email, avatar FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Ошибка БД при получении данных пользователя:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.status(200).json(user);
    });
});

app.post('/api/user/:id/avatar', upload.single('avatar'), (req, res) => {
    const userId = req.params.id;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }
    
    db.get('SELECT avatar FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) console.error('Ошибка получения старого аватара:', err.message);

        if (user && user.avatar && user.avatar !== '/images/default-avatar.png' && user.avatar.startsWith(`/uploads/`)) {
            const oldAvatarFileName = user.avatar.substring('/uploads/'.length);
            const oldAvatarPath = path.join(UPLOADS_DIR, oldAvatarFileName);
            fs.unlink(oldAvatarPath, (unlinkErr) => {
                if (unlinkErr && unlinkErr.code !== 'ENOENT') console.error('Ошибка удаления старого аватара:', unlinkErr);
            });
        }

        const newFileName = `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`;
        const newPathInUploads = path.join(UPLOADS_DIR, newFileName);

        fs.rename(file.path, newPathInUploads, (renameErr) => {
            if (renameErr) {
                console.error('Ошибка перемещения загруженного файла:', renameErr);
                fs.unlink(file.path, (tempUnlinkErr) => { 
                    if (tempUnlinkErr) console.error('Ошибка удаления временного файла multer:', tempUnlinkErr);
                });
                return res.status(500).json({ error: 'Ошибка сохранения файла аватара' });
            }
            const avatarUrlForDB = `/uploads/${newFileName}`;
            db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrlForDB, userId], (dbErr) => {
                if (dbErr) {
                    console.error('Ошибка обновления аватара в БД:', dbErr.message);
                    return res.status(500).json({ error: 'Ошибка обновления аватара в базе данных' });
                }
                res.status(200).json({ avatarUrl: avatarUrlForDB });
            });
        });
    });
});

app.post('/api/user/:id/password', async (req, res) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Текущий и новый пароли обязательны' });
    }
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    }
    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err) { 
            console.error('Ошибка БД при получении пароля:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (!user) { return res.status(404).json({ error: 'Пользователь не найден' }); }
        try {
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) { return res.status(400).json({ error: 'Текущий пароль неверен' });}
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (dbErr) => {
                if (dbErr) { 
                    console.error('Ошибка БД при обновлении пароля:', dbErr.message);
                    return res.status(500).json({ error: 'Ошибка обновления пароля' });
                }
                res.status(200).json({ message: 'Пароль успешно изменён' });
            });
        } catch (compareErr) {
            console.error('Ошибка сравнения/хеширования паролей:', compareErr);
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    });
});

app.post('/api/user/:id/update', (req, res) => {
    const userId = req.params.id;
    const { field, value } = req.body;
    if (!['username', 'email'].includes(field)) {
        return res.status(400).json({ error: 'Недопустимое поле для обновления' });
    }
    if (!value || String(value).trim().length < 3) {
        return res.status(400).json({ error: `${field === 'username' ? 'Имя пользователя' : 'Email'} должен содержать минимум 3 символа` });
    }
    if (field === 'email' && !String(value).includes('@')) {
        return res.status(400).json({ error: 'Некорректный формат email' });
    }
    const sql = `UPDATE users SET ${field} = ? WHERE id = ?`;
    db.run(sql, [String(value).trim(), userId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: `Это ${field === 'username' ? 'имя пользователя' : 'email'} уже занято` });
            }
            console.error('Ошибка БД при обновлении данных пользователя:', err.message);
            return res.status(500).json({ error: 'Ошибка обновления данных пользователя' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Пользователь не найден или данные не изменены' });
        }
        res.status(200).json({ message: 'Данные успешно обновлены' });
    });
});

app.get('/api/user/:id/lists', (req, res) => {
    const userId = req.params.id;
    const categoryQueryParam = req.query.category;
    const sortQueryParam = req.query.sort || 'date_desc';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; 
    const offset = (page - 1) * limit;
    const tmdbIdQuery = req.query.tmdb_id; 
    const mediaTypeQuery = req.query.media_type; 

    let countQuery = 'SELECT COUNT(*) as total FROM user_lists WHERE user_id = ?';
    let itemsQuery = 'SELECT item_id AS id, user_id, tmdb_id, media_type, category, title, poster_path, rating, added_date FROM user_lists WHERE user_id = ?';
    const countQueryParams = [userId];
    const itemsQueryParams = [userId];

    if (tmdbIdQuery && mediaTypeQuery) { 
        itemsQuery += ' AND tmdb_id = ? AND media_type = ?';
        itemsQueryParams.push(tmdbIdQuery, mediaTypeQuery);
        db.get(itemsQuery, itemsQueryParams, (err, row) => {
            if (err) {
                console.error('Ошибка при получении статуса элемента списка:', err.message);
                return res.status(500).json({ error: 'Ошибка сервера при получении статуса элемента' });
            }
            return res.status(200).json(row || null); 
        });
        return;
    }

    if (categoryQueryParam && categoryQueryParam !== 'Все категории') {
        countQuery += ' AND category = ?';
        itemsQuery += ' AND category = ?';
        countQueryParams.push(categoryQueryParam);
        itemsQueryParams.push(categoryQueryParam);
    }

    let orderByClause = '';
    switch (sortQueryParam) {
        case 'none': orderByClause = ' ORDER BY added_date DESC'; break; 
        case 'date_asc': orderByClause = ' ORDER BY added_date ASC'; break;
        case 'title_asc': orderByClause = ' ORDER BY LOWER(title) ASC'; break;
        case 'title_desc': orderByClause = ' ORDER BY LOWER(title) DESC'; break;
        case 'rating_asc': orderByClause = ' ORDER BY rating ASC NULLS LAST, LOWER(title) ASC'; break;
        case 'rating_desc': orderByClause = ' ORDER BY rating DESC NULLS LAST, LOWER(title) ASC'; break;
        case 'date_desc': default: orderByClause = ' ORDER BY added_date DESC'; break;
    }
    itemsQuery += orderByClause;
    itemsQuery += ' LIMIT ? OFFSET ?';
    itemsQueryParams.push(limit, offset);

    db.get(countQuery, countQueryParams, (err, countResult) => {
        if (err) {
            console.error('Ошибка при подсчёте элементов:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при подсчёте элементов' });
        }
        const totalItems = countResult ? countResult.total : 0;
        db.all(itemsQuery, itemsQueryParams, (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списков:', err.message);
                return res.status(500).json({ error: 'Ошибка сервера при получении списка' });
            }
            res.status(200).json({
                items: rows,
                totalItems: totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit)
            });
        });
    });
});

app.post('/api/user/:id/lists', (req, res) => {
    const userId = req.params.id;
    const { category, title, poster_path, rating, tmdb_id, media_type } = req.body;

    if (!category || !title || tmdb_id === undefined || !media_type) {
        return res.status(400).json({ error: 'Категория, название, TMDB ID и тип медиа обязательны' });
    }
    if (!["Просмотрено", "Смотрю", "Брошено", "Планирую", "В избранном", "Пересматриваю", "На паузе", "Не интересно"].includes(category)) {
        return res.status(400).json({ error: 'Недопустимая категория' });
    }
    const ratingValue = (rating !== undefined && rating !== null && !isNaN(parseInt(rating))) ? parseInt(rating) : null;
    if (ratingValue !== null && (ratingValue < 0 || ratingValue > 10)) {
        return res.status(400).json({ error: 'Рейтинг должен быть от 0 до 10 или null' });
    }
    if (!['movie', 'tv'].includes(media_type)) {
        return res.status(400).json({ error: 'Недопустимый тип медиа. Должен быть "movie" или "tv".' });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION;");
        const deleteSql = 'DELETE FROM user_lists WHERE user_id = ? AND tmdb_id = ? AND media_type = ?';
        db.run(deleteSql, [userId, tmdb_id, media_type], function(deleteErr) {
            if (deleteErr) {
                db.run("ROLLBACK;");
                console.error('Ошибка при удалении существующего элемента из списка:', deleteErr.message);
                return res.status(500).json({ error: 'Ошибка сервера при обновлении списка' });
            }
            const insertSql = 'INSERT INTO user_lists (user_id, tmdb_id, media_type, category, title, poster_path, rating, added_date) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)';
            const params = [userId, tmdb_id, media_type, category, title, poster_path, ratingValue];
            db.run(insertSql, params, function (insertErr) {
                if (insertErr) {
                    db.run("ROLLBACK;");
                    console.error('Ошибка при добавлении в список:', insertErr.message);
                    return res.status(500).json({ error: 'Ошибка добавления в список' });
                }
                db.run("COMMIT;");
                res.status(201).json({
                    item_id: this.lastID, 
                    user_id: Number(userId), 
                    tmdb_id: tmdb_id,
                    media_type: media_type, 
                    category: category, 
                    title: title,
                    poster_path: poster_path, 
                    rating: ratingValue,
                    message: `Элемент ${title} успешно добавлен/обновлен в категории ${category}.`
                });
            });
        });
    });
});

app.delete('/api/user/:id/lists/:item_id', (req, res) => {
    const userId = req.params.id;
    const itemId = req.params.item_id;
    db.run('DELETE FROM user_lists WHERE user_id = ? AND item_id = ?', [userId, itemId], function(err) {
        if (err) {
            console.error('Ошибка при удалении из списка:', err.message);
            return res.status(500).json({ error: 'Ошибка удаления из списка' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Элемент не найден для удаления' });
        }
        res.status(200).json({ message: 'Элемент удалён' });
    });
});

app.put('/api/user/:id/lists/:item_id', (req, res) => {
    const userId = req.params.id;
    const itemId = req.params.item_id;
    const { category, rating } = req.body;

    let query = 'UPDATE user_lists SET ';
    const params = [];
    const updates = [];

    if (category) {
        if (!["Просмотрено", "Смотрю", "Брошено", "Планирую", "В избранном", "Пересматриваю", "На паузе", "Не интересно"].includes(category)) {
            return res.status(400).json({ error: 'Недопустимая категория' });
        }
        updates.push('category = ?');
        params.push(category);
    }
    if (rating !== undefined) {
        const ratingValue = (rating === null || String(rating).trim() === '') ? null : parseInt(rating);
        if (ratingValue !== null && (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10)) {
             return res.status(400).json({ error: 'Рейтинг должен быть числом от 0 до 10 или отсутствовать' });
        }
        updates.push('rating = ?');
        params.push(ratingValue);
    }
    updates.push('added_date = CURRENT_TIMESTAMP');

    if (updates.length === 1 && updates[0] === 'added_date = CURRENT_TIMESTAMP') { 
         return res.status(400).json({ error: 'Не указаны данные для обновления (кроме даты)' });
    }

    query += updates.join(', ') + ' WHERE user_id = ? AND item_id = ?';
    params.push(userId, itemId);

    db.run(query, params, function(err) {
        if (err) {
            console.error('Ошибка при обновлении элемента списка:', err.message);
            return res.status(500).json({ error: 'Ошибка обновления элемента списка' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Элемент не найден или данные не изменены' });
        }
        db.get('SELECT item_id AS id, user_id, tmdb_id, media_type, category, title, poster_path, rating, added_date FROM user_lists WHERE item_id = ? AND user_id = ?', [itemId, userId], (fetchErr, updatedItem) => {
            if (fetchErr) {
                console.error('Ошибка при получении обновленного элемента:', fetchErr.message);
                return res.status(200).json({ message: 'Элемент списка успешно обновлён (ошибка получения данных)'});
            }
            if (!updatedItem) {
                 return res.status(404).json({ error: 'Обновленный элемент не найден после обновления' });
            }
            res.status(200).json({ message: 'Элемент списка успешно обновлён', item: updatedItem });
        });
    });
});


// --- API для Комментариев ---
app.get('/api/comments/:media_type/:tmdb_id', async (req, res) => {
    const { media_type, tmdb_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; 
    const offset = (page - 1) * limit;
    const currentUserId = req.query.userId ? parseInt(req.query.userId) : null;

    if (!media_type || !tmdb_id) {
        return res.status(400).json({ error: 'media_type и tmdb_id обязательны' });
    }

    try {
        const totalRootCommentsSql = `SELECT COUNT(*) as total FROM comments WHERE media_type = ? AND tmdb_id = ? AND parent_id IS NULL`;
        const totalResult = await new Promise((resolve, reject) => {
            db.get(totalRootCommentsSql, [media_type, tmdb_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        const rootCommentsSql = `
            SELECT 
                c.id, c.content, c.parent_id, c.created_at, c.updated_at, c.user_id,
                u.username, u.avatar,
                (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.vote_type = 1) as upvotes,
                (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.vote_type = -1) as downvotes
                ${currentUserId ? ', (SELECT cv.vote_type FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.user_id = ?) as user_vote' : ''}
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.media_type = ? AND c.tmdb_id = ? AND c.parent_id IS NULL
            ORDER BY c.created_at DESC 
            LIMIT ? OFFSET ?`;
        
        const queryParams = currentUserId 
            ? [currentUserId, media_type, tmdb_id, limit, offset]
            : [media_type, tmdb_id, limit, offset];

        const rootComments = await new Promise((resolve, reject) => {
            db.all(rootCommentsSql, queryParams, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const allCommentsSql = `
            SELECT 
                c.id, c.content, c.parent_id, c.created_at, c.updated_at, c.user_id,
                u.username, u.avatar,
                (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.vote_type = 1) as upvotes,
                (SELECT COUNT(*) FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.vote_type = -1) as downvotes
                ${currentUserId ? ', (SELECT cv.vote_type FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.user_id = ?) as user_vote' : ''}
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.media_type = ? AND c.tmdb_id = ?
            ORDER BY c.created_at ASC`;

        const allCommentsParams = currentUserId ? [currentUserId, media_type, tmdb_id] : [media_type, tmdb_id];
        const allComments = await new Promise((resolve, reject) => {
            db.all(allCommentsSql, allCommentsParams, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const commentMap = {};
        allComments.forEach(comment => {
            comment.children = [];
            commentMap[comment.id] = comment;
        });

        const finalRootComments = [];
        rootComments.forEach(rootComment => { 
            const fullRootComment = commentMap[rootComment.id];
            if (fullRootComment) {
                function buildChildren(parent) {
                    allComments.forEach(potentialChild => {
                        if (potentialChild.parent_id === parent.id) {
                            const fullChild = commentMap[potentialChild.id];
                            if(fullChild) {
                                parent.children.push(fullChild);
                                buildChildren(fullChild); 
                            }
                        }
                    });
                }
                buildChildren(fullRootComment);
                finalRootComments.push(fullRootComment);
            }
        });

        res.status(200).json({
            comments: finalRootComments,
            currentPage: page,
            totalPages: totalPages,
            totalItems: totalItems
        });

    } catch (error) {
        console.error('Ошибка при получении комментариев из БД:', error.message);
        res.status(500).json({ error: 'Ошибка сервера при получении комментариев' });
    }
});

app.post('/api/comments', (req, res) => {
    const { userId, tmdb_id, media_type, content, parent_id = null } = req.body;

    if (!userId) return res.status(401).json({ error: 'Действие доступно только авторизованным пользователям' });
    if (!tmdb_id || !media_type || !content) return res.status(400).json({ error: 'tmdb_id, media_type и content обязательны' });

    db.get('SELECT id FROM users WHERE id = ?', [userId], (userErr, userRow) => {
        if (userErr || !userRow) return res.status(403).json({ error: 'Пользователь не найден или недействителен' });

        const sql = `INSERT INTO comments (user_id, tmdb_id, media_type, content, parent_id, created_at, updated_at) 
                     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
        const params = [userId, tmdb_id, media_type, content, parent_id];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Ошибка добавления комментария в БД:', err.message);
                return res.status(500).json({ error: 'Не удалось добавить комментарий' });
            }
            const newCommentId = this.lastID;
            const currentUserIdForVote = parseInt(userId); 
            db.get(`
                SELECT c.id, c.content, c.parent_id, c.created_at, c.updated_at, c.user_id, 
                       u.username, u.avatar,
                       0 as upvotes, 0 as downvotes
                       ${currentUserIdForVote ? ', NULL as user_vote' : ''}
                FROM comments c 
                JOIN users u ON c.user_id = u.id
                WHERE c.id = ?`, 
                [newCommentId], (fetchErr, newComment) => {
                    if (fetchErr || !newComment) {
                        console.error('Ошибка получения созданного комментария:', fetchErr?.message);
                        return res.status(201).json({ id: newCommentId, message: 'Комментарий создан, но не удалось получить его данные.' });
                    }
                    newComment.children = [];
                    res.status(201).json(newComment);
            });
        });
    });
});

app.put('/api/comments/:comment_id', (req, res) => {
    const { comment_id } = req.params;
    const { userId, content } = req.body;

    if (!userId) return res.status(401).json({ error: 'Авторизация не пройдена' });
    if (!content || content.trim() === '') return res.status(400).json({ error: 'Комментарий не может быть пустым' });

    db.get('SELECT user_id FROM comments WHERE id = ?', [comment_id], (err, comment) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера при поиске комментария' });
        if (!comment) return res.status(404).json({ error: 'Комментарий не найден' });
        if (comment.user_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Вы не можете редактировать этот комментарий' });
        }

        const sql = `UPDATE comments SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        db.run(sql, [content, comment_id], function(updateErr) {
            if (updateErr) return res.status(500).json({ error: 'Не удалось обновить комментарий' });
            res.status(200).json({ message: 'Комментарий успешно обновлен', content: content, updated_at: new Date().toISOString() });
        });
    });
});

app.delete('/api/comments/:comment_id', (req, res) => {
    const { comment_id } = req.params;
    const { userId } = req.body; 

    if (!userId) return res.status(401).json({ error: 'Авторизация не пройдена' });

    db.get('SELECT user_id FROM comments WHERE id = ?', [comment_id], (err, comment) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера' });
        if (!comment) return res.status(404).json({ error: 'Комментарий не найден' });
        if (comment.user_id !== parseInt(userId)) {
            return res.status(403).json({ error: 'Вы не можете удалить этот комментарий' });
        }
        db.run('DELETE FROM comment_votes WHERE comment_id = ?', [comment_id], (voteErr) => {
            if (voteErr) console.error("Ошибка при удалении голосов комментария:", voteErr.message);
            db.run('DELETE FROM comments WHERE id = ?', [comment_id], function(deleteErr) {
                if (deleteErr) return res.status(500).json({ error: 'Не удалось удалить комментарий' });
                if (this.changes === 0) return res.status(404).json({ error: 'Комментарий не найден для удаления (возможно, уже удален)' });
                res.status(200).json({ message: 'Комментарий успешно удален' });
            });
        });
    });
});

app.post('/api/comments/:comment_id/vote', (req, res) => {
    const { comment_id } = req.params;
    const { userId, voteType } = req.body; 

    if (!userId) return res.status(401).json({ error: 'Авторизация не пройдена' });
    if (![1, -1, 0].includes(voteType)) return res.status(400).json({ error: 'Неверный тип голоса' });

    db.get('SELECT vote_type FROM comment_votes WHERE user_id = ? AND comment_id = ?', [userId, comment_id], (err, existingVote) => {
        if (err) return res.status(500).json({ error: 'Ошибка сервера при проверке голоса' });

        db.serialize(() => {
            if (existingVote) { 
                if (voteType === 0 || existingVote.vote_type === voteType) { 
                    db.run('DELETE FROM comment_votes WHERE user_id = ? AND comment_id = ?', [userId, comment_id]);
                } else { 
                    db.run('UPDATE comment_votes SET vote_type = ?, created_at = CURRENT_TIMESTAMP WHERE user_id = ? AND comment_id = ?', [voteType, userId, comment_id]);
                }
            } else if (voteType !== 0) { 
                db.run('INSERT INTO comment_votes (user_id, comment_id, vote_type) VALUES (?, ?, ?)', [userId, comment_id, voteType]);
            }
            db.get(`
                SELECT 
                    (SELECT COUNT(*) FROM comment_votes WHERE comment_id = ? AND vote_type = 1) as upvotes,
                    (SELECT COUNT(*) FROM comment_votes WHERE comment_id = ? AND vote_type = -1) as downvotes
            `, [comment_id, comment_id], (countErr, counts) => {
                if (countErr) return res.status(500).json({ error: 'Ошибка при получении новых счетчиков голосов' });
                res.status(200).json({ 
                    message: 'Голос обновлен', 
                    upvotes: counts.upvotes, 
                    downvotes: counts.downvotes,
                    userVote: voteType === 0 ? null : (existingVote && existingVote.vote_type === voteType ? null : voteType) 
                });
            });
        });
    });
});


// --- TMDB API эндпоинты ---
const LOCAL_HERO_TRAILERS = {
    '550': '/videos/hero_trailers/fight_club.mp4',
    '46648-true-detective': '/videos/hero_trailers/true_detective_season_1.mp4',
    '20526': '/videos/hero_trailers/tron_legacy.mp4',
    '122917': '/videos/hero_trailers/the_hobbit_battle_of_the_five_armies.mp4',
    '157336': '/videos/hero_trailers/interstellar.mp4',
    '522627': '/videos/hero_trailers/gentlemens.mp4',
    '70523-dark': '/videos/hero_trailers/dark.mp4',
    '411': '/videos/hero_trailers/chronicles_of_narnia.mp4',
    '1396-breaking-bad': '/videos/hero_trailers/breaking_bad.mp4',
    '335984': '/videos/hero_trailers/blade_runner_2049.mp4',
};

app.get('/api/tmdb/hero-content', async (req, res) => {
    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: 'Ошибка конфигурации сервера: API ключ TMDB не найден.' });
    }
    const language = 'ru-RU';
    try {
        const localTmdbKeys = Object.keys(LOCAL_HERO_TRAILERS);
        if (localTmdbKeys.length === 0) {
            return res.status(404).json({ error: 'Список локальных трейлеров для hero пуст.' });
        }
        const randomIndex = Math.floor(Math.random() * localTmdbKeys.length);
        const randomKey = localTmdbKeys[randomIndex];
        const localTrailerPath = LOCAL_HERO_TRAILERS[randomKey];
        let itemTmdbId;
        let itemType;
        if (randomKey.includes('-')) {
            itemTmdbId = randomKey.split('-')[0];
            itemType = 'tv';
        } else {
            itemTmdbId = randomKey;
            itemType = 'movie';
        }
        const detailsUrl = `${TMDB_BASE_URL}/${itemType}/${itemTmdbId}`;
        const detailsResponse = await axios.get(detailsUrl, {
            params: {
                api_key: TMDB_API_KEY,
                language: language,
                append_to_response: 'images',
                include_image_language: 'ru,en,null'
            }
        });
        const itemDetails = detailsResponse.data;
        const videoInfo = { type: 'html5_local', key_or_url: localTrailerPath };
        let backdropPath = itemDetails.backdrop_path;
        if (itemDetails.images && itemDetails.images.backdrops && itemDetails.images.backdrops.length > 0) {
           if (!backdropPath && itemDetails.images.backdrops[0]) {
               backdropPath = itemDetails.images.backdrops[0].file_path;
           }
        }
        const title = itemType === 'movie' ? itemDetails.title : itemDetails.name;
        const release_date = itemType === 'movie' ? itemDetails.release_date : itemDetails.first_air_date;
        res.status(200).json({
            id: itemDetails.id,
            title: title,
            overview: itemDetails.overview,
            backdrop_path: backdropPath,
            poster_path: itemDetails.poster_path,
            vote_average: itemDetails.vote_average,
            release_date: release_date,
            video_info: videoInfo,
            media_type: itemType
        });
    } catch (error) {
        console.error('Ошибка при получении контента для Hero:',
            error.response ? { status: error.response.status, data: error.response.data, config_url: error.config ? error.config.url : 'N/A' } : error.message
        );
        res.status(error.response ? error.response.status : 500)
           .json({ 
               error: 'Ошибка при получении контента для hero.', 
               details: error.response ? error.response.data : null,
               requested_url: error.config ? error.config.url : 'N/A'
            });
    }
});

app.get('/api/tmdb/genres/:type', async (req, res) => {
    const { type } = req.params;
    const language = req.query.language || 'ru-RU';
    if (type !== 'movie' && type !== 'tv') {
        return res.status(400).json({ error: "Неверный тип для жанров." });
    }
    if (!TMDB_API_KEY) return res.status(500).json({ error: 'API ключ TMDB не найден.' });
    const tmdbGenreUrl = `${TMDB_BASE_URL}/genre/${type}/list`;
    try {
        const response = await axios.get(tmdbGenreUrl, { params: { api_key: TMDB_API_KEY, language: language } });
        res.status(200).json(response.data.genres || []);
    } catch (error) {
        res.status(error.response ? error.response.status : 500).json({ error: `Ошибка при получении жанров ${type}.` });
    }
});

app.get('/api/tmdb/details/:type/:tmdbId', async (req, res) => {
    const { tmdbId, type } = req.params;
    const { language = 'ru-RU' } = req.query;
    const tmdbUrl = `${TMDB_BASE_URL}/${type}/${tmdbId}`;

    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: 'API ключ TMDB не настроен на сервере.' });
    }
    if (!['movie', 'tv'].includes(type)) {
        return res.status(400).json({ error: "Неверный тип контента." });
    }
    if (!tmdbId) {
        return res.status(400).json({ error: "TMDB ID не указан." });
    }

    try {
        const response = await axios.get(tmdbUrl, {
            params: { 
                api_key: TMDB_API_KEY, 
                language: language, 
                append_to_response: 'credits,videos,images,recommendations,similar,release_dates,content_ratings',
                include_image_language: 'ru,en,null' 
            }
        });
        let itemData = response.data;
        if (type === 'tv' && itemData.seasons && itemData.seasons.length > 0) {
            try {
                const seasonDetailPromises = itemData.seasons.map(season => {
                    if (season.season_number === 0) { 
                        return Promise.resolve({ ...season, episodes: [], episode_count: season.episode_count || 0, poster_path: season.poster_path || null });
                    }
                    return axios.get(`${TMDB_BASE_URL}/tv/${tmdbId}/season/${season.season_number}`, {
                        params: { api_key: TMDB_API_KEY, language: language }
                    })
                    .then(seasonRes => ({ 
                        id: seasonRes.data.id, air_date: seasonRes.data.air_date, episodes: seasonRes.data.episodes || [], 
                        name: seasonRes.data.name, overview: seasonRes.data.overview, poster_path: seasonRes.data.poster_path, 
                        season_number: seasonRes.data.season_number, vote_average: seasonRes.data.vote_average,
                        episode_count: seasonRes.data.episodes ? seasonRes.data.episodes.length : (season.episode_count || 0)
                    }))
                    .catch(err => { 
                        console.warn(`Не удалось загрузить детали для сезона ${season.season_number} сериала ${tmdbId}: ${err.message}`);
                        return { ...season, episodes: [], episode_count: season.episode_count || 0, poster_path: season.poster_path || null };
                    });
                });
                const detailedSeasonsData = (await Promise.all(seasonDetailPromises)).filter(Boolean);
                itemData.all_season_details = detailedSeasonsData; 
            } catch (seasonFetchError) { 
                console.error(`Ошибка при загрузке некоторых деталей сезонов для сериала ${tmdbId}: ${seasonFetchError.message}`);
                if (itemData.seasons && !itemData.all_season_details) {
                    itemData.all_season_details = itemData.seasons
                        .map(s => ({ ...s, episodes: [], episode_count: s.episode_count || 0, poster_path: s.poster_path || null }));
                }
            }
        }
        res.status(200).json(itemData);
    } catch (error) {
        console.error(`Ошибка при запросе к TMDB для ${type}/${tmdbId}:`, error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response?.data?.status_message ? error.response.data.status_message : 'Не удалось получить данные от TMDB.';
        res.status(status).json({ error: message, details: error.response ? error.response.data : null });
    }
});

app.get('/api/tv/:tv_id/season/:season_number/episode/:episode_number/images', async (req, res) => {
    const { tv_id, season_number, episode_number } = req.params;
    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: 'API ключ TMDB не настроен на сервере.' });
    }
    const tmdbUrl = `${TMDB_BASE_URL}/tv/${tv_id}/season/${season_number}/episode/${episode_number}/images`;
    try {
        const response = await axios.get(tmdbUrl, { params: { api_key: TMDB_API_KEY } });
        res.status(200).json(response.data.stills || []);
    } catch (error) {
        console.error(`Ошибка при запросе кадров для tv/${tv_id}/season/${season_number}/episode/${episode_number}:`, error.response ? error.response.data : error.message);
        const status = error.response ? error.response.status : 500;
        const message = error.response?.data?.status_message || 'Не удалось получить кадры для эпизода от TMDB.';
        res.status(status).json({ error: message });
    }
});

app.get('/api/tmdb/search', async (req, res) => {
    const { query, media_type, genres, year_from, year_to, rating_from, rating_to, page = 1, language = 'ru-RU', sort_by = 'popularity.desc', with_types, without_genres, list_type } = req.query;
    if (!TMDB_API_KEY) return res.status(500).json({ error: 'API ключ TMDB не найден.' });
    let tmdbUrl;
    const params = { api_key: TMDB_API_KEY, language: language, page: parseInt(page, 10), include_adult: false, include_image_language: 'ru,en,null' };
    if (list_type) {
        if (list_type === 'now_playing' && media_type === 'movie') tmdbUrl = `${TMDB_BASE_URL}/movie/now_playing`;
        else if (list_type === 'trending_movie_week' && media_type === 'movie') tmdbUrl = `${TMDB_BASE_URL}/trending/movie/week`;
        else if (list_type === 'trending_tv_week' && media_type === 'tv') tmdbUrl = `${TMDB_BASE_URL}/trending/tv/week`;
        else if (list_type === 'on_the_air_tv' && media_type === 'tv') tmdbUrl = `${TMDB_BASE_URL}/tv/on_the_air`;
        else return res.status(400).json({ error: "Неизвестный тип списка или неверная комбинация с media_type." });
    } else if (query) { 
        const searchType = (media_type === 'movie' || media_type === 'tv') ? media_type : 'multi';
        tmdbUrl = `${TMDB_BASE_URL}/search/${searchType}`;
        params.query = query;
        if (year_from) { const yearFromInt = parseInt(year_from, 10); if (!isNaN(yearFromInt)) { if (searchType === 'movie') params.year = yearFromInt; else if (searchType === 'tv') params.first_air_date_year = yearFromInt; } }
    } else if (media_type && (media_type === 'movie' || media_type === 'tv')) { 
        tmdbUrl = `${TMDB_BASE_URL}/discover/${media_type}`;
        if (genres) params.with_genres = genres;
        const dateParamPrefix = media_type === 'movie' ? 'primary_release_date' : 'first_air_date';
        if (year_from) { params[`${dateParamPrefix}.gte`] = `${year_from}-01-01`; if (!year_to) params[`${dateParamPrefix}.lte`] = `${year_from}-12-31`; }
        if (year_to) { params[`${dateParamPrefix}.lte`] = `${year_to}-12-31`; if (!year_from) params[`${dateParamPrefix}.gte`] = `1900-01-01`; }
        if (rating_from) params['vote_average.gte'] = parseFloat(rating_from);
        if (rating_to) params['vote_average.lte'] = parseFloat(rating_to);
        if (media_type === 'tv') { if (with_types) params.with_types = with_types; if (without_genres) params.without_genres = without_genres; }
        params.sort_by = sort_by || 'popularity.desc';
    } else {
         return res.status(400).json({ error: "Для поиска необходим текстовый запрос или указание типа медиа (фильм/сериал) вместе с другими фильтрами." });
    }
    try {
        // console.log(`[TMDB ЗАПРОС] URL: ${tmdbUrl}, Параметры: ${JSON.stringify(params)}`);
        const response = await axios.get(tmdbUrl, { params });
        res.status(200).json(response.data);
    } catch (error) {
        const status = error.response ? error.response.status : 500;
        const message = error.response?.data?.status_message || 'Ошибка при выполнении поиска на TMDB.';
        console.error(`[ОШИБКА TMDB] Status: ${status}, Message: ${message}, URL: ${tmdbUrl}, Params: ${JSON.stringify(params)}`, error.response?.data);
        res.status(status).json({ error: message, details: error.response ? error.response.data : null });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
