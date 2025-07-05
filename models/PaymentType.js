const { pool } = require('../config/database');

class PaymentType {
  // Mendapatkan semua payment types
  static async getAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM payment_types 
        WHERE is_active = TRUE 
        ORDER BY name ASC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan payment type berdasarkan ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT * FROM payment_types WHERE id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Membuat payment type baru
  static async create(data) {
    try {
      const { name, description, amount, is_monthly = true } = data;
      
      const [result] = await pool.execute(`
        INSERT INTO payment_types (name, description, amount, is_monthly) 
        VALUES (?, ?, ?, ?)
      `, [name, description, amount, is_monthly]);
      
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Update payment type
  static async update(id, data) {
    try {
      const { name, description, amount, is_monthly, is_active } = data;
      
      const [result] = await pool.execute(`
        UPDATE payment_types SET 
        name = ?, description = ?, amount = ?, is_monthly = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [name, description, amount, is_monthly, is_active, id]);
      
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Hapus payment type (soft delete)
  static async delete(id) {
    try {
      const [result] = await pool.execute(`
        UPDATE payment_types SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [id]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Get payment type statistics
  static async getStats() {
    try {
      const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM payment_types WHERE is_active = TRUE');
      const [monthlyResult] = await pool.execute('SELECT COUNT(*) as total FROM payment_types WHERE is_monthly = TRUE AND is_active = TRUE');
      const [totalAmountResult] = await pool.execute('SELECT COALESCE(SUM(amount), 0) as total FROM payment_types WHERE is_active = TRUE');
      
      return {
        total: totalResult[0].total,
        monthly: monthlyResult[0].total,
        totalAmount: totalAmountResult[0].total
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PaymentType;
