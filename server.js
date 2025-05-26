// server.js
require('dotenv').config(); // Для загрузки переменных из .env файла

// Импорт необходимых модулей
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors =require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- TMDB Конфигурация ---
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

if (!TMDB_API_KEY) {
    console.error('КРИТИЧЕСКАЯ ОШИБКА: API ключ TMDB не найден в переменных окружения (TMDB_API_KEY). Запросы к TMDB не будут работать.');
}
// --- Конец TMDB Конфигурации ---

// --- НАСТРОЙКА ПАПКИ ДЛЯ ЗАГРУЗОК ---
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const upload = multer({ dest: UPLOADS_DIR });

// --- РАЗДАЧА СТАТИЧЕСКИХ ФАЙЛОВ ---
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// --- МАРШРУТЫ ДЛЯ ОТДАЧИ HTML-СТРАНИЦ ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'home.html'));
});
app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'auth.html'));
});
app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'html', 'profile.html'));
});
app.get('/watch.html', (req, res) => {
    res.status(404).send(`Страница watch.html еще не создана. Запрошен URL: ${req.originalUrl}`);
});

// --- ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ SQLITE ---
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
            media_type TEXT, -- 'movie' или 'tv'
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            poster_path TEXT,
            rating INTEGER DEFAULT NULL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 10)),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )`);
    }
});

// --- API МАРШРУТЫ (пользовательские) ---
// Регистрация пользователя
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

// Вход пользователя
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

// Получение данных пользователя
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

// Обновление аватара пользователя
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

// Смена пароля
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
            if (!match) {
                return res.status(400).json({ error: 'Текущий пароль неверен' });
            }
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

// Обновление имени пользователя или email
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


// Получение списков пользователя
app.get('/api/user/:id/lists', (req, res) => {
    const userId = req.params.id;
    const categoryQueryParam = req.query.category;
    const sortQueryParam = req.query.sort || 'date_desc';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as total FROM user_lists WHERE user_id = ?';
    let itemsQuery = 'SELECT item_id AS id, user_id, tmdb_id, media_type, category, title, poster_path, rating FROM user_lists WHERE user_id = ?';
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
        case 'title_asc': orderByClause = ' ORDER BY LOWER(title) ASC'; break;
        case 'title_desc': orderByClause = ' ORDER BY LOWER(title) DESC'; break;
        case 'rating_asc': orderByClause = ' ORDER BY rating ASC, LOWER(title) ASC'; break;
        case 'rating_desc': orderByClause = ' ORDER BY rating DESC, LOWER(title) ASC'; break;
        case 'date_desc': default: orderByClause = ' ORDER BY item_id DESC'; break;
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

// Добавление элемента в список пользователя
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
        return res.status(400).json({ error: 'Рейтинг должен быть от 0 до 10' });
    }
    if (!['movie', 'tv'].includes(media_type)) {
        return res.status(400).json({ error: 'Недопустимый тип медиа. Должен быть "movie" или "tv".' });
    }

    db.get('SELECT item_id FROM user_lists WHERE user_id = ? AND tmdb_id = ? AND media_type = ?', [userId, tmdb_id, media_type], (err, existingItem) => {
        if (err) {
            console.error('Ошибка проверки дубликата в списке:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при добавлении в список' });
        }
        if (existingItem) {
            return res.status(409).json({ error: 'Этот элемент уже есть в одном из ваших списков.' });
        }

        const sql = 'INSERT INTO user_lists (user_id, tmdb_id, media_type, category, title, poster_path, rating) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const params = [userId, tmdb_id, media_type, category, title, poster_path, ratingValue];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Ошибка при добавлении в список:', err.message);
                return res.status(500).json({ error: 'Ошибка добавления в список' });
            }
            res.status(201).json({
                item_id: this.lastID, user_id: Number(userId), tmdb_id: tmdb_id,
                media_type: media_type, category: category, title: title,
                poster_path: poster_path, rating: ratingValue
            });
        });
    });
});

// Удаление элемента из списка
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
        const ratingValue = (rating === null || String(rating).trim() === '') ? null : parseInt(rating);
        if (ratingValue !== null && (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 10)) {
             return res.status(400).json({ error: 'Рейтинг должен быть числом от 0 до 10 или отсутствовать' });
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
            console.error('Ошибка при обновлении элемента списка:', err.message);
            return res.status(500).json({ error: 'Ошибка обновления элемента списка' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Элемент не найден или данные не изменены' });
        }
        res.status(200).json({ message: 'Элемент списка успешно обновлён' });
    });
});


// --- TMDB API МАРШРУТЫ ---

// Получение списка жанров для фильмов или сериалов
app.get('/api/tmdb/genres/:type', async (req, res) => {
    const { type } = req.params;
    const language = req.query.language || 'ru-RU';

    if (type !== 'movie' && type !== 'tv') {
        return res.status(400).json({ error: "Неверный тип для жанров. Используйте 'movie' или 'tv'." });
    }
     if (!TMDB_API_KEY) {
        console.error('TMDB_API_KEY не определен для жанров!');
        return res.status(500).json({ error: 'Ошибка конфигурации сервера: API ключ TMDB не найден.' });
    }

    const tmdbGenreUrl = `${TMDB_BASE_URL}/genre/${type}/list`;
    try {
        const response = await axios.get(tmdbGenreUrl, {
            params: { api_key: TMDB_API_KEY, language: language }
        });
        res.status(200).json(response.data.genres || []);
    } catch (error) {
        console.error(`Ошибка при запросе жанров (${type}) с TMDB:`, error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({ error: `Ошибка при получении жанров ${type} от TMDB.` });
    }
});


app.get('/api/tmdb/details/:type/:tmdbId', async (req, res) => {
    const { type, tmdbId } = req.params;
    const language = req.query.language || 'ru-RU';

    if (type !== 'movie' && type !== 'tv') {
        return res.status(400).json({ error: "Неверный тип контента. Используйте 'movie' или 'tv'." });
    }
    if (!tmdbId) {
        return res.status(400).json({ error: "TMDB ID не указан." });
    }

    if (!TMDB_API_KEY) {
        console.error('TMDB_API_KEY не определен для деталей!');
        return res.status(500).json({ error: 'Ошибка конфигурации сервера: API ключ TMDB не найден.' });
    }

    const tmdbUrl = `${TMDB_BASE_URL}/${type}/${tmdbId}`;
    try {
        const response = await axios.get(tmdbUrl, {
            params: {
                api_key: TMDB_API_KEY,
                language: language,
                append_to_response: 'credits,videos,images,recommendations,similar,release_dates'
            }
        });
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`Ошибка при запросе к TMDB API (${tmdbUrl}):`,
            error.response ? { status: error.response.status, data: error.response.data } : error.message
        );
        const status = error.response ? error.response.status : 500;
        const message = error.response?.data?.status_message || 'Ошибка при получении данных от TMDB.';
        res.status(status).json({ error: message, details: error.response ? error.response.data : null });
    }
});

// Обновленный маршрут поиска, который принимает все фильтры как query-параметры
app.get('/api/tmdb/search', async (req, res) => {
    const {
        query, // Текстовый запрос
        media_type, // 'movie', 'tv', или 'multi' (для /search) или 'movie', 'tv' (для /discover)
        genres, // Строка ID жанров через запятую, например "28,12"
        year_from, // Год "от"
        year_to, // Год "до"
        rating_from, // Оценка "от"
        rating_to, // Оценка "до"
        page = 1,
        language = 'ru-RU',
        sort_by = 'popularity.desc' // Для /discover
    } = req.query;

    if (!TMDB_API_KEY) {
        return res.status(500).json({ error: 'Ошибка конфигурации сервера: API ключ TMDB не найден.' });
    }

    let tmdbUrl;
    const params = {
        api_key: TMDB_API_KEY,
        language: language,
        page: page,
        include_adult: false
    };

    // Логика выбора между /search и /discover
    if (query) { // Если есть текстовый запрос, используем /search
        const searchType = (media_type === 'movie' || media_type === 'tv') ? media_type : 'multi';
        tmdbUrl = `${TMDB_BASE_URL}/search/${searchType}`;
        params.query = query;
        // Фильтры (genres, year, rating) для /search не очень эффективны и могут игнорироваться TMDB,
        // если они передаются вместе с query. Их лучше применять на клиенте или использовать /discover.
        // Для простоты, если есть query, мы не будем передавать эти фильтры в /search на сервер TMDB.
        // Клиент может отфильтровать результаты /search по жанрам.
    } else if (media_type && (genres || year_from || year_to || rating_from || rating_to)) {
        // Если нет текстового запроса, но есть media_type и хотя бы один другой фильтр, используем /discover
        if (!['movie', 'tv'].includes(media_type)) {
            return res.status(400).json({ error: "Для /discover должен быть указан корректный 'media_type' ('movie' или 'tv')." });
        }
        tmdbUrl = `${TMDB_BASE_URL}/discover/${media_type}`;
        if (genres) params.with_genres = genres;

        // Фильтрация по году для /discover
        if (year_from) {
            params[media_type === 'movie' ? 'primary_release_date.gte' : 'first_air_date.gte'] = `${year_from}-01-01`;
        }
        if (year_to) {
            params[media_type === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte'] = `${year_to}-12-31`;
        }
        // Если указан только год "от", ищем за этот конкретный год
        if (year_from && !year_to) {
             params[media_type === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte'] = `${year_from}-12-31`;
        }
         // Если указан только год "до" (менее типичный случай для discover без "от")
        if (!year_from && year_to) {
            params[media_type === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte'] = `${year_to}-12-31`;
        }


        if (rating_from) params['vote_average.gte'] = rating_from;
        if (rating_to) params['vote_average.lte'] = rating_to;
        params.sort_by = sort_by;
    } else {
        // Если нет ни query, ни media_type с фильтрами для discover
        return res.status(400).json({ error: "Необходимо указать текстовый запрос (query) или тип медиа ('movie'/'tv') и хотя бы один фильтр (жанры, год, оценка)." });
    }

    try {
        console.log(`Запрос к TMDB: URL=${tmdbUrl}, Params=${JSON.stringify(params)}`);
        const response = await axios.get(tmdbUrl, { params });
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`Ошибка при запросе к TMDB API (${tmdbUrl}):`,
            error.response ? { status: error.response.status, data: error.response.data } : error.message
        );
        const status = error.response ? error.response.status : 500;
        const message = error.response?.data?.status_message || 'Ошибка при выполнении поиска на TMDB.';
        res.status(status).json({ error: message, details: error.response ? error.response.data : null });
    }
});


// --- ЗАПУСК СЕРВЕРА ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
