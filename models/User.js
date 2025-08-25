const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Mendapatkan semua users
  static async getAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT u.*, m.nama as masyarakat_nama, m.nik as masyarakat_nik 
        FROM users u 
        LEFT JOIN masyarakat m ON u.masyarakat_id = m.id 
        ORDER BY u.created_at DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan user berdasarkan ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.*, m.nama as masyarakat_nama, m.nik as masyarakat_nik 
        FROM users u 
        LEFT JOIN masyarakat m ON u.masyarakat_id = m.id 
        WHERE u.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan user berdasarkan username
  static async getByUsername(username) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.*, m.nama as masyarakat_nama, m.nik as masyarakat_nik 
        FROM users u 
        LEFT JOIN masyarakat m ON u.masyarakat_id = m.id 
        WHERE u.username = ?
      `, [username]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan user berdasarkan email
  static async getByEmail(email) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.*, m.nama as masyarakat_nama, m.nik as masyarakat_nik
        FROM users u
        LEFT JOIN masyarakat m ON u.masyarakat_id = m.id
        WHERE u.email = ?
      `, [email]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan user berdasarkan masyarakat_id
  static async getByMasyarakatId(masyarakat_id) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.*, m.nama as masyarakat_nama, m.nik as masyarakat_nik
        FROM users u
        LEFT JOIN masyarakat m ON u.masyarakat_id = m.id
        WHERE u.masyarakat_id = ?
      `, [masyarakat_id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Membuat user baru
  static async create(data) {
    try {
      const { username, email, password, role = 'user', masyarakat_id } = data;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const [result] = await pool.execute(`
        INSERT INTO users (username, email, password, role, masyarakat_id) 
        VALUES (?, ?, ?, ?, ?)
      `, [username, email, hashedPassword, role, masyarakat_id]);
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async update(id, data) {
    try {
      const { username, email, role, masyarakat_id, is_active } = data;
      
      const [result] = await pool.execute(`
        UPDATE users SET 
        username = ?, email = ?, role = ?, masyarakat_id = ?, is_active = ?, 
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [username, email, role, masyarakat_id, is_active, id]);
      
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Update password
  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const [result] = await pool.execute(`
        UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
      `, [hashedPassword, id]);
      
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Hapus user
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw error;
    }
  }

  // Get users by role
  static async getByRole(role) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.*, m.nama as masyarakat_nama, m.nik as masyarakat_nik 
        FROM users u 
        LEFT JOIN masyarakat m ON u.masyarakat_id = m.id 
        WHERE u.role = ? AND u.is_active = TRUE
        ORDER BY u.created_at DESC
      `, [role]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Get user statistics
  static async getStats() {
    try {
      const [totalUsers] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE is_active = TRUE');
      const [adminCount] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE role = "admin" AND is_active = TRUE');
      const [userCount] = await pool.execute('SELECT COUNT(*) as total FROM users WHERE role = "user" AND is_active = TRUE');
      
      return {
        total: totalUsers[0].total,
        admin: adminCount[0].total,
        user: userCount[0].total
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
