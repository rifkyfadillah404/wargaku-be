const mysql = require('mysql2');
require('dotenv').config();

// Konfigurasi koneksi database MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'data_masyarakat',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Membuat connection pool untuk performa yang lebih baik
const pool = mysql.createPool(dbConfig);

// Membuat promise-based pool untuk async/await
const promisePool = pool.promise();

// Test koneksi database
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

module.exports = {
  pool: promisePool,
  testConnection
};
