const mysql = require('mysql2');
require('dotenv').config();

// Require env helper to avoid leaking defaults in code
const requireEnv = (key, { allowEmpty = false } = {}) => {
  const val = process.env[key];
  if (val === undefined || (!allowEmpty && val === '')) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
};

// Konfigurasi koneksi database MySQL (no hard-coded defaults)
const dbConfig = {
  host: requireEnv('DB_HOST'),
  user: requireEnv('DB_USER'),
  password: process.env.DB_PASSWORD || '',
  database: requireEnv('DB_NAME'),
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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
  testConnection,
};
