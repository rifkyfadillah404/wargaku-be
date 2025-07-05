const mysql = require("mysql2/promise");
require("dotenv").config();

const setupDatabase = async () => {
  let connection;

  try {
    // Koneksi ke MySQL tanpa database spesifik
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      port: process.env.DB_PORT || 3306,
      multipleStatements: true,
    });

    console.log("✅ Terhubung ke MySQL server");

    // Buat database
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || "data_masyarakat"}`);
    console.log("✅ Database berhasil dibuat");

    // Tutup koneksi dan buat koneksi baru ke database spesifik
    await connection.end();

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "data_masyarakat",
      port: process.env.DB_PORT || 3306,
    });
    console.log("✅ Terhubung ke database data_masyarakat");

    // Buat tabel masyarakat
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS masyarakat (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nik VARCHAR(16) NOT NULL UNIQUE,
        nama VARCHAR(100) NOT NULL,
        tempat_lahir VARCHAR(50) NOT NULL,
        tanggal_lahir DATE NOT NULL,
        jenis_kelamin ENUM('Laki-laki', 'Perempuan') NOT NULL,
        alamat TEXT NOT NULL,
        rt VARCHAR(3) NOT NULL,
        rw VARCHAR(3) NOT NULL,
        kelurahan VARCHAR(50) NOT NULL,
        kecamatan VARCHAR(50) NOT NULL,
        agama VARCHAR(20) NOT NULL,
        status_perkawinan VARCHAR(20) NOT NULL,
        pekerjaan VARCHAR(50) NOT NULL,
        kewarganegaraan VARCHAR(20) NOT NULL DEFAULT 'WNI',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await connection.execute(createTableQuery);
    console.log("✅ Tabel masyarakat berhasil dibuat");

    // Buat index (dengan error handling untuk index yang sudah ada)
    try {
      await connection.execute("CREATE INDEX idx_nik ON masyarakat(nik)");
    } catch (error) {
      if (!error.message.includes("Duplicate key name")) throw error;
    }

    try {
      await connection.execute("CREATE INDEX idx_nama ON masyarakat(nama)");
    } catch (error) {
      if (!error.message.includes("Duplicate key name")) throw error;
    }

    try {
      await connection.execute("CREATE INDEX idx_kelurahan ON masyarakat(kelurahan)");
    } catch (error) {
      if (!error.message.includes("Duplicate key name")) throw error;
    }

    try {
      await connection.execute("CREATE INDEX idx_kecamatan ON masyarakat(kecamatan)");
    } catch (error) {
      if (!error.message.includes("Duplicate key name")) throw error;
    }

    console.log("✅ Index berhasil dibuat");

    // Insert data sample
    const sampleData = [
      ["3201234567890001", "Ahmad Rizki Pratama", "Jakarta", "1990-05-15", "Laki-laki", "Jl. Merdeka No. 123", "001", "005", "Kebon Jeruk", "Kebon Jeruk", "Islam", "Belum Kawin", "Programmer", "WNI"],
      ["3201234567890002", "Siti Nurhaliza", "Bandung", "1985-08-22", "Perempuan", "Jl. Sudirman No. 456", "002", "003", "Menteng", "Menteng", "Islam", "Kawin", "Guru", "WNI"],
      ["3201234567890003", "Budi Santoso", "Surabaya", "1992-12-10", "Laki-laki", "Jl. Gatot Subroto No. 789", "003", "007", "Tanah Abang", "Tanah Abang", "Kristen", "Belum Kawin", "Dokter", "WNI"],
      ["3201234567890004", "Maya Sari Dewi", "Medan", "1988-03-18", "Perempuan", "Jl. Thamrin No. 321", "004", "002", "Gambir", "Gambir", "Hindu", "Kawin", "Pengusaha", "WNI"],
      ["3201234567890005", "Andi Wijaya", "Makassar", "1995-07-25", "Laki-laki", "Jl. Kuningan No. 654", "005", "001", "Setiabudi", "Setiabudi", "Islam", "Belum Kawin", "Mahasiswa", "WNI"],
    ];

    const insertQuery = `
      INSERT IGNORE INTO masyarakat (
        nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt, rw,
        kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const data of sampleData) {
      await connection.execute(insertQuery, data);
    }
    console.log("✅ Database dan tabel berhasil dibuat");
    console.log("✅ Data sample berhasil diinsert");

    // Test koneksi ke database yang baru dibuat
    const [rows] = await connection.execute("SELECT COUNT(*) as total FROM masyarakat");
    console.log(`✅ Total data masyarakat: ${rows[0].total}`);
  } catch (error) {
    console.error("❌ Error setting up database:", error.message);
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
  setupDatabase();
}

module.exports = setupDatabase;
