// controllers/operation.controller.js
const db = require('../db/db');

// Получить все операции
const getAllOperations = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
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
            LEFT JOIN OperationType ot ON o.operation_type_id = ot.id`
        );

        if (rows.length === 0) {
            return res.status(409).json({ error: 'Операции не найдены' });
        }

        const operations = rows.map(operation => ({
            id: operation.id,
            user_id: operation.user_id,
            description: operation.description,
            amount: operation.amount,
            created_at: operation.created_at,
            operation: operation.operation_type_name,
            category: operation.category_name
        }));

        return res.status(200).json(operations);

    }   catch (err) {
        console.error('Get all operations error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
};

// Получить операцию по ID
const getOperationById = async (req, res) => {
    try {
        const operationId = req.params.id;

        if (isNaN(operationId)) {
            return res.status(400).json({ error: 'ID операции должен быть числом' });
        }

        const [rows] = await db.execute(
            `SELECT 
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
            WHERE o.id = ?`
        );

        if (rows.length === 0) {
            return res.status(409).json({ error: 'Операции не найдены' });
        }

        const operation = rows[0];

        return res.status(200).json({
            id: operation.id,
            user_id: operation.user_id,
            description: operation.description,
            amount: operation.amount,
            created_at: operation.created_at,
            operation: operation.operation_type_name,
            category: operation.category_name
        });

    }   catch (err) {
        console.error('Get operation error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
};

// Получить операции пользователя с фильтрами
const getOperationsByUserId = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate, category, type } = req.query;

        console.log('🟡 Fetching operations for user:', userId);
        console.log('🟡 Filters:', { startDate, endDate, category, type });

        let query = `
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
        `;

        const params = [userId];

        // Добавляем фильтры
        if (startDate) {
            query += ' AND o.created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            query += ' AND o.created_at <= ?';
            params.push(endDate);
        }

        if (category) {
            query += ' AND c.name = ?';
            params.push(category);
        }

        if (type) {
            const typeId = type === 'income' ? 1 : 2;
            query += ' AND o.operation_type_id = ?';
            params.push(typeId);
        }

        query += ' ORDER BY o.created_at DESC';

        console.log('🟡 SQL Query:', query);
        console.log('🟡 SQL Params:', params);

        const [rows] = await db.execute(query, params);

        console.log('🟢 Found operations:', rows.length);

        const operations = rows.map(operation => ({
            id: operation.id,
            user_id: operation.user_id,
            description: operation.description,
            amount: operation.amount,
            created_at: operation.created_at,
            operation: operation.operation_type_name,
            category: operation.category_name
        }));

        return res.status(200).json(operations);

    } catch (err) {
        console.error('🔴 Get operations by user id error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// 🔥 ИСПРАВЛЕННАЯ функция создания операции
const createOperation = async (req, res) => {
    try {
        const { amount, category, description, operation_type_id, created_at } = req.body;
        const user_id = req.user.userId;

        console.log('📥 Received operation data:', {
            amount, category, description, operation_type_id, created_at
        });

        // Валидация
        if (!amount || !category || !operation_type_id) {
            return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
        }

        if (isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Сумма должна быть положительным числом' });
        }

        // Находим или создаем категорию
        const [categoryRows] = await db.execute(
            `SELECT id FROM Category WHERE user_id = ? AND name = ?`,
            [user_id, category]
        );

        let category_id;

        if (categoryRows.length === 0) {
            const [categoryResult] = await db.execute(
                `INSERT INTO Category (user_id, name) VALUES (?, ?)`,
                [user_id, category]
            );
            category_id = categoryResult.insertId;
        } else {
            category_id = categoryRows[0].id;
        }

        // 🔥 ПРОСТО используем дату как есть от пользователя
        let operationDate = created_at;
        
        if (!operationDate) {
            // Если дата не указана, используем текущее время
            const now = new Date();
            // Форматируем так же как на фронтенде
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            operationDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }

        console.log('📅 Saving operation date as is:', operationDate);

        // Создаем операцию
        const [result] = await db.execute(
            `INSERT INTO Operation (user_id, category_id, operation_type_id, description, amount, created_at) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                category_id,
                operation_type_id,
                description || null,
                parseFloat(amount),
                operationDate
            ]
        );

        console.log('✅ Operation created with id:', result.insertId);

        // Получаем созданную операцию
        const [newOperationRows] = await db.execute(
            `SELECT 
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
            WHERE o.id = ?`,
            [result.insertId]
        );

        const operation = newOperationRows[0];

        return res.status(201).json({
            id: operation.id,
            user_id: operation.user_id,
            description: operation.description,
            amount: operation.amount,
            created_at: operation.created_at, // 🔥 Возвращаем как есть из БД
            operation: operation.operation_type_name,
            category: operation.category_name,
            message: 'Операция успешно создана'
        });

    } catch (err) {
        console.error('🔴 Create operation error:', err);
        console.error('🔴 Error details:', err.message);
        
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

module.exports = {
    getAllOperations,
    getOperationById,
    getOperationsByUserId,
    createOperation 
};