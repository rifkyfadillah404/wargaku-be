const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Masyarakat = require('../models/Masyarakat');

// Secret key untuk JWT (sebaiknya di environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Middleware untuk verifikasi token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token diperlukan'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Support "masyarakat" tokens that are not backed by users table
    // Expect decoded.userId like "masyarakat_123" and decoded.role === "masyarakat"
    if (
      (typeof decoded.userId === 'string' && decoded.userId.startsWith('masyarakat_')) ||
      decoded.role === 'masyarakat'
    ) {
      const masyarakatIdStr = typeof decoded.userId === 'string' && decoded.userId.startsWith('masyarakat_')
        ? decoded.userId.split('_')[1]
        : null;
      const masyarakatId = masyarakatIdStr ? parseInt(masyarakatIdStr, 10) : null;

      // Try enrich from DB for profile completeness
      let masyarakatData = null;
      if (masyarakatId) {
        try {
          masyarakatData = await Masyarakat.getById(masyarakatId);
        } catch (e) {
          // non-fatal, continue with minimal object
        }
      }

      // Attach enriched user-like object for masyarakat
      req.user = {
        id: decoded.userId, // keep string to avoid collision with numeric users.id
        role: 'masyarakat',
        masyarakat_id: masyarakatId || null,
        masyarakat_nama: masyarakatData?.nama || undefined,
        masyarakat_nik: masyarakatData?.nik || undefined,
        username: masyarakatData?.nama || undefined,
        is_active: true
      };
      return next();
    }
    
    // Regular user/admin from users table
    const user = await User.getById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau user tidak aktif'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token sudah expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error dalam verifikasi token'
    });
  }
};

// Middleware untuk verifikasi role admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication diperlukan'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya admin yang diizinkan'
    });
  }

  next();
};

// Middleware untuk verifikasi role user atau admin
const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication diperlukan'
    });
  }

  if (!['masyarakat', 'admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak'
    });
  }

  next();
};

// Middleware untuk verifikasi user hanya bisa akses data sendiri (kecuali admin)
const requireOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication diperlukan'
    });
  }

  // Admin bisa akses semua data
  if (req.user.role === 'admin') {
    return next();
  }

  // User hanya bisa akses data yang terkait dengan masyarakat_id mereka
  const requestedMasyarakatId = req.params.masyarakatId || req.body.masyarakat_id;
  
  if (req.user.masyarakat_id && requestedMasyarakatId && 
      parseInt(req.user.masyarakat_id) !== parseInt(requestedMasyarakatId)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Anda hanya bisa mengakses data sendiri'
    });
  }

  next();
};

// Generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '24h' } // Token berlaku 24 jam
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' } // Refresh token berlaku 7 hari
  );
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireUser,
  requireOwnerOrAdmin,
  generateToken,
  generateRefreshToken,
  JWT_SECRET
};
