const db = require('../db/db');

// Получить данные для главного экрана (Home)
const getHomeData = async (req, res) => {
    try {
        const userId = req.user.userId; // Получаем user_id из JWT токена

        // Запросы к БД
        const balanceQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END), 0) - 
                COALESCE(SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END), 0) AS balance
            FROM operation o
            JOIN operationtype ot ON o.operation_type_id = ot.id
            WHERE o.user_id = $1
        `;

        // Запрос для ТОП-3 категорий по расходам за ВСЕ ВРЕМЯ (только названия)
        const topCategoriesQuery = `
            SELECT 
                c.name AS category_name
            FROM operation o
            JOIN category c ON o.category_id = c.id
            JOIN operationtype ot ON o.operation_type_id = ot.id
            WHERE o.user_id = $1
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
            FROM operation o
            JOIN category c ON o.category_id = c.id
            JOIN operationtype ot ON o.operation_type_id = ot.id
            WHERE o.user_id = $1
            ORDER BY o.created_at DESC
        `;

        // Выполняем запросы параллельно
        const [balanceData, topCategories, allOperations] = await Promise.all([
            db.query(balanceQuery, [userId]),
            db.query(topCategoriesQuery, [userId]),
            db.query(allOperationsQuery, [userId])
        ]);

        res.json({
            balance: balanceData.rows[0]?.balance || 0,
            topCategories: topCategories.rows.map(row => row.category_name), // Теперь это массив строк: ["Еда", "Транспорт", "Развлечения"] за все время
            operations: allOperations.rows
        });
    } catch (err) {
        console.error('Ошибка при получении данных главного экрана:', err.message);
        res.status(500).json({ error: 'Ошибка сервера при загрузке данных' });
    }
};

module.exports = {
    getHomeData
};