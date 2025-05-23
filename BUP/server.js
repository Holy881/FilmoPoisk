const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

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

    const newPath = path.join('uploads', `avatar-${userId}${path.extname(file.originalname)}`);
    fs.rename(file.path, newPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сохранения файла' });
        }

        const avatarUrl = `/uploads/avatar-${userId}${path.extname(file.originalname)}`;
        db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Ошибка обновления аватара' });
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

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (err) => {
            if (err) {
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

    if (!value || value.length < 3) {
        return res.status(400).json({ error: `${field === 'username' ? 'Имя пользователя' : 'Email'} должен содержать минимум 3 символа` });
    }

    if (field === 'email' && !value.includes('@')) {
        return res.status(400).json({ error: 'Неверный формат email' });
    }

    db.run(`UPDATE users SET ${field} = ? WHERE id = ?`, [value, userId], function(err) {
        if (err) {
            return res.status(400).json({ error: `Такой ${field === 'username' ? 'имя пользователя' : 'email'} уже существует` });
        }
        res.status(200).json({ message: 'Данные успешно обновлены' });
    });
});

app.get('/api/user/:id/lists', (req, res) => {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;

    // Сначала получаем общее количество элементов
    db.get('SELECT COUNT(*) as total FROM user_lists WHERE user_id = ?', [userId], (err, countResult) => {
        if (err) {
            console.error('Ошибка при подсчёте элементов:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        const totalItems = countResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        // Получаем элементы с учётом пагинации
        db.all(
            'SELECT item_id AS id, category, title, poster, rating FROM user_lists WHERE user_id = ? LIMIT ? OFFSET ?',
            [userId, limit, offset],
            (err, rows) => {
                if (err) {
                    console.error('Ошибка при получении списков:', err);
                    return res.status(500).json({ error: 'Ошибка сервера' });
                }

                res.status(200).json({
                    items: rows,
                    totalItems: totalItems,
                    totalPages: totalPages,
                    currentPage: page
                });
            }
        );
    });
});

app.post('/api/user/:id/lists', (req, res) => {
    const userId = req.params.id;
    const { category, title, poster } = req.body;
    if (!["Просмотрено", "Смотрю", "Брошено", "Планирую", "В избранном", "Пересматриваю", "На паузе", "Не интересно"].includes(category)) {
        return res.status(400).json({ error: 'Недопустимая категория' });
    }
    db.run(
        'INSERT INTO user_lists (user_id, category, title, poster) VALUES (?, ?, ?, ?)',
        [userId, category, title, poster],
        function (err) {
            if (err) {
                console.error('Ошибка при добавлении в список:', err);
                return res.status(500).json({ error: 'Ошибка добавления в список' });
            }
            res.status(200).json({ id: this.lastID });
        }
    );
});

app.delete('/api/user/:id/lists/:item_id', (req, res) => {
    const userId = req.params.id;
    const itemId = req.params.item_id;
    db.run('DELETE FROM user_lists WHERE user_id = ? AND item_id = ?', [userId, itemId], (err) => {
        if (err) {
            console.error('Ошибка при удалении из списка:', err);
            return res.status(500).json({ error: 'Ошибка удаления из списка' });
        }
        res.status(200).json({ message: 'Элемент удалён' });
    });
});

app.put('/api/user/:id/lists/:item_id', (req, res) => {
    const userId = req.params.id;
    const itemId = req.params.item_id;
    const { category, rating } = req.body;

    if (category) {
        if (!["Просмотрено", "Смотрю", "Брошено", "Планирую", "В избранном", "Пересматриваю", "На паузе", "Не интересно"].includes(category)) {
            return res.status(400).json({ error: 'Недопустимая категория' });
        }
        db.run('UPDATE user_lists SET category = ? WHERE user_id = ? AND item_id = ?', [category, userId, itemId], (err) => {
            if (err) {
                console.error('Ошибка при обновлении категории:', err);
                return res.status(500).json({ error: 'Ошибка обновления категории' });
            }
            res.status(200).json({ message: 'Категория обновлена' });
        });
    } else if (rating !== undefined) {
        db.run('UPDATE user_lists SET rating = ? WHERE user_id = ? AND item_id = ?', [rating, userId, itemId], (err) => {
            if (err) {
                console.error('Ошибка при обновлении рейтинга:', err);
                return res.status(500).json({ error: 'Ошибка обновления рейтинга' });
            }
            res.status(200).json({ message: 'Рейтинг обновлен' });
        });
    } else {
        res.status(400).json({ error: 'Не указаны данные для обновления' });
    }
});

app.use('/uploads', express.static('uploads'));

app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});