const db = require('../db/db'); // подключение к БД

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
        const userId = req.user.userId; // Берем из токена, а не из параметров
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

const createOperation = async (req, res) => {
    try {
        const { amount, category, description, operation_type_id, created_at } = req.body;
        const user_id = req.user.userId; // Из JWT токена

        // Валидация
        if (!amount || !category || !operation_type_id) {
            return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
        }

        if (isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Сумма должна быть положительным числом' });
        }

        // Находим category_id по названию категории для данного пользователя
        const [categoryRows] = await db.execute(
            `SELECT id FROM Category WHERE user_id = ? AND name = ?`,
            [user_id, category]
        );

        let category_id;

        if (categoryRows.length === 0) {
            // Категория не найдена - создаем новую
            console.log(`Создаем новую категорию "${category}" для пользователя ${user_id}`);
            
            const [categoryResult] = await db.execute(
                `INSERT INTO Category (user_id, name) VALUES (?, ?)`,
                [user_id, category]
            );
            
            category_id = categoryResult.insertId;
        } else {
            // Категория найдена - используем существующую
            category_id = categoryRows[0].id;
        }

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
                created_at || new Date()
            ]
        );

        // Получаем созданную операцию с join'ами
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
            created_at: operation.created_at,
            operation: operation.operation_type_name,
            category: operation.category_name,
            message: 'Операция успешно создана'
        });

    } catch (err) {
        console.error('Create operation error:', err);
        
        // Более детальная обработка ошибок
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Категория с таким названием уже существует' });
        }
        
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllOperations,
    getOperationById,
    getOperationsByUserId,
    createOperation 
};

