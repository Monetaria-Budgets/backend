const jwt = require('jsonwebtoken');
const db = require('../models/db');

const register = (req, res) => {
    const { login, email, password } = req.body;

    if (!login || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const query = 'INSERT INTO User ( login, password, email) VALUES (?, ?, ?)';
    db.query(query, [login, password, email], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Логин или email уже заняты' });
            }
            return res.status(500).json({ error: 'Ошибка сервера при регистрации' });
        }
        res.status(201).json({ message: 'Пользователь успешно зарегистрирован', id: result.insertId });
    });
};

const login = (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ error: 'Логин и пароль обязательны' });
    }

    const query = 'SELECT id, login, password FROM User WHERE login = ?';
    db.query(query, [login], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const user = results[0];
        // ⚠️ Без хеширования — просто сравнение
        if (user.password !== password) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        // Генерация JWT
        const token = jwt.sign(
            { userId: user.id, login: user.login },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ message: 'Успешный вход', token });
    });
};

module.exports = { register, login };