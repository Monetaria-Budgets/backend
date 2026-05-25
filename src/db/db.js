const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

console.log('🟡 Подключение к БД через DATABASE_URL');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // КРИТИЧНО ВАЖНО ДЛЯ RENDER!
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

// Тест подключения
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
    console.log(' Таблицы в базе:', tables);
  } catch (err) {
    console.error('❌ Ошибка подключения к PostgreSQL:', err.message);
    // Не убиваем процесс сразу, дадим шанс перезапуститься
    console.error('🔴 Детали:', err);
    // process.exit(1); // Закомментируй это временно, чтобы видеть другие ошибки
  } finally {
    if (client) client.release();
  }
}

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