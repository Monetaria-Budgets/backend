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
const currenciesRoutes = require('./routes/currencies.routes');

const currencyCron = require('./cron/currency.cron');
const currencyController = require('./controllers/currency.controller');

currencyCron.init();

// Маршруты
app.use('/users', userRoutes); 
app.use('/categories', categoryRoutes);
app.use('/operations', operationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/auth', authRoutes);     
app.use('/home', homeRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/currency', currenciesRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌍 Сервер запущен на порту: ${PORT}`);
});

// Первоначальное обновление курсов через 2 секунды после запуска
setTimeout(async () => {
  try {
    console.log('Проверка инициализации валют...');
    
    // Проверяем, есть ли валюты кроме рубля
    const [currencies] = await db.execute('SELECT COUNT(*) as count FROM currency WHERE code != "RUB"');
    
    if (currencies[0].count === 0) {
      console.log('Валюты не инициализированы, запускаем инициализацию...');
      const mockRes = {
        json: (data) => console.log('✅ Валюты инициализированы:', data),
        status: () => mockRes
      };
      
      await currencyController.initializeCurrencies({}, mockRes);
      
      // После инициализации обновляем курсы
      console.log('Обновляем курсы после инициализации...');
      await currencyController.updateRates({}, mockRes);
    } else {
      console.log(`В БД уже есть ${currencies[0].count} валют`);
    }
  } catch (error) {
    console.error('❌ Ошибка при автоматической инициализации валют:', error);
  }
}, 3000);

// Удаление истёкших подписок
const updateExpiredPremiums = async () => {
    const query = `
        UPDATE user 
        SET is_premium = FALSE 
        WHERE id IN (
            SELECT user_id 
            FROM premiumuser 
            WHERE subscription_end <= NOW()
        )
        AND is_premium = TRUE;
    `;

    try {
        const [result] = await db.execute(query);
        if (result.affectedRows > 0) {
            console.log(`✅ ${result.affectedRows} пользователей потеряли премиум.`);
        } else {
            console.log('Нет истекших премиум-подписок');
        }
    } catch (err) {
        console.error('❌ Ошибка при обновлении истёкших подписок:', err.message);
    }
};

setInterval(updateExpiredPremiums, 2 * 60 * 1000);
updateExpiredPremiums();