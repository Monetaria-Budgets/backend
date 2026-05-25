const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
app.use(express.json());

// --- АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ---
async function initDatabase() {
  const db = require('./db/db');
  
  try {
    console.log('🔧 Проверка структуры БД...');
    
    // Проверяем, существует ли таблица 'role' как индикатор наличия всей схемы
    const checkTable = await db.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'role')
    `);
    
    if (!checkTable.rows[0].exists) {
      console.log('️ База данных пуста. Начинаю создание таблиц из schema.sql...');
      
      // Читаем файл schema.sql из корня проекта (папка backend)
      const sqlFilePath = path.join(__dirname, '..', 'schema.sql');
      
      if (!fs.existsSync(sqlFilePath)) {
        console.error('❌ Файл schema.sql не найден! Создайте его в папке backend.');
        return;
      }
      
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Выполняем весь SQL скрипт одним запросом
      await db.pool.query(sqlContent);
      
      console.log('✅ Все таблицы успешно созданы!');
    } else {
      console.log('✅ Структура БД уже существует. Пропускаю создание.');
    }
  } catch (err) {
    console.error('❌ Критическая ошибка при инициализации БД:', err.message);
    // Не останавливаем сервер, но выводим ошибку
  }
}

// Запускаем инициализацию ПЕРЕД настройкой роутов
initDatabase();
// -----------------------------------------------

// Контроллеры для маршрутов
const userRoutes = require('./routes/users.routes');
const categoryRoutes = require('./routes/categories.routes');
const operationRoutes = require('./routes/operations.routes');
const notificationRoutes = require('./routes/notifications.routes');
const authRoutes = require('./routes/auth.routes');
const homeRoutes = require('./routes/home.routes');
const statisticsRoutes = require('./routes/statistics.routes');
const currenciesRoutes = require('./routes/currencies.routes');
const spendingLimitsRoutes = require('./routes/spendingLimits.routes');
const currencyController = require('./controllers/currency.controller');
const premiumRoutes = require('./routes/premium.routes');

const currencyCron = require('./cron/currency.cron');

app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

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
app.use('/notifications', notificationRoutes);
app.use('/auth', authRoutes);     
app.use('/home', homeRoutes);
app.use('/statistics', statisticsRoutes);
app.use('/currency', currenciesRoutes);
app.use('/spending-limits', spendingLimitsRoutes);
app.use('/premium', premiumRoutes);

const PORT = process.env.PORT || 10000; // Render использует порт 10000 по умолчанию

app.listen(PORT, () => {
    console.log(` Сервер запущен на порту: ${PORT}`);
});

// --- ФОНОВЫЕ ЗАДАЧИ ---

// 1. Обновление курсов валют при старте (с задержкой, чтобы БД успела проинициализироваться)
setTimeout(async () => {
  try {
    console.log('🔄 Обновляем курсы при запуске сервера...');
    const mockRes = {
      json: (data) => console.log('✅ Курсы обновлены при старте:', data),
      status: (code) => ({ json: (err) => console.error(`❌ Ошибка ${code}:`, err) })
    };
    
    const { updateRates } = currencyController;
    if (typeof updateRates === 'function') {
      await updateRates({}, mockRes);
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении курсов при старте:', error);
  }
}, 5000); // Задержка 5 секунд

// 2. Инициализация крон-задачи валют
currencyCron.init();

// 3. Обновление истекших подписок
const updateExpiredPremiums = async () => {
    const query = `
        UPDATE "user" 
        SET is_premium = false 
        WHERE id IN (
            SELECT user_id 
            FROM premiumuser 
            WHERE subscription_end <= CURRENT_TIMESTAMP
        )
        AND is_premium = true
        RETURNING id;
    `;

    try {
        const db = require('./db/db');
        const result = await db.query(query);
        if (result.rowCount > 0) {
            console.log(`✅ ${result.rowCount} пользователей потеряли премиум.`);
        }
    } catch (err) {
        console.error('❌ Ошибка при обновлении истёкших подписок:', err.message);
    }
};

// Запускаем сразу и затем каждые 24 часа
updateExpiredPremiums();
setInterval(updateExpiredPremiums, 24 * 60 * 60 * 1000);