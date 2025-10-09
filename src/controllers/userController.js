const db = require('../db/db'); // подключение к БД

// Получить всех пользователей
const getAllUsers = (req, res) => {
    const query = 'SELECT id, login, email FROM User';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Ошибка сервера' });
        }
        res.json(results);
    });
};

// Создать пользователя
const createUser = (req, res) => {
    const { login, email, password } = req.body;

    if (!login || !email || !password) {
        return res.status(400).json({ error: 'Все поля обязательны' });
    }

    const query = 'INSERT INTO User (role_id, login, password, email, currency_id) VALUES (?, ?, ?, ?, ?)';
    // Предполагаем, что валюта по умолчанию — RUB (id = 1)
    db.query(query, [1, login, password, email, 1], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Не удалось создать пользователя' });
        }
        res.status(201).json({ message: 'Пользователь создан', id: result.insertId });
    });
};

// Получить пользователя по ID
const getUserById = (req, res) => {
    const userId = req.params.id;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }


    const query = `
        SELECT 
            u.id, 
            u.login, 
            u.email, 
            u.is_premium, 
            u.currency_id, 
            r.name as role, 
            cs.name as color_scheme
        FROM User u
        LEFT JOIN Role r ON u.role_id = r.id
        LEFT JOIN ColorScheme cs ON u.ColorScheme_id = cs.id  
        LEFT JOIN Currency c ON u.currency_id = c.id 
        WHERE u.id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка БД при получении пользователя:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json(results[0]);
    });
};

// Обновить пользователя по ID
const updateUser = (req, res) => {
    const userId = req.params.id;
    const { login, email, password, is_premium, role_id, ColorScheme_id } = req.body;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }

    if (!login && !email && !password && is_premium === undefined && role_id === undefined && ColorScheme_id === undefined) {
        return res.status(400).json({ error: 'Нет данных для обновления' });
    }

    let fields = [];
    let values = [];

    if (login !== undefined) { fields.push('login = ?'); values.push(login); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (password !== undefined) { fields.push('password = ?'); values.push(password); }
    if (is_premium !== undefined) { fields.push('is_premium = ?'); values.push(is_premium); }
    if (role_id !== undefined) { fields.push('role_id = ?'); values.push(role_id); }
    if (ColorScheme_id !== undefined) { fields.push('ColorScheme_id = ?'); values.push(ColorScheme_id); }

    values.push(userId);

    const query = `
        UPDATE User 
        SET ${fields.join(', ')}
        WHERE id = ?
    `;

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Ошибка обновления:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Пользователь не найден или не изменён' });
        }

        res.json({ message: 'Пользователь успешно обновлён', id: userId });
    });
};

// Удалить пользователя по ID
const deleteUser = (req, res) => {
    const userId = req.params.id;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID должен быть числом' });
    }

    const query = 'DELETE FROM User WHERE id = ?';

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Ошибка удаления:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        res.json({ message: 'Пользователь успешно удалён', id: userId });
    });
};

module.exports = { 
    getAllUsers,
    createUser,
    getUserById, 
    updateUser,    
    deleteUser 
};