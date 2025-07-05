const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const setupAuthPayment = async () => {
  let connection;

  try {
    // Koneksi ke database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "data_masyarakat",
      port: process.env.DB_PORT || 3306,
    });

    console.log("✅ Terhubung ke database");

    // Buat tabel users
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
        masyarakat_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (masyarakat_id) REFERENCES masyarakat(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Tabel users berhasil dibuat");

    // Buat tabel payment_types
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        is_monthly BOOLEAN DEFAULT TRUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tabel payment_types berhasil dibuat");

    // Buat tabel payments
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        masyarakat_id INT NOT NULL,
        payment_type_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        payment_month VARCHAR(7) NOT NULL,
        payment_date TIMESTAMP NULL,
        proof_image VARCHAR(255) NULL,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        notes TEXT NULL,
        approved_by INT NULL,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (masyarakat_id) REFERENCES masyarakat(id) ON DELETE CASCADE,
        FOREIGN KEY (payment_type_id) REFERENCES payment_types(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_payment (masyarakat_id, payment_type_id, payment_month)
      )
    `);
    console.log("✅ Tabel payments berhasil dibuat");

    // Buat tabel sessions
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Tabel sessions berhasil dibuat");

    // Insert default payment types
    const paymentTypes = [
      ["Iuran Bulanan RT", "Iuran wajib bulanan untuk kegiatan RT", 50000.00, true],
      ["Iuran Keamanan", "Iuran untuk biaya keamanan lingkungan", 25000.00, true],
      ["Iuran Kebersihan", "Iuran untuk biaya kebersihan dan sampah", 30000.00, true],
      ["Iuran Sosial", "Iuran untuk kegiatan sosial dan kemasyarakatan", 20000.00, true],
    ];

    for (const [name, description, amount, isMonthly] of paymentTypes) {
      await connection.execute(
        "INSERT IGNORE INTO payment_types (name, description, amount, is_monthly) VALUES (?, ?, ?, ?)",
        [name, description, amount, isMonthly]
      );
    }
    console.log("✅ Data payment types berhasil diinsert");

    // Hash password untuk default users
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Insert default admin user
    await connection.execute(
      "INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
      ["admin", "admin@datamasyarakat.com", hashedPassword, "admin"]
    );

    // Insert sample user accounts
    const sampleUsers = [
      ["ahmad.rizki", "ahmad.rizki@email.com", hashedPassword, "user", 1],
      ["siti.nurhaliza", "siti.nurhaliza@email.com", hashedPassword, "user", 2],
      ["budi.santoso", "budi.santoso@email.com", hashedPassword, "user", 3],
    ];

    for (const [username, email, password, role, masyarakatId] of sampleUsers) {
      await connection.execute(
        "INSERT IGNORE INTO users (username, email, password, role, masyarakat_id) VALUES (?, ?, ?, ?, ?)",
        [username, email, password, role, masyarakatId]
      );
    }
    console.log("✅ Data users berhasil diinsert");

    // Test query
    const [users] = await connection.execute("SELECT COUNT(*) as total FROM users");
    const [paymentTypesCount] = await connection.execute("SELECT COUNT(*) as total FROM payment_types");
    
    console.log(`✅ Total users: ${users[0].total}`);
    console.log(`✅ Total payment types: ${paymentTypesCount[0].total}`);
    console.log("✅ Setup authentication dan payment system berhasil!");

  } catch (error) {
    console.error("❌ Error setting up auth & payment:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("✅ Koneksi database ditutup");
    }
  }
};

// Jalankan setup jika file ini dieksekusi langsung
if (require.main === module) {
  setupAuthPayment();
}

module.exports = setupAuthPayment;
