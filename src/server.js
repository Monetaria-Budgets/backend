const express = require('express');
const dotenv = require('dotenv');
const db = require('./db/db');
dotenv.config();

const app = express();
app.use(express.json());


// Контроллеры для маршрутов
const userRoutes = require('./routes/users.routes');
const categoryRoutes = require('./routes/categories.routes');
const operationRoutes = require('./routes/operations.routes');
const notificationRoutes = require('./routes/notifications.routes');
const authRoutes = require('./routes/auth.routes');
const homeRoutes = require('./routes/home.routes');
const statisticsRoutes = require('./routes/statistics.routes');


// Маршруты
app.use('/users', userRoutes); 
app.use('/categories', categoryRoutes);
app.use('/operations', operationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/auth', authRoutes);     
app.use('/home', homeRoutes);
app.use('/statistics', statisticsRoutes);


const PORT = process.env.PORT   ;
app.listen(PORT, () => {
    console.log(`🌍 Сервер запущен на порту: ${PORT}`);
});



// Удаление истёкших подписок
const updateExpiredPremiums = async () => {
    const query = `
        UPDATE User 
        SET is_premium = FALSE 
        WHERE id IN (
            SELECT user_id 
            FROM PremiumUser 
            WHERE subscription_end <= NOW()
        )
        AND is_premium = TRUE;
    `;

    try {
        const [result] = await db.query(query); // ✅ await + деструктуризация
        if (result.affectedRows > 0) {
            console.log(`✅ ${result.affectedRows} пользователей потеряли премиум.`);
        } else {
            console.log('пусто');
        }
    } catch (err) {
        console.error('❌ Ошибка при обновлении истёкших подписок:', err.message);
    }
};


// setInterval(cleanupExpiredPremiums, 60 * 60 * 1000); // 1 час = 3600000 мс
setInterval(updateExpiredPremiums, 2 * 60 * 1000); // каждые 2 минуты

updateExpiredPremiums();