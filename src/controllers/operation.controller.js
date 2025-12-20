const db = require('../db/db');

// Получить все операции
const getAllOperations = async (req, res) => {
    try {
        const rows = await db.query(
            `SELECT 
                o.id,
                o.user_id,
                o.category_id,
                o.operation_type_id,
                o.description,
                o.amount,
                o.created_at,
                COALESCE(c.name, o.custom_category) as category_name,
                ot.name as operation_type_name
            FROM operation o
            LEFT JOIN category c ON o.category_id = c.id
            LEFT JOIN operationtype ot ON o.operation_type_id = ot.id`
        );

        console.log('🟢 Query completed, found:', rows.rows.length);

        if (rows.rows.length === 0) {
            return res.status(404).json({ error: 'Операции не найдены' });
        }

        const operations = rows.rows.map(operation => ({
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

        const rows = await db.query(
            `SELECT 
                o.id,
                o.user_id,
                o.category_id,
                o.operation_type_id,
                o.description,
                o.amount,
                o.created_at,
                COALESCE(c.name, o.custom_category) as category_name,
                ot.name as operation_type_name
            FROM operation o
            LEFT JOIN category c ON o.category_id = c.id
            LEFT JOIN operationtype ot ON o.operation_type_id = ot.id
            WHERE o.id = $1`,
            [operationId]
        );

        if (rows.rows.length === 0) {
            return res.status(409).json({ error: 'Операции не найдены' });
        }

        const operation = rows.rows[0];

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
                COALESCE(c.name, o.custom_category) as category_name,
                ot.name as operation_type_name
            FROM operation o
            LEFT JOIN category c ON o.category_id = c.id
            LEFT JOIN operationtype ot ON o.operation_type_id = ot.id
            WHERE o.user_id = $1
        `;

        const params = [userId];
        let paramIndex = 2;

        // Добавляем фильтры
        if (startDate) {
            query += ` AND o.created_at >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }

        if (endDate) {
            query += ` AND o.created_at <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        if (category) {
            query += ` AND (c.name = $${paramIndex} OR o.custom_category = $${paramIndex + 1})`;
            params.push(category, category);
            paramIndex += 2;
        }

        if (type) {
            const typeId = type === 'income' ? 1 : 2;
            query += ` AND o.operation_type_id = $${paramIndex}`;
            params.push(typeId);
            paramIndex++;
        }

        query += ' ORDER BY o.created_at DESC';

        console.log('🟡 SQL Query:', query);
        console.log('🟡 SQL Params:', params);

        const rows = await db.query(query, params);

        console.log('🟢 Found operations:', rows.rows.length);

        const operations = rows.rows.map(operation => ({
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

// 🔥 ИСПРАВЛЕННАЯ функция создания операции - ФИКС ВРЕМЕНИ
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

        let category_id = null;
        let custom_category = null;

        if (operation_type_id === 1) {
            // ДОХОД: не используем category_id, сохраняем название в custom_category
            custom_category = category;
            category_id = null; // Явно устанавливаем null
        } else {
            // РАСХОД: ищем или создаём категорию
            const categoryRows = await db.query(
                `SELECT id FROM category WHERE user_id = $1 AND name = $2`,
                [user_id, category]
            );
            
            if (categoryRows.rows.length === 0) {
                // Проверка лимита
                const countResult = await db.query(
                    `SELECT COUNT(*) as count FROM category WHERE user_id = $1`,
                    [user_id]
                );
                const userResult = await db.query(
                    `SELECT is_premium FROM "user" WHERE id = $1`,
                    [user_id]
                );
                const isPremium = userResult.rows[0]?.is_premium === true;
                const currentCount = parseInt(countResult.rows[0].count);
                
                if (!isPremium && currentCount >= 6) {
                    return res.status(403).json({ 
                        error: 'Достигнут лимит категорий расходов. Обновите до премиум для создания большего количества.' 
                    });
                }
                
                const categoryResult = await db.query(
                    `INSERT INTO category (user_id, name) VALUES ($1, $2) RETURNING id`,
                    [user_id, category]
                );
                category_id = categoryResult.rows[0].id;
            } else {
                category_id = categoryRows.rows[0].id;
            }
        }

        // 🔥 ФИКС ВРЕМЕНИ: Сохраняем время как есть, без конвертации в UTC
        let operationDate;
        if (created_at) {
            // Если дата передана с фронтенда, используем её как есть
            operationDate = created_at;
            console.log('📅 Using provided date:', operationDate);
        } else {
            // Если дата не передана, используем текущее время сервера
            operationDate = new Date();
            console.log('📅 Using current server date:', operationDate);
        }

        console.log('📅 Saving operation with:', { 
            category_id, 
            custom_category,
            operationDate 
        });

        // 🔥 ВАЖНО: Проверяем, что значения не undefined
        const result = await db.query(
            `INSERT INTO operation (user_id, category_id, operation_type_id, description, amount, created_at, custom_category) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
                user_id,
                category_id,          
                operation_type_id,
                description || null,
                parseFloat(amount),
                operationDate,
                custom_category       
            ]
        );

        console.log('📝 Insert operation ID:', result.rows[0].id);

        // Получаем созданную операцию
        const newOperationRows = await db.query(
            `SELECT 
                o.id,
                o.user_id,
                o.category_id,
                o.operation_type_id,
                o.description,
                o.amount,
                o.created_at,
                COALESCE(c.name, o.custom_category) as category_name,
                ot.name as operation_type_name
            FROM operation o
            LEFT JOIN category c ON o.category_id = c.id
            LEFT JOIN operationtype ot ON o.operation_type_id = ot.id
            WHERE o.id = $1`,
            [result.rows[0].id]
        );

        const operation = newOperationRows.rows[0];
        
        // Нормализуем тип операции для фронтенда
        const normalizedOperationType = operation.operation_type_name === 'доход' ? 'income' : 'expense';
        
        return res.status(201).json({
            id: operation.id,
            user_id: operation.user_id,
            description: operation.description,
            amount: operation.amount,
            created_at: operation.created_at,
            operation: normalizedOperationType, // 🔥 Используем нормализованное значение
            category: operation.category_name,
            message: 'Операция успешно создана'
        });
        
    } catch (err) {
        console.error('🔴 Create operation error:', err);
        console.error('🔴 Error details:', err.message);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера: ' + err.message });
    }
};

// 🔥 ИСПРАВЛЕННАЯ функция обновления операции - ФИКС ВРЕМЕНИ
const updateOperation = async (req, res) => {
    try {
        const operationId = req.params.id;
        const userId = req.user.userId;
        const { amount, category, description, operation_type_id, created_at } = req.body;

        console.log('✏️ Updating operation:', {
            operationId, userId, amount, category, description, operation_type_id, created_at
        });

        // Валидация
        if (!amount || !category || !operation_type_id) {
            return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
        }

        if (isNaN(amount) || parseFloat(amount) <= 0) {
            return res.status(400).json({ error: 'Сумма должна быть положительным числом' });
        }

        // Проверяем, что операция принадлежит пользователю
        const checkRows = await db.query(
            `SELECT * FROM operation WHERE id = $1 AND user_id = $2`,
            [operationId, userId]
        );

        if (checkRows.rows.length === 0) {
            return res.status(404).json({ error: 'Операция не найдена' });
        }

        let category_id = null;
        let custom_category = null;

        // 🔥 Та же логика что и при создании
        if (operation_type_id === 1) {
            // ДОХОДЫ: сохраняем название как custom_category
            custom_category = category;
        } else {
            // РАСХОДЫ: находим или создаем категорию
            const categoryRows = await db.query(
                `SELECT id FROM category WHERE user_id = $1 AND name = $2`,
                [userId, category]
            );

            if (categoryRows.rows.length === 0) {
                // Проверяем лимит категорий
                const countResult = await db.query(
                    `SELECT COUNT(*) as count FROM category WHERE user_id = $1`,
                    [userId]
                );
                
                const userResult = await db.query(
                    `SELECT is_premium FROM "user" WHERE id = $1`,
                    [userId]
                );
                
                const isPremium = userResult.rows[0]?.is_premium === true;
                const currentCount = parseInt(countResult.rows[0].count);

                if (!isPremium && currentCount >= 6) {
                    return res.status(403).json({ 
                        error: 'Достигнут лимит категорий расходов. Обновите до премиум для создания большего количества.' 
                    });
                }

                // Создаем новую категорию
                const categoryResult = await db.query(
                    `INSERT INTO category (user_id, name) VALUES ($1, $2) RETURNING id`,
                    [userId, category]
                );
                category_id = categoryResult.rows[0].id;
            } else {
                category_id = categoryRows.rows[0].id;
            }
        }

        // 🔥 ФИКС ВРЕМЕНИ: Сохраняем время как есть
        let operationDate;
        if (created_at) {
            // Используем переданную дату как есть
            operationDate = created_at;
            console.log('📅 Using provided date for update:', operationDate);
        } else {
            // Если дата не указана, оставляем старую
            operationDate = checkRows.rows[0].created_at;
            console.log('📅 Keeping existing date:', operationDate);
        }

        // Обновляем операцию
        const result = await db.query(
            `UPDATE operation 
             SET category_id = $1, 
                 operation_type_id = $2, 
                 description = $3, 
                 amount = $4, 
                 created_at = $5,
                 custom_category = $6
             WHERE id = $7 AND user_id = $8`,
            [
                category_id,
                operation_type_id,
                description || null,
                parseFloat(amount),
                operationDate,
                custom_category,
                operationId,
                userId
            ]
        );

        console.log('✅ Operation updated:', result.rowCount);

        // Получаем обновленную операцию
        const updatedOperationRows = await db.query(
            `SELECT 
                o.id,
                o.user_id,
                o.category_id,
                o.operation_type_id,
                o.description,
                o.amount,
                o.created_at,
                COALESCE(c.name, o.custom_category) as category_name,
                ot.name as operation_type_name
            FROM operation o
            LEFT JOIN category c ON o.category_id = c.id
            LEFT JOIN operationtype ot ON o.operation_type_id = ot.id
            WHERE o.id = $1`,
            [operationId]
        );

        const operation = updatedOperationRows.rows[0];

        return res.status(200).json({
            id: operation.id,
            user_id: operation.user_id,
            description: operation.description,
            amount: operation.amount,
            created_at: operation.created_at,
            operation: operation.operation_type_name,
            category: operation.category_name,
            message: 'Операция успешно обновлена'
        });

    } catch (err) {
        console.error('🔴 Update operation error:', err);
        console.error('🔴 Error details:', err.message);
        
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

const deleteOperation = async (req, res) => {
    try {
        const operationId = req.params.id;
        const userId = req.user.userId;

        console.log('🗑️ Deleting operation:', { operationId, userId });

        // Проверяем, что операция принадлежит пользователю
        const checkRows = await db.query(
            `SELECT * FROM operation WHERE id = $1 AND user_id = $2`,
            [operationId, userId]
        );

        if (checkRows.rows.length === 0) {
            return res.status(404).json({ error: 'Операция не найдена' });
        }

        // Удаляем операцию
        const result = await db.query(
            `DELETE FROM operation WHERE id = $1 AND user_id = $2`,
            [operationId, userId]
        );

        console.log('✅ Operation deleted:', result.rowCount);

        return res.status(200).json({ 
            message: 'Операция успешно удалена',
            deletedId: operationId
        });

    } catch (err) {
        console.error('🔴 Delete operation error:', err);
        console.error('🔴 Error details:', err.message);
        
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

module.exports = {
    getAllOperations,
    getOperationById,
    getOperationsByUserId,
    createOperation,
    updateOperation,
    deleteOperation
};