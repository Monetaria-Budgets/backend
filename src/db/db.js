const { Client } = require('pg'); // Используем Client вместо Pool для простоты теста
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function connectDB() {
  try {
    await client.connect();
    console.log('✅ Успешное подключение к PostgreSQL через Client');
    
    // Проверка таблиц
    const res = await client.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
    `);
    console.log('📊 Таблицы:', res.rows.map(r => r.tablename));
    
    return true;
  } catch (err) {
    console.error('❌ Ошибка подключения:', err.message);
    return false;
  }
}

// Запускаем подключение
connectDB();

module.exports = {
  query: (text, params) => client.query(text, params),
  client
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