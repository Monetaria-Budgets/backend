const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,  
  queueLimit: 0             
});


db.getConnection()
  .then(conn => {
    console.log('✅ Успешное подключение к MySQL через пул');
    conn.release(); 
  })
  .catch(err => {
    console.error('❌ Не удалось подключиться к MySQL:', err.message);
    process.exit(1);
  });

module.exports = db;