const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_DIR = 'uploads';
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}
const upload = multer({ dest: `${UPLOADS_DIR}/` });


const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite');
        db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) {
                console.error('Ошибка при включении внешних ключей:', err);
            } else {
                console.log('Внешние ключи включены');
            }
        });
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
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            poster TEXT,
            rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
    }
});

app.use(express.static(path.join(__dirname, '..')));
app.use(`/${UPLOADS_DIR}`, express.static(UPLOADS_DIR));

app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function (err) {
                if (err) {
                    res.status(400).json({ error: 'Пользователь с таким email или именем уже существует' });
                } else {
                    res.status(200).json({ id: this.lastID });
                }
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
            res.status(400).json({ error: 'Неверный email или пароль' });
            return;
        }
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            res.status(200).json({ id: user.id });
        } else {
            res.status(400).json({ error: 'Неверный email или пароль' });
        }
    });
});

app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT username, email, avatar FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            res.status(404).json({ error: 'Пользователь не найден' });
        } else {
            res.status(200).json(user);
        }
    });
});

app.post('/api/user/:id/avatar', upload.single('avatar'), (req, res) => {
    const userId = req.params.id;
    const file = req.file;
    if (!file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }

    db.get('SELECT avatar FROM users WHERE id = ?', [userId], (err, user) => {
        if (user && user.avatar && user.avatar !== '/images/default-avatar.png' && user.avatar.startsWith(`/${UPLOADS_DIR}/`)) {
            const oldAvatarPath = path.join(__dirname, user.avatar.substring(1));
            fs.unlink(oldAvatarPath, (unlinkErr) => {
                if (unlinkErr && unlinkErr.code !== 'ENOENT') {
                    console.error('Ошибка удаления старого аватара:', unlinkErr);
                }
            });
        }
    });

    const newFileName = `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`;
    const newPath = path.join(UPLOADS_DIR, newFileName);

    fs.rename(file.path, newPath, (err) => {
        if (err) {
            fs.unlink(file.path, () => {});
            return res.status(500).json({ error: 'Ошибка сохранения файла' });
        }

        const avatarUrl = `/${UPLOADS_DIR}/${newFileName}`;
        db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId], (dbErr) => {
            if (dbErr) {
                return res.status(500).json({ error: 'Ошибка обновления аватара в базе данных' });
            }
            res.status(200).json({ avatarUrl });
        });
    });
});

app.post('/api/user/:id/password', async (req, res) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(400).json({ error: 'Текущий пароль неверен' });
        }

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (dbErr) => {
            if (dbErr) {
                return res.status(500).json({ error: 'Ошибка обновления пароля' });
            }
            res.status(200).json({ message: 'Пароль успешно изменён' });
        });
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
        return res.status(400).json({ error: 'Неверный формат email' });
    }

    db.run(`UPDATE users SET ${field} = ? WHERE id = ?`, [String(value).trim(), userId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                 return res.status(400).json({ error: `Такое ${field === 'username' ? 'имя пользователя' : 'email'} уже используется` });
            }
            return res.status(500).json({ error: 'Ошибка обновления данных пользователя' });
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

    let countQuery = 'SELECT COUNT(*) as total FROM user_lists WHERE user_id = ?';
    let itemsQuery = 'SELECT item_id AS id, category, title, poster, rating FROM user_lists WHERE user_id = ?';
    const countQueryParams = [userId];
    const itemsQueryParams = [userId];

    if (categoryQueryParam && categoryQueryParam !== 'Все категории') {
        countQuery += ' AND category = ?';
        itemsQuery += ' AND category = ?';
        countQueryParams.push(categoryQueryParam);
        itemsQueryParams.push(categoryQueryParam);
    }

    // Логика сортировки
    let orderByClause = '';
    switch (sortQueryParam) {
        case 'none': // Без специальной сортировки (порядок из БД, обычно по item_id)
            orderByClause = ' ORDER BY item_id DESC'; // Или ASC, или вообще убрать ORDER BY для "естественного" порядка
            break;
        case 'date_asc':
            orderByClause = ' ORDER BY item_id ASC';
            break;
        case 'title_asc':
            orderByClause = ' ORDER BY title ASC';
            break;
        case 'title_desc':
            orderByClause = ' ORDER BY title DESC';
            break;
        case 'rating_asc':
            orderByClause = ' ORDER BY rating ASC, title ASC';
            break;
        case 'rating_desc':
            orderByClause = ' ORDER BY rating DESC, title ASC';
            break;
        case 'date_desc':
        default:
            orderByClause = ' ORDER BY item_id DESC';
            break;
    }
    itemsQuery += orderByClause;

    itemsQuery += ' LIMIT ? OFFSET ?';
    itemsQueryParams.push(limit, offset);

    db.get(countQuery, countQueryParams, (err, countResult) => {
        if (err) {
            console.error('Ошибка при подсчёте элементов:', err);
            return res.status(500).json({ error: 'Ошибка сервера при подсчёте элементов' });
        }
        const totalItems = countResult ? countResult.total : 0;
        db.all(itemsQuery, itemsQueryParams, (err, rows) => {
            if (err) {
                console.error('Ошибка при получении списков:', err);
                return res.status(500).json({ error: 'Ошибка сервера при получении списка' });
            }
            res.status(200).json({
                items: rows,
                totalItems: totalItems,
                currentPage: page
            });
        });
    });
});

app.post('/api/user/:id/lists', (req, res) => {
    const userId = req.params.id;
    const { category, title, poster, rating } = req.body;
    if (!["Просмотрено", "Смотрю", "Брошено", "Планирую", "В избранном", "Пересматриваю", "На паузе", "Не интересно"].includes(category)) {
        return res.status(400).json({ error: 'Недопустимая категория' });
    }
    const ratingValue = rating !== undefined && rating !== null ? parseInt(rating) : 0;
    if (ratingValue < 0 || ratingValue > 10) {
        return res.status(400).json({ error: 'Рейтинг должен быть от 0 до 10' });
    }

    db.run(
        'INSERT INTO user_lists (user_id, category, title, poster, rating) VALUES (?, ?, ?, ?, ?)',
        [userId, category, title, poster, ratingValue],
        function (err) {
            if (err) {
                console.error('Ошибка при добавлении в список:', err);
                return res.status(500).json({ error: 'Ошибка добавления в список' });
            }
            res.status(200).json({ id: this.lastID, category, title, poster, rating: ratingValue });
        }
    );
});

app.delete('/api/user/:id/lists/:item_id', (req, res) => {
    const userId = req.params.id;
    const itemId = req.params.item_id;
    db.run('DELETE FROM user_lists WHERE user_id = ? AND item_id = ?', [userId, itemId], function(err) {
        if (err) {
            console.error('Ошибка при удалении из списка:', err);
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
        const ratingValue = parseInt(rating);
        if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10) {
             return res.status(400).json({ error: 'Рейтинг должен быть числом от 0 до 10' });
        }
        updates.push('rating = ?');
        params.push(ratingValue);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'Не указаны данные для обновления' });
    }

    query += updates.join(', ') + ' WHERE user_id = ? AND item_id = ?';
    params.push(userId, itemId);

    db.run(query, params, function(err) {
        if (err) {
            console.error('Ошибка при обновлении элемента списка:', err);
            return res.status(500).json({ error: 'Ошибка обновления элемента списка' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Элемент не найден для обновления' });
        }
        res.status(200).json({ message: 'Элемент списка успешно обновлён' });
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
