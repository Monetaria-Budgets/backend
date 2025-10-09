const db = require('../models/db'); // подключение к БД

// Получить все категории
const getAllCategories = (req, res) => {
    const query = 'SELECT id, name, FROM Category';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении категорий:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при получении категорий' });
        }
        res.json(results);
    });
};

// Получить категорию по ID
const getCategoryById = (req, res) => {
    const categoryId = req.params.id;

    if (isNaN(categoryId)) {
        return res.status(400).json({ error: 'ID категории должен быть числом' });
    }

    const query = 'SELECT id, name, FROM Category WHERE id = ?';
    db.query(query, [categoryId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении категории:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при получении категории' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Категория не найдена' });
        }
        res.json(results[0]);
    });
};

module.exports = {
    getAllCategories,
    getCategoryById
};