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



// Получить все операции пользователя по его ID
const getOperationsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (isNaN(userId)) {
            return res.status(400).json({ error: 'ID пользователя должен быть числом' });
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
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC`
        );

        if (rows.length === 0) {
            return res.status(409).json({ error: 'Уведомления пользователя не найдены!' });
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
        console.error('Get operations by user id error:', err);
        return res.status(500).json({ error: 'Internal server error' })
    }
};

module.exports = {
    getAllOperations,
    getOperationById,
    getOperationsByUserId
};

