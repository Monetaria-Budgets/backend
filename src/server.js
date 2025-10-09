const express = require('express');
const dotenv = require('dotenv');
const db = require('./db/db');
dotenv.config();

const app = express();
app.use(express.json());


// Контроллеры для маршрутов
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const operationRoutes = require('./routes/operations');
const notificationRoutes = require('./routes/notifications');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const homeRoutes = require('./routes/homeRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');


// Маршруты
app.use('/users', userRoutes); 
app.use('/categories', categoryRoutes);
app.use('/operations', operationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/auth', authRoutes);     
app.use('/api', profileRoutes);   
app.use('/home', homeRoutes);
app.use('/statistics', statisticsRoutes);


const PORT = process.env.PORT   ;
app.listen(PORT, () => {
    console.log(`🌍 Сервер запущен на порту: ${PORT}`);
});



// Удаление истёкших подписок
const updateExpiredPremiums = () => {
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

    db.query(query, (err, result) => {
        if (err) {
            console.error('❌ Ошибка при обновлении истёкших подписок:', err.message);
        } else if (result.affectedRows > 0) {
            console.log(`✅ ${result.affectedRows} пользователей потеряли премиум.`);
        }
        else {
            console.log('пусто')
        }
    });
};


// setInterval(cleanupExpiredPremiums, 60 * 60 * 1000); // 1 час = 3600000 мс
setInterval(updateExpiredPremiums, 2 * 60 * 1000); // каждые 2 минуты

updateExpiredPremiums();