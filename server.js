const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/database");
const masyarakatRoutes = require("./routes/masyarakatRoutes");
const { validateMasyarakat, errorHandler, notFound } = require("./middleware/validation");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// EMERGENCY LOGIN MASYARAKAT ROUTE - BEFORE EVERYTHING ELSE
const Masyarakat = require("./models/Masyarakat");
const { generateToken, generateRefreshToken } = require("./middleware/auth");

app.post("/api/auth/login-masyarakat", async (req, res) => {
  console.log("🚨 EMERGENCY ROUTE HIT!", req.body);

  try {
    const { nik, nama } = req.body;

    if (!nik || !nama) {
      return res.status(400).json({
        success: false,
        message: "NIK dan nama diperlukan",
      });
    }

    // Cari masyarakat berdasarkan NIK dan nama
    const masyarakat = await Masyarakat.loginWithNIKAndName(nik, nama);

    if (!masyarakat) {
      return res.status(401).json({
        success: false,
        message: "NIK atau nama tidak ditemukan",
      });
    }

    // Buat user object untuk masyarakat
    const userObject = {
      id: `masyarakat_${masyarakat.id}`,
      username: masyarakat.nama,
      email: null,
      role: "masyarakat",
      masyarakat_id: masyarakat.id,
      masyarakat_nama: masyarakat.nama,
      masyarakat_nik: masyarakat.nik,
      is_active: true,
    };

    // Generate tokens
    const token = generateToken(userObject.id, userObject.role);
    const refreshToken = generateRefreshToken(userObject.id);

    console.log("🎉 LOGIN SUCCESS!", userObject.username);

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: {
        user: userObject,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("💥 Login error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat login",
      error: error.message,
    });
  }
});

// Debug middleware - log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Serve static files for uploads
app.use("/uploads", express.static("uploads"));

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Data Masyarakat berjalan dengan baik",
    version: "2.0.0",
    endpoints: {
      // Authentication
      "POST /api/auth/login": "Login user/admin",
      "GET /api/auth/profile": "Get user profile",
      "PUT /api/auth/profile": "Update user profile",
      "PUT /api/auth/change-password": "Change password",
      "POST /api/auth/logout": "Logout user",
      "POST /api/auth/register": "Register new user (admin only)",

      // Masyarakat
      "GET /api/masyarakat": "Mendapatkan semua data masyarakat",
      "GET /api/masyarakat/:id": "Mendapatkan data masyarakat berdasarkan ID",
      "GET /api/masyarakat/search?keyword=": "Mencari data masyarakat",
      "POST /api/masyarakat": "Menambah data masyarakat baru",
      "PUT /api/masyarakat/:id": "Mengupdate data masyarakat",
      "DELETE /api/masyarakat/:id": "Menghapus data masyarakat",

      // Payments (coming soon)
      "GET /api/payments": "Get payments data",
      "POST /api/payments": "Create new payment",
      "PUT /api/payments/:id": "Update payment status",
    },
  });
});

// API Routes
console.log("Registering auth routes...");
app.use("/api/auth", require("./routes/auth"));
console.log("Registering payment routes...");
app.use("/api/payments", require("./routes/payments"));

// API Routes dengan validasi untuk POST dan PUT
app.use(
  "/api/masyarakat",
  (req, res, next) => {
    if (req.method === "POST" || req.method === "PUT") {
      return validateMasyarakat(req, res, next);
    }
    next();
  },
  masyarakatRoutes
);

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
      console.log(`📊 API Documentation: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("❌ Gagal memulai server:", error.message);
    process.exit(1);
  }
};

startServer();
