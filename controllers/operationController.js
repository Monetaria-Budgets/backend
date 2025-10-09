const db = require('../models/db'); // подключение к БД

// Получить все операции
const getAllOperations = (req, res) => {
    const query = `
        SELECT 
            o.id,
            o.user_id,
            o.category_id,
            o.operation_type_id,
            o.description,
            o.amount,
            o.created_at,
            c.name as category_name,
            ot.name as operation_type_name
        FROM Operation o
        LEFT JOIN Category c ON o.category_id = c.id
        LEFT JOIN OperationType ot ON o.operation_type_id = ot.id
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Ошибка при получении операций:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при получении операций' });
        }
        res.json(results);
    });
};

// Получить операцию по ID
const getOperationById = (req, res) => {
    const operationId = req.params.id;

    if (isNaN(operationId)) {
        return res.status(400).json({ error: 'ID операции должен быть числом' });
    }

    const query = `
        SELECT 
            o.id,
            o.user_id,
            o.category_id,
            o.operation_type_id,
            o.description,
            o.amount,
            o.created_at,
            c.name as category_name,
            ot.name as operation_type_name
        FROM Operation o
        LEFT JOIN Category c ON o.category_id = c.id
        LEFT JOIN OperationType ot ON o.operation_type_id = ot.id
        WHERE o.id = ?
    `;
    db.query(query, [operationId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении операции:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при получении операции' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Операция не найдена' });
        }
        res.json(results[0]);
    });
};



// Получить все операции пользователя по его ID
const getOperationsByUserId = (req, res) => {
    const userId = req.params.userId;

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID пользователя должен быть числом' });
    }

    const query = `
        SELECT 
            o.id,
            o.user_id,
            o.category_id,
            o.operation_type_id,
            o.description,
            o.amount,
            o.created_at,
            c.name as category_name,
            ot.name as operation_type_name
        FROM Operation o
        LEFT JOIN Category c ON o.category_id = c.id
        LEFT JOIN OperationType ot ON o.operation_type_id = ot.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Ошибка при получении операций пользователя:', err.message);
            return res.status(500).json({ error: 'Ошибка сервера при получении операций' });
        }
        res.json(results);
    });
};

module.exports = {
    getAllOperations,
    getOperationById,
    getOperationsByUserId // <-- добавляем новый метод
};

