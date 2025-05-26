// server.js

// Импорт необходимых модулей
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const axios = require('axios'); // Раскомментируйте, когда будете добавлять TMDB

// Загрузка переменных окружения (если используете .env файл для TMDB_API_KEY)
// require('dotenv').config(); // Раскомментируйте, если используете dotenv

const app = express();

// Middleware
app.use(cors()); // Разрешает CORS-запросы
app.use(express.json()); // Для парсинга JSON-тел запросов

// --- TMDB Конфигурация (раскомментируйте и заполните, когда будете готовы) ---
// const TMDB_API_KEY = process.env.TMDB_API_KEY || 'ВАШ_TMDB_API_КЛЮЧ_V3';
// const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
// if (!TMDB_API_KEY || TMDB_API_KEY === 'ВАШ_TMDB_API_КЛЮЧ_V3') {
//     console.warn('ВНИМАНИЕ: API ключ TMDB не настроен или используется ключ-заглушка!');
// }
// --- Конец TMDB Конфигурации ---

// --- НАСТРОЙКА ПАПКИ ДЛЯ ЗАГРУЗОК ---
const UPLOADS_DIR = path.join(__dirname, 'uploads'); // Используем path.join для кроссплатформенности
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true }); // Создаем папку, если ее нет
}
const upload = multer({ dest: UPLOADS_DIR }); // Настройка multer для сохранения файлов в UPLOADS_DIR

// --- РАЗДАЧА СТАТИЧЕСКИХ ФАЙЛОВ ---
// Все файлы из папки 'public' (css, js, images и т.д.) будут доступны по URL от корня сайта.
// Например, файл Project/public/css/style.css будет доступен как http://localhost:3000/css/style.css
app.use(express.static(path.join(__dirname, 'public')));

// Раздача загруженных файлов из папки 'uploads' по URL /uploads
// Например, файл Project/uploads/avatar.jpg будет доступен как http://localhost:3000/uploads/avatar.jpg
app.use('/uploads', express.static(UPLOADS_DIR));


// --- МАРШРУТЫ ДЛЯ ОТДАЧИ HTML-СТРАНИЦ ---
// Эти маршруты позволяют использовать "чистые" URL без /html/ и .html в адресной строке
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'home.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'auth.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'profile.html'));
});

// Добавьте сюда маршрут для media-details.html, когда он будет готов
// app.get('/media-details', (req, res) => { // Или, например, /movie/:tmdbId
//     res.sendFile(path.join(__dirname, 'public', 'html', 'media-details.html'));
// });


// --- ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ SQLITE ---
// Предполагается, что database.db находится в корне проекта.
// Если вы переместили БД, например, в папку 'server', измените путь: path.join(__dirname, 'server', 'database.db')
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite по пути:', dbPath);
        // Включение поддержки внешних ключей
        db.run('PRAGMA foreign_keys = ON', (pragmaErr) => {
            if (pragmaErr) {
                console.error('Ошибка при включении внешних ключей:', pragmaErr);
            } else {
                console.log('Внешние ключи включены.');
            }
        });
        // Создание таблицы пользователей, если она не существует
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            avatar TEXT
        )`);
        // Создание таблицы списков пользователя, если она не существует
        // Раскомментируйте и добавьте поля tmdb_id и media_type, когда будете интегрировать TMDB
        db.run(`CREATE TABLE IF NOT EXISTS user_lists (
            item_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            -- tmdb_id INTEGER,
            -- media_type TEXT, -- 'movie' или 'tv'
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            poster TEXT,
            rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 10),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
    }
});

// --- API МАРШРУТЫ ---

// Регистрация пользователя
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword],
            function (err) {
                if (err) {
                    // Обработка ошибки уникальности (UNIQUE constraint failed)
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Пользователь с таким email или именем уже существует' });
                    }
                    console.error('Ошибка регистрации:', err);
                    return res.status(500).json({ error: 'Ошибка сервера при регистрации' });
                }
                res.status(201).json({ id: this.lastID, username: username }); // Возвращаем 201 Created
            }
        );
    } catch (error) {
        console.error('Ошибка хеширования пароля:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// Вход пользователя
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email и пароль обязательны' });
    }
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Ошибка при поиске пользователя:', err);
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

// Получение данных пользователя
app.get('/api/user/:id', (req, res) => {
    const userId = req.params.id;
    db.get('SELECT id, username, email, avatar FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Ошибка получения данных пользователя:', err);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        res.status(200).json(user);
    });
});

// Обновление аватара пользователя
app.post('/api/user/:id/avatar', upload.single('avatar'), (req, res) => {
    const userId = req.params.id;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'Файл не загружен' });
    }

    // Сначала получаем старый путь к аватару, чтобы его удалить
    db.get('SELECT avatar FROM users WHERE id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Ошибка получения старого аватара:', err);
            // Продолжаем, но не удаляем старый аватар
        }
        if (user && user.avatar && user.avatar !== '/images/default-avatar.png' && user.avatar.startsWith(`/uploads/`)) {
            // Формируем полный путь к старому файлу на сервере
            const oldAvatarPath = path.join(__dirname, user.avatar); // user.avatar уже содержит /uploads/
            fs.unlink(oldAvatarPath, (unlinkErr) => {
                if (unlinkErr && unlinkErr.code !== 'ENOENT') { // Игнорируем ошибку, если файл не найден
                    console.error('Ошибка удаления старого аватара:', unlinkErr);
                }
            });
        }

        // Путь к файлу после загрузки multer'ом находится в file.path
        // Мы должны переместить его в uploads с нужным именем
        const newFileName = `avatar-${userId}-${Date.now()}${path.extname(file.originalname)}`;
        const newFilePathInUploads = path.join(UPLOADS_DIR, newFileName); // Полный путь на диске

        fs.rename(file.path, newFilePathInUploads, (renameErr) => {
            if (renameErr) {
                console.error('Ошибка перемещения загруженного файла:', renameErr);
                // Попытка удалить временный файл multer, если перемещение не удалось
                fs.unlink(file.path, (tempUnlinkErr) => {
                    if (tempUnlinkErr) console.error('Ошибка удаления временного файла multer:', tempUnlinkErr);
                });
                return res.status(500).json({ error: 'Ошибка сохранения файла аватара' });
            }

            const avatarUrlForDB = `/uploads/${newFileName}`; // URL для сохранения в БД и использования на клиенте
            db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrlForDB, userId], (dbErr) => {
                if (dbErr) {
                    console.error('Ошибка обновления аватара в БД:', dbErr);
                    return res.status(500).json({ error: 'Ошибка обновления аватара в базе данных' });
                }
                res.status(200).json({ avatarUrl: avatarUrlForDB });
            });
        });
    });
});

// Смена пароля
app.post('/api/user/:id/password', async (req, res) => {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Текущий и новый пароли обязательны' });
    }
    if (newPassword.length < 6) { // Пример минимальной длины пароля
        return res.status(400).json({ error: 'Новый пароль должен содержать минимум 6 символов' });
    }

    db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, user) => {
        if (err) { return res.status(500).json({ error: 'Ошибка сервера' }); }
        if (!user) { return res.status(404).json({ error: 'Пользователь не найден' }); }

        try {
            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                return res.status(400).json({ error: 'Текущий пароль неверен' });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], (dbErr) => {
                if (dbErr) { return res.status(500).json({ error: 'Ошибка обновления пароля' }); }
                res.status(200).json({ message: 'Пароль успешно изменён' });
            });
        } catch (compareErr) {
            res.status(500).json({ error: 'Ошибка сервера при смене пароля' });
        }
    });
});

// Обновление имени пользователя или email
app.post('/api/user/:id/update', (req, res) => {
    const userId = req.params.id;
    const { field, value } = req.body;

    if (!['username', 'email'].includes(field)) {
        return res.status(400).json({ error: 'Недопустимое поле для обновления' });
    }
    if (!value || String(value).trim().length < 3) { // Пример валидации
        return res.status(400).json({ error: `Поле '${field}' должно содержать минимум 3 символа` });
    }
    if (field === 'email' && !String(value).includes('@')) { // Простая проверка email
        return res.status(400).json({ error: 'Некорректный формат email' });
    }

    const sql = `UPDATE users SET ${field} = ? WHERE id = ?`;
    db.run(sql, [String(value).trim(), userId], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: `Это ${field === 'username' ? 'имя пользователя' : 'email'} уже занято` });
            }
            return res.status(500).json({ error: 'Ошибка обновления данных пользователя' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Пользователь не найден для обновления' });
        }
        res.status(200).json({ message: 'Данные успешно обновлены' });
    });
});


// Получение списков пользователя
app.get('/api/user/:id/lists', (req, res) => {
    const userId = req.params.id;
    const categoryQueryParam = req.query.category;
    const sortQueryParam = req.query.sort || 'date_desc'; // Сортировка по умолчанию
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12; // Количество элементов на странице
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as total FROM user_lists WHERE user_id = ?';
    // Обновите SELECT для включения tmdb_id и media_type, когда они будут в БД
    let itemsQuery = 'SELECT item_id AS id, category, title, poster, rating FROM user_lists WHERE user_id = ?';
    const countQueryParams = [userId];
    const itemsQueryParams = [userId];

    if (categoryQueryParam && categoryQueryParam !== 'Все категории') {
        countQuery += ' AND category = ?';
        itemsQuery += ' AND category = ?';
        countQueryParams.push(categoryQueryParam);
        itemsQueryParams.push(categoryQueryParam);
    }

    let orderByClause = '';
    switch (sortQueryParam) {
        case 'none': orderByClause = ' ORDER BY item_id DESC'; break;
        case 'date_asc': orderByClause = ' ORDER BY item_id ASC'; break;
        case 'title_asc': orderByClause = ' ORDER BY title ASC'; break;
        case 'title_desc': orderByClause = ' ORDER BY title DESC'; break;
        case 'rating_asc': orderByClause = ' ORDER BY rating ASC, title ASC'; break;
        case 'rating_desc': orderByClause = ' ORDER BY rating DESC, title ASC'; break;
        case 'date_desc': default: orderByClause = ' ORDER BY item_id DESC'; break;
    }
    itemsQuery += orderByClause;
    itemsQuery += ' LIMIT ? OFFSET ?';
    itemsQueryParams.push(limit, offset);

    db.get(countQuery, countQueryParams, (err, countResult) => {
        if (err) { return res.status(500).json({ error: 'Ошибка сервера при подсчёте элементов' }); }
        const totalItems = countResult ? countResult.total : 0;

        db.all(itemsQuery, itemsQueryParams, (err, rows) => {
            if (err) { return res.status(500).json({ error: 'Ошибка сервера при получении списка' }); }
            res.status(200).json({
                items: rows,
                totalItems: totalItems,
                currentPage: page,
                totalPages: Math.ceil(totalItems / limit)
            });
        });
    });
});

// Добавление элемента в список пользователя
app.post('/api/user/:id/lists', (req, res) => {
    const userId = req.params.id;
    // Добавьте tmdb_id, media_type когда будете готовы
    const { category, title, poster, rating /*, tmdb_id, media_type */ } = req.body;

    if (!category || !title) {
        return res.status(400).json({ error: 'Категория и название обязательны' });
    }
    if (!["Просмотрено", "Смотрю", "Брошено", "Планирую", "В избранном", "Пересматриваю", "На паузе", "Не интересно"].includes(category)) {
        return res.status(400).json({ error: 'Недопустимая категория' });
    }
    const ratingValue = (rating !== undefined && rating !== null && !isNaN(parseInt(rating))) ? parseInt(rating) : 0;
    if (ratingValue < 0 || ratingValue > 10) {
        return res.status(400).json({ error: 'Рейтинг должен быть от 0 до 10' });
    }

    // Обновите SQL для включения tmdb_id и media_type
    const sql = 'INSERT INTO user_lists (user_id, category, title, poster, rating) VALUES (?, ?, ?, ?, ?)';
    const params = [userId, category, title, poster, ratingValue];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Ошибка при добавлении в список:', err);
            return res.status(500).json({ error: 'Ошибка добавления в список' });
        }
        res.status(201).json({ id: this.lastID, category, title, poster, rating: ratingValue });
    });
});

// Удаление элемента из списка
app.delete('/api/user/:id/lists/:item_id', (req, res) => {
    const userId = req.params.id;
    const itemId = req.params.item_id;
    db.run('DELETE FROM user_lists WHERE user_id = ? AND item_id = ?', [userId, itemId], function(err) {
        if (err) { return res.status(500).json({ error: 'Ошибка удаления из списка' }); }
        if (this.changes === 0) { return res.status(404).json({ error: 'Элемент не найден для удаления' }); }
        res.status(200).json({ message: 'Элемент удалён' });
    });
});

// Обновление элемента в списке (категория, рейтинг)
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
        if (err) { return res.status(500).json({ error: 'Ошибка обновления элемента списка' }); }
        if (this.changes === 0) { return res.status(404).json({ error: 'Элемент не найден для обновления' }); }
        res.status(200).json({ message: 'Элемент списка успешно обновлён' });
    });
});


// --- ЗАПУСК СЕРВЕРА ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
