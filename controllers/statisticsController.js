const db = require('../models/db');

// Получить статистику по выбранному периоду
const getStatisticsByPeriod = (req, res) => {
    const userId = req.user.userId; 
    const period = req.query.period || 'month'; 

    let dateCondition = '';
    let groupByClause = 'DATE(o.created_at)';
    let dateSelectClause = 'DATE(o.created_at) AS date'; 

    switch (period) {
        case 'week':
            dateCondition = `
                o.created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)
                AND o.created_at < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
            `;
            break;
        case 'month':
            dateCondition = `
                YEAR(o.created_at) = YEAR(CURDATE())
                AND MONTH(o.created_at) = MONTH(CURDATE())
            `;
            break;
        case 'quarter':
            dateCondition = `
                YEAR(o.created_at) = YEAR(CURDATE())
                AND QUARTER(o.created_at) = QUARTER(CURDATE())
            `;
            break;
        case 'year':
            dateCondition = `
                YEAR(o.created_at) = YEAR(CURDATE())
            `;
            groupByClause = 'MONTH(o.created_at)'; 
            dateSelectClause = 'DATE(CONCAT(YEAR(MIN(o.created_at)), "-", MONTH(MIN(o.created_at)), "-01")) AS date';
            break;
        default:
            return res.status(400).json({ error: 'Неверный период. Допустимые значения: week, month, quarter, year' });
    }

    // Запрос для получения сводки (баланс, доходы, расходы)
    const summaryQuery = `
        SELECT 
            COALESCE(SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END), 0) AS total_income,
            COALESCE(SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END), 0) AS total_expense,
            COALESCE(SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END), 0) - 
            COALESCE(SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END), 0) AS balance
        FROM Operation o
        JOIN OperationType ot ON o.operation_type_id = ot.id
        WHERE o.user_id = ?
          AND ${dateCondition}
    `;

    // Запрос для получения динамики остатка (график)
    const dynamicsQuery = `
        SELECT 
            ${dateSelectClause},
            SUM(CASE WHEN ot.name = 'Доход' THEN o.amount ELSE 0 END) AS income,
            SUM(CASE WHEN ot.name = 'Расход' THEN o.amount ELSE 0 END) AS expense
        FROM Operation o
        JOIN OperationType ot ON o.operation_type_id = ot.id
        WHERE o.user_id = ?
          AND ${dateCondition}
        GROUP BY ${groupByClause}
        ORDER BY MIN(DATE(o.created_at)) ASC
    `;

    // Выполняем запросы параллельно
    Promise.all([
        new Promise((resolve, reject) => {
            db.query(summaryQuery, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0] || { total_income: 0, total_expense: 0, balance: 0 });
            });
        }),
        new Promise((resolve, reject) => {
            db.query(dynamicsQuery, [userId], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        })
    ])
    .then(([summaryData, dynamicsData]) => {
        // Обрабатываем данные для графика
        let cumulativeBalance = 0;
        const chartData = dynamicsData.map(row => {
            cumulativeBalance += row.income - row.expense;

            return {
                date: row.date.toISOString().split('T')[0], 
                balance: cumulativeBalance
            };
        });

        res.json({
            period: period,
            summary: {
                balance: summaryData.balance,
                income: summaryData.total_income,
                expense: summaryData.total_expense
            },
            dynamics: chartData
        });
    })
    .catch(err => {
        console.error('Ошибка при получении статистики:', err.message);
        res.status(500).json({ error: 'Ошибка сервера при загрузке статистики' });
    });
};

module.exports = {
    getStatisticsByPeriod
};