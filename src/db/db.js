const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

console.log('🟡 DB Connection config:', {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 10000,
  timeout: 60000,
  reconnect: true
});

// Тестируем подключение
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ Успешное подключение к MySQL');
    connection.release();
    
    // Проверим таблицы
    const [tables] = await db.execute('SHOW TABLES');
    console.log('📊 Таблицы в базе:', tables.map(t => t.Tables_in_Monetaria));
    
  } catch (err) {
    console.error('❌ Ошибка подключения к MySQL:', err.message);
    console.error('🔴 Детали ошибки:', err);
    process.exit(1);
  }
}

testConnection();

module.exports = db;