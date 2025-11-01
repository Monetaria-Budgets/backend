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
  // const notificationRoutes = require('./routes/notifications.routes');
  const authRoutes = require('./routes/auth.routes');
  const homeRoutes = require('./routes/home.routes');
  const statisticsRoutes = require('./routes/statistics.routes');
  const currenciesRoutes = require('./routes/currencies.routes');
  const spendingLimitsRoutes = require('./routes/spendingLimits.routes');
  const currencyController = require('./controllers/currency.controller');
  const premiumRoutes = require('./routes/premium.routes');


  const currencyCron = require('./cron/currency.cron');


  currencyCron.init();

  // Маршруты
app.get('/', (req, res) => {
  console.log('✅ Root endpoint hit!');
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString()
  });
});

  app.use('/users', userRoutes); 
  app.use('/categories', categoryRoutes);
  app.use('/operations', operationRoutes);
  // app.use('/notifications', notificationRoutes);
  app.use('/auth', authRoutes);     
  app.use('/home', homeRoutes);
  app.use('/statistics', statisticsRoutes);
  app.use('/currency', currenciesRoutes);
  app.use('/spending-limits', spendingLimitsRoutes);
  app.use('/premium', premiumRoutes);


  const PORT = process.env.PORT || 3000;

  app.listen(PORT, process.env.HOST, () => {
      console.log(`🌍 Сервер запущен на порту: ${PORT}`);
  });

  // Первоначальное обновление курсов через 2 секунды после запуска
  setTimeout(async () => {
    try {
      console.log('🔄 Обновляем курсы при запуске сервера...');
      const mockRes = {
        json: (data) => console.log('✅ Курсы обновлены при старте:', data),
        status: (code) => ({ json: (err) => console.error(`❌ Ошибка ${code}:`, err) })
      };
      await currencyController.updateRates({}, mockRes);
    } catch (error) {
      console.error('❌ Ошибка при обновлении курсов при старте:', error);
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

  setInterval(updateExpiredPremiums, 24 * 60 * 60 * 1000);
  updateExpiredPremiums();