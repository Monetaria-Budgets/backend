const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

console.log('🟡 Инициализация подключения к PostgreSQL...');

// Настройка пула соединений
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Критично важно для Render!
  },
  max: 20, // Максимум соединений
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Проверка подключения при запуске
pool.on('connect', () => {
  console.log('✅ Новое соединение с БД установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка в пуле соединений:', err);
});

async function testConnection() {
  let client;
  try {
    client = await pool.connect();
    console.log('✅ Успешное подключение к PostgreSQL');
    
    const result = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    const tables = result.rows.map(row => row.tablename);
    console.log('📊 Таблицы в базе:', tables.length > 0 ? tables.join(', ') : '(пусто)');
  } catch (err) {
    console.error('❌ Ошибка проверки подключения:', err.message);
  } finally {
    if (client) client.release();
  }
}

// Запускаем тест сразу
testConnection();

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};

























// const { Pool } = require('pg');
// const dotenv = require('dotenv');

// dotenv.config();

// console.log('🟡 DB Connection config:', {
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT
// });

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT,
//   max: 10,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 10000,
//   retry: {
//     max: 3,
//     delay: 1000
//   }
// });

// // Тестируем подключение
// async function testConnection() {
//   let client;
//   try {
//     client = await pool.connect();
//     console.log('✅ Успешное подключение к PostgreSQL');

//     // Проверим таблицы
//     const result = await client.query(`
//       SELECT tablename 
//       FROM pg_tables 
//       WHERE schemaname = 'public'
//       ORDER BY tablename;
//     `);
//     const tables = result.rows.map(row => row.tablename);
//     console.log('📊 Таблицы в базе:', tables);
//   } catch (err) {
//     console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
//     console.error('🔴 Детали ошибки:', err);
//     process.exit(1);
//   } finally {
//     if (client) client.release();
//   }
// }

// const db = {
//   query: (text, params) => pool.query(text, params),
//   pool 
// };

// // Запускаем проверку при импорте
// testConnection();

// module.exports = db;