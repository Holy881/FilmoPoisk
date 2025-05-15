const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Ошибка подключения:', err.message);
    } else {
        console.log('Подключено к базе данных SQLite');
    }
});

db.all('SELECT * FROM user_lists', [], (err, rows) => {
    if (err) {
        console.error('Ошибка запроса:', err.message);
    } else {
        console.log('Содержимое таблицы users:');
        console.table(rows);
    }
});

db.close((err) => {
    if (err) {
        console.error('Ошибка закрытия:', err.message);
    } else {
        console.log('Соединение закрыто');
    }
});