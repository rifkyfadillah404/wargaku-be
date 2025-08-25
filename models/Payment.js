const { pool } = require("../config/database");

class Payment {
  // Mendapatkan semua payments dengan filter
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT p.*, 
               pt.name as payment_type_name, pt.description as payment_type_description,
               m.nama as masyarakat_nama, m.nik as masyarakat_nik,
               u.username as user_username,
               approver.username as approved_by_username
        FROM payments p
        JOIN payment_types pt ON p.payment_type_id = pt.id
        JOIN masyarakat m ON p.masyarakat_id = m.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN users approver ON p.approved_by = approver.id
        WHERE 1=1
      `;

      const params = [];

      if (filters.status) {
        query += " AND p.status = ?";
        params.push(filters.status);
      }

      if (filters.user_id) {
        query += " AND p.user_id = ?";
        params.push(filters.user_id);
      }

      if (filters.masyarakat_id) {
        query += " AND p.masyarakat_id = ?";
        params.push(filters.masyarakat_id);
      }

      if (filters.payment_month) {
        query += " AND p.payment_month = ?";
        params.push(filters.payment_month);
      }

      query += " ORDER BY p.created_at DESC";

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan payment berdasarkan ID
  static async getById(id) {
    try {
      const [rows] = await pool.execute(
        `
        SELECT p.*, 
               pt.name as payment_type_name, pt.description as payment_type_description,
               m.nama as masyarakat_nama, m.nik as masyarakat_nik,
               u.username as user_username,
               approver.username as approved_by_username
        FROM payments p
        JOIN payment_types pt ON p.payment_type_id = pt.id
        JOIN masyarakat m ON p.masyarakat_id = m.id
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN users approver ON p.approved_by = approver.id
        WHERE p.id = ?
      `,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Membuat payment baru
  static async create(data) {
    try {
      const { user_id, masyarakat_id, payment_type_id, amount, payment_month, proof_image, notes } = data;

      const [result] = await pool.execute(
        `
        INSERT INTO payments (user_id, masyarakat_id, payment_type_id, amount, payment_month, proof_image, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [user_id, masyarakat_id, payment_type_id, amount, payment_month, proof_image, notes]
      );

      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Update payment
  static async update(id, data) {
    try {
      const { amount, payment_month, proof_image, notes } = data;

      const [result] = await pool.execute(
        `
        UPDATE payments SET 
        amount = ?, payment_month = ?, proof_image = ?, notes = ?, 
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [amount, payment_month, proof_image, notes, id]
      );

      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Update status payment (approve/reject)
  static async updateStatus(id, status, approved_by, notes = null) {
    try {
      const payment_date = status === "approved" ? new Date() : null;
      const approved_at = status === "approved" ? new Date() : null;

      const [result] = await pool.execute(
        `
        UPDATE payments SET 
        status = ?, approved_by = ?, notes = ?, payment_date = ?, approved_at = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [status, approved_by, notes, payment_date, approved_at, id]
      );

      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Hapus payment
  static async delete(id) {
    try {
      const [result] = await pool.execute("DELETE FROM payments WHERE id = ?", [id]);
      return result.affectedRows;
    } catch (error) {
      throw error;
    }
  }

  // Get payment statistics
  static async getStats(filters = {}) {
    try {
      let baseQuery = "FROM payments p WHERE 1=1";
      const params = [];

      if (filters.user_id) {
        baseQuery += " AND p.user_id = ?";
        params.push(filters.user_id);
      }

      if (filters.masyarakat_id) {
        baseQuery += " AND p.masyarakat_id = ?";
        params.push(filters.masyarakat_id);
      }

      const [totalResult] = await pool.execute(`SELECT COUNT(*) as total ${baseQuery}`, params);
      const [pendingResult] = await pool.execute(`SELECT COUNT(*) as total ${baseQuery} AND p.status = 'pending'`, params);
      const [approvedResult] = await pool.execute(`SELECT COUNT(*) as total ${baseQuery} AND p.status = 'approved'`, params);
      const [rejectedResult] = await pool.execute(`SELECT COUNT(*) as total ${baseQuery} AND p.status = 'rejected'`, params);
      const [totalAmountResult] = await pool.execute(`SELECT COALESCE(SUM(p.amount), 0) as total ${baseQuery} AND p.status = 'approved'`, params);

      return {
        total: totalResult[0].total,
        pending: pendingResult[0].total,
        approved: approvedResult[0].total,
        rejected: rejectedResult[0].total,
        totalAmount: totalAmountResult[0].total,
      };
    } catch (error) {
      throw error;
    }
  }

  // Check if payment already exists for specific month
  static async checkExisting(id, payment_type_id, payment_month, useUserId = false) {
    try {
      let query, params;

      if (useUserId) {
        // Check by user_id when masyarakat_id is not available
        query = `
          SELECT id FROM payments
          WHERE user_id = ? AND payment_type_id = ? AND payment_month = ?
        `;
        params = [id, payment_type_id, payment_month];
      } else {
        // Check by masyarakat_id (original behavior)
        query = `
          SELECT id FROM payments
          WHERE masyarakat_id = ? AND payment_type_id = ? AND payment_month = ?
        `;
        params = [id, payment_type_id, payment_month];
      }

      const [rows] = await pool.execute(query, params);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get payments by month for dashboard
  static async getByMonth(year, month, filters = {}) {
    try {
      const payment_month = `${year}-${month.toString().padStart(2, "0")}`;

      let query = `
        SELECT p.*, 
               pt.name as payment_type_name,
               m.nama as masyarakat_nama, m.nik as masyarakat_nik,
               u.username as user_username
        FROM payments p
        JOIN payment_types pt ON p.payment_type_id = pt.id
        JOIN masyarakat m ON p.masyarakat_id = m.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.payment_month = ?
      `;

      const params = [payment_month];

      if (filters.user_id) {
        query += " AND p.user_id = ?";
        params.push(filters.user_id);
      }

      if (filters.status) {
        query += " AND p.status = ?";
        params.push(filters.status);
      }

      query += " ORDER BY p.created_at DESC";

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Payment;
