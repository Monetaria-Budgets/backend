const db = require('../models/db');

// Получить данные для главного экрана (Home)
const getHomeData = (req, res) => {
    const userId = req.user.userId; // Получаем user_id из JWT токена

    // Запросы к БД
    const balanceQuery = `
        SELECT 
            COALESCE(SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END), 0) - 
            COALESCE(SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END), 0) AS balance
        FROM Operation o
        JOIN OperationType ot ON o.operation_type_id = ot.id
        WHERE o.user_id = ?
    `;

    // Запрос для ТОП-3 категорий по расходам за ВСЕ ВРЕМЯ (только названия)
    const topCategoriesQuery = `
        SELECT 
            c.name AS category_name
        FROM Operation o
        JOIN Category c ON o.category_id = c.id
        JOIN OperationType ot ON o.operation_type_id = ot.id
        WHERE o.user_id = ?
          AND ot.name = 'Расход'
        GROUP BY c.id, c.name
        ORDER BY SUM(o.amount) DESC
        LIMIT 3
    `;

    const allOperationsQuery = `
        SELECT 
            o.id,
            o.description,
            o.amount,
            o.created_at,
            c.name AS category_name,
            ot.name AS operation_type
        FROM Operation o
        JOIN Category c ON o.category_id = c.id
        JOIN OperationType ot ON o.operation_type_id = ot.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;

    // Выполняем запросы параллельно
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(balanceQuery, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0] || { balance: 0 });
            });
        }),
        new Promise((resolve, reject) => {
            db.query(topCategoriesQuery, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results.map(row => row.category_name)); // Преобразуем массив объектов в массив строк
            });
        }),
        new Promise((resolve, reject) => {
            db.query(allOperationsQuery, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        })
    ])
    .then(([balanceData, topCategories, allOperations]) => {
        res.json({
            balance: balanceData.balance,
            topCategories: topCategories, // Теперь это массив строк: ["Еда", "Транспорт", "Развлечения"] за все время
            operations: allOperations
        });
    })
    .catch(err => {
        console.error('Ошибка при получении данных главного экрана:', err.message);
        res.status(500).json({ error: 'Ошибка сервера при загрузке данных' });
    });
};

module.exports = {
    getHomeData
};