const db = require('../db/db'); // подключение к БД

// Получить все категории
const getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT id, name FROM category`);

        const categories = rows.map(category => ({
            id: category.id,
            name: category.name,
        }))

        return res.status(200).json(categories);

    }   catch (err) {
        console.error('Get all categories error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
    
};

// Получить категорию по ID
const getCategoryById = async (req, res) => {
    try {
        const categoryId = req.params.id;

        const [rows] = await db.execute(
            `SELECT id, name FROM Category WHERE id = ?`,
            [categoryId]
        );

        if (rows.length === 0) {
            return res.status(403).json({ error: 'Категория не найдена!' });
        }

        const category = rows[0];

        return res.status(200).json({
            id: category.id,
            name: category.name
        });

    }   catch (err) {
        console.error('Get category error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
};

module.exports = {
    getAllCategories,
    getCategoryById
};