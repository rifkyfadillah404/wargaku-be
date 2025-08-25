const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 5001; // Different port

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Test server works!" });
});

// Login masyarakat route
app.post("/api/auth/login-masyarakat", async (req, res) => {
  console.log("🚨 TEST SERVER - LOGIN MASYARAKAT HIT!", req.body);
  
  try {
    const { nik, nama } = req.body;

    if (!nik || !nama) {
      return res.status(400).json({
        success: false,
        message: 'NIK dan nama diperlukan'
      });
    }

    // Mock response for testing
    const userObject = {
      id: `masyarakat_test`,
      username: nama,
      email: null,
      role: 'masyarakat',
      masyarakat_id: 1,
      masyarakat_nama: nama,
      masyarakat_nik: nik,
      is_active: true
    };

    console.log("🎉 TEST LOGIN SUCCESS!", nama);

    res.status(200).json({
      success: true,
      message: 'Login berhasil (TEST)',
      data: {
        user: userObject,
        token: 'test-token',
        refreshToken: 'test-refresh-token'
      }
    });
  } catch (error) {
    console.error('💥 Test login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat login',
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 TEST Server berjalan di http://localhost:${PORT}`);
});
