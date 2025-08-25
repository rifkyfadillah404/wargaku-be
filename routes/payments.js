const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const paymentController = require('../controllers/paymentController');
const { authenticateToken, requireAdmin, requireUser } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/payments/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diizinkan!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Payment types routes - placed BEFORE dynamic :id routes to avoid route conflicts
router.get('/types/all', authenticateToken, requireUser, paymentController.getAllPaymentTypes);
router.get('/types/:id', authenticateToken, requireUser, paymentController.getPaymentTypeById);

// Payment routes
router.get('/', authenticateToken, requireUser, paymentController.getAllPayments);
router.get('/stats', authenticateToken, requireUser, paymentController.getPaymentStats);
router.get('/:id', authenticateToken, requireUser, paymentController.getPaymentById);
router.post('/', authenticateToken, requireUser, upload.single('proof_image'), paymentController.createPayment);
router.put('/:id', authenticateToken, requireUser, upload.single('proof_image'), paymentController.updatePayment);
router.put('/:id/status', authenticateToken, requireAdmin, paymentController.updatePaymentStatus);
router.delete('/:id', authenticateToken, requireUser, paymentController.deletePayment);

module.exports = router;
