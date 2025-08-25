const Payment = require("../models/Payment");
const PaymentType = require("../models/PaymentType");
const User = require("../models/User");
const Masyarakat = require("../models/Masyarakat");

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { status, payment_month, user_id, masyarakat_id } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (payment_month) filters.payment_month = payment_month;
    if (user_id) filters.user_id = user_id;
    if (masyarakat_id) filters.masyarakat_id = masyarakat_id;

    // If user is not admin, only show their own payments
    if (req.user.role !== "admin") {
      if (req.user.role === "masyarakat") {
        // Filter by masyarakat_id for masyarakat role
        filters.masyarakat_id = req.user.masyarakat_id;
        // Ensure we don't accidentally filter by user_id string
        delete filters.user_id;
      } else {
        filters.user_id = req.user.id;
      }
    }

    const payments = await Payment.getAll(filters);

    res.status(200).json({
      success: true,
      message: "Data pembayaran berhasil diambil",
      data: payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data pembayaran",
      error: error.message,
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.getById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Data pembayaran tidak ditemukan",
      });
    }

    // Check if user can access this payment
    if (req.user.role !== "admin") {
      if (req.user.role === "masyarakat") {
        if (!req.user.masyarakat_id || parseInt(payment.masyarakat_id) !== parseInt(req.user.masyarakat_id)) {
          return res.status(403).json({
            success: false,
            message: "Akses ditolak",
          });
        }
      } else if (payment.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak",
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Data pembayaran berhasil diambil",
      data: payment,
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data pembayaran",
      error: error.message,
    });
  }
};

