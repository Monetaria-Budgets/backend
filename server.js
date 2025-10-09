const express = require('express');
const dotenv = require('dotenv');
const db = require('.//models/db'); // подключение к БД
dotenv.config();

const app = express();
app.use(express.json());

// Подключаем маршруты
const userRoutes = require('./routes/users');
app.use('/users', userRoutes); // все маршруты из users.js будут доступны с префиксом /users


// Подключаем маршруты для категорий, операций и уведомлений 
const categoryRoutes = require('./routes/categories');
const operationRoutes = require('./routes/operations');
const notificationRoutes = require('./routes/notifications');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const homeRoutes = require('./routes/homeRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');



app.use('/categories', categoryRoutes);
app.use('/operations', operationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/auth', authRoutes);     
app.use('/api', profileRoutes);   
app.use('/home', homeRoutes); // Добавьте этот маршрут
app.use('/statistics', statisticsRoutes); // Добавьте этот маршрут


// Главная страница
app.get('/', (req, res) => {
    res.send('🚀 FinApp API работает!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌍 Сервер запущен на http://localhost:${PORT}`);
});



// Функция для удаления истёкших подписок
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


// Запускать каждый час
// setInterval(cleanupExpiredPremiums, 60 * 60 * 1000); // 1 час = 3600000 мс

setInterval(updateExpiredPremiums, 2 * 60 * 1000); // каждые 2 минуты

// Запустить сразу при старте сервера
updateExpiredPremiums();