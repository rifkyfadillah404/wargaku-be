const { pool } = require('../config/database');

class Masyarakat {
  // Mendapatkan semua data masyarakat
  static async getAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM masyarakat ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan data masyarakat berdasarkan ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM masyarakat WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Mencari data masyarakat berdasarkan NIK
  static async getByNIK(nik) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM masyarakat WHERE nik = ?',
        [nik]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Menambah data masyarakat baru
  static async create(data) {
    try {
      const { nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt, rw, kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan } = data;
      
      const [result] = await pool.execute(
        `INSERT INTO masyarakat 
         (nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt, rw, kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt, rw, kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan]
      );
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Mengupdate data masyarakat
  static async update(id, data) {
    try {
      const { nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt, rw, kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan } = data;
      
      const [result] = await pool.execute(
        `UPDATE masyarakat SET 
         nik = ?, nama = ?, tempat_lahir = ?, tanggal_lahir = ?, jenis_kelamin = ?, 
         alamat = ?, rt = ?, rw = ?, kelurahan = ?, kecamatan = ?, agama = ?, 
         status_perkawinan = ?, pekerjaan = ?, kewarganegaraan = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, rt, rw, kelurahan, kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan, id]
      );
      
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Menghapus data masyarakat
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM masyarakat WHERE id = ?',
        [id]
      );
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Mencari data masyarakat berdasarkan keyword
  static async search(keyword) {
    try {
      const [rows] = await pool.execute(
        `SELECT * FROM masyarakat 
         WHERE nama LIKE ? OR nik LIKE ? OR alamat LIKE ? 
         ORDER BY created_at DESC`,
        [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Masyarakat;
