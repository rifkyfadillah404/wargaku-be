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
app.use("/api/auth", require("./routes/auth"));
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

// Error handling middleware
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