// Create new payment
const createPayment = async (req, res) => {
  try {
    const { payment_type_id, amount, payment_month, notes } = req.body;

    // Debug logging
    console.log("Create payment data:", {
      payment_type_id,
      amount,
      payment_month,
      payment_month_length: payment_month?.length,
      notes,
      user_id: req.user.id,
    });

    // Validasi input
    if (!payment_type_id || !amount || !payment_month) {
      return res.status(400).json({
        success: false,
        message: "Payment type, amount, dan payment month diperlukan",
      });
    }

    // Validate payment type exists
    const paymentType = await PaymentType.getById(payment_type_id);
    if (!paymentType) {
      return res.status(400).json({
        success: false,
        message: "Jenis pembayaran tidak ditemukan",
      });
    }

    // Check if user has masyarakat_id, if not use user_id as fallback
    let masyarakat_id = req.user.masyarakat_id;
    if (!masyarakat_id) {
      // For users without masyarakat_id, we'll use user_id as identifier
      // This allows payment system to work even without linked masyarakat data
      masyarakat_id = null;
    }

    // Check if payment already exists for this month
    // Use masyarakat_id if available, otherwise use user_id for checking
    const checkId = masyarakat_id || req.user.id;
    const existingPayment = await Payment.checkExisting(checkId, payment_type_id, payment_month, !masyarakat_id);

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Pembayaran untuk bulan ini sudah ada",
      });
    }

    // Ensure a valid user_id for insert (DB may require NOT NULL/FK)
    let userIdForInsert = null;
    if (req.user.role === "admin") {
      userIdForInsert = req.user.id;
    } else {
      // masyarakat role
      // Try to find an existing user linked to this masyarakat
      const existingUser = masyarakat_id ? await User.getByMasyarakatId(masyarakat_id) : null;
      if (existingUser && existingUser.id) {
        userIdForInsert = existingUser.id;
      } else if (masyarakat_id) {
        // Create a shadow user for this masyarakat to satisfy FK constraints
        const masyarakatData = await Masyarakat.getById(masyarakat_id);
        const username = `masyarakat_${masyarakat_id}`;
        const tempPassword = `AutoGen_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        userIdForInsert = await User.create({
          username,
          email: `${masyarakat_id}@masyarakat.local`,
          password: tempPassword,
          role: "masyarakat",
          masyarakat_id,
        });
      } else {
        // Fallback: keep compatibility
        userIdForInsert = req.user.id || null;
      }
    }

    // Create payment
    const paymentId = await Payment.create({
      user_id: userIdForInsert,
      masyarakat_id: masyarakat_id,
      payment_type_id,
      amount,
      payment_month,
      proof_image: req.file ? req.file.filename : null,
      notes,
    });

    // Get created payment
    const newPayment = await Payment.getById(paymentId);

    res.status(201).json({
      success: true,
      message: "Pembayaran berhasil dibuat",
      data: newPayment,
    });
  } catch (error) {
    console.error("Create payment error:", {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: error?.sqlMessage || error?.message || "Terjadi kesalahan saat membuat pembayaran",
      error: error?.message || null
    });
  }
};

// Update payment (only for pending payments)
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_month, notes } = req.body;

    const payment = await Payment.getById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Data pembayaran tidak ditemukan",
      });
    }

    // Check if user can update this payment
    if (req.user.role !== "admin") {
      if (req.user.role === "masyarakat") {
        if (!req.user.masyarakat_id || parseInt(payment.masyarakat_id) !== parseInt(req.user.masyarakat_id)) {
          return res.status(403).json({
            success: false,
            message: "Akses ditolak",
          });
        }
      } else if (payment.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak",
        });
      }
    }

    // Only allow update for pending payments
    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Hanya pembayaran dengan status pending yang bisa diupdate",
      });
    }

    // Update payment
    await Payment.update(id, {
      amount: amount || payment.amount,
      payment_month: payment_month || payment.payment_month,
      proof_image: req.file ? req.file.filename : payment.proof_image,
      notes: notes || payment.notes,
    });

    // Get updated payment
    const updatedPayment = await Payment.getById(id);

    res.status(200).json({
      success: true,
      message: "Pembayaran berhasil diupdate",
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengupdate pembayaran",
      error: error.message,
    });
  }
};

// Approve or reject payment (admin only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validasi status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status harus approved atau rejected",
      });
    }

    const payment = await Payment.getById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Data pembayaran tidak ditemukan",
      });
    }

    // Only allow status update for pending payments
    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Hanya pembayaran dengan status pending yang bisa diupdate",
      });
    }

    // Update payment status
    await Payment.updateStatus(id, status, req.user.id, notes);

    // Get updated payment
    const updatedPayment = await Payment.getById(id);

    res.status(200).json({
      success: true,
      message: `Pembayaran berhasil ${status === "approved" ? "disetujui" : "ditolak"}`,
      data: updatedPayment,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengupdate status pembayaran",
      error: error.message,
    });
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.getById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Data pembayaran tidak ditemukan",
      });
    }

    // Check if user can delete this payment
    if (req.user.role !== "admin") {
      if (req.user.role === "masyarakat") {
        if (!req.user.masyarakat_id || parseInt(payment.masyarakat_id) !== parseInt(req.user.masyarakat_id)) {
          return res.status(403).json({
            success: false,
            message: "Akses ditolak",
          });
        }
      } else if (payment.user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Akses ditolak",
        });
      }
    }

    // Only allow delete for pending payments
    if (payment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Hanya pembayaran dengan status pending yang bisa dihapus",
      });
    }

    await Payment.delete(id);

    res.status(200).json({
      success: true,
      message: "Pembayaran berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat menghapus pembayaran",
      error: error.message,
    });
  }
};

// Get payment statistics
const getPaymentStats = async (req, res) => {
  try {
    const filters = {};

    // If user is not admin, only show their own stats
    if (req.user.role !== "admin") {
      if (req.user.role === "masyarakat") {
        filters.masyarakat_id = req.user.masyarakat_id;
      } else {
        filters.user_id = req.user.id;
      }
    }

    const stats = await Payment.getStats(filters);

    res.status(200).json({
      success: true,
      message: "Statistik pembayaran berhasil diambil",
      data: stats,
    });
  } catch (error) {
    console.error("Get payment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil statistik pembayaran",
      error: error.message,
    });
  }
};

// Get all payment types
const getAllPaymentTypes = async (req, res) => {
  try {
    const paymentTypes = await PaymentType.getAll();

    res.status(200).json({
      success: true,
      message: "Data jenis pembayaran berhasil diambil",
      data: paymentTypes,
    });
  } catch (error) {
    console.error("Get payment types error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data jenis pembayaran",
      error: error.message,
    });
  }
};

// Get payment type by ID
const getPaymentTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const paymentType = await PaymentType.getById(id);

    if (!paymentType) {
      return res.status(404).json({
        success: false,
        message: "Jenis pembayaran tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Data jenis pembayaran berhasil diambil",
      data: paymentType,
    });
  } catch (error) {
    console.error("Get payment type by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data jenis pembayaran",
      error: error.message,
    });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats,
  getAllPaymentTypes,
  getPaymentTypeById,
};
