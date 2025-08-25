const User = require("../models/User");
const Masyarakat = require("../models/Masyarakat");
const { generateToken, generateRefreshToken } = require("../middleware/auth");

// Login
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username dan password diperlukan",
      });
    }

    // Cari user berdasarkan username atau email
    let user = await User.getByUsername(username);
    if (!user) {
      user = await User.getByEmail(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    // Cek apakah user aktif
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Akun Anda tidak aktif. Hubungi administrator",
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Username atau password salah",
      });
    }

    // Generate tokens
    const token = generateToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      message: "Login berhasil",
      data: {
        user: userWithoutPassword,
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat login",
      error: error.message,
    });
  }
};

// Login Masyarakat dengan NIK dan Nama
const loginMasyarakat = async (req, res) => {
  console.log("loginMasyarakat called with:", req.body);
  try {
    const { nik, nama } = req.body;

    // Validasi input
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
    console.error("Login masyarakat error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat login",
      error: error.message,
    });
  }
};

// Register (hanya untuk admin membuat user baru)
const register = async (req, res) => {
  try {
    const { username, email, password, role = "user", masyarakat_id } = req.body;

    // Validasi input
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, dan password diperlukan",
      });
    }

    // Cek apakah username sudah ada
    const existingUsername = await User.getByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan",
      });
    }

    // Cek apakah email sudah ada
    const existingEmail = await User.getByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    // Buat user baru
    const userId = await User.create({
      username,
      email,
      password,
      role,
      masyarakat_id,
    });

    // Get user data
    const newUser = await User.getById(userId);
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: "User berhasil dibuat",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membuat user",
      error: error.message,
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;

    res.status(200).json({
      success: true,
      message: "Profile berhasil diambil",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil profile",
      error: error.message,
    });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: "Username dan email diperlukan",
      });
    }

    // Cek apakah username sudah digunakan user lain
    const existingUsername = await User.getByUsername(username);
    if (existingUsername && existingUsername.id !== userId) {
      return res.status(400).json({
        success: false,
        message: "Username sudah digunakan",
      });
    }

    // Cek apakah email sudah digunakan user lain
    const existingEmail = await User.getByEmail(email);
    if (existingEmail && existingEmail.id !== userId) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan",
      });
    }

    // Update user
    await User.update(userId, {
      username,
      email,
      role: req.user.role,
      masyarakat_id: req.user.masyarakat_id,
      is_active: req.user.is_active,
    });

    // Get updated user data
    const updatedUser = await User.getById(userId);
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      success: true,
      message: "Profile berhasil diupdate",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat update profile",
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Password lama dan password baru diperlukan",
      });
    }

    // Verify current password
    const isValidPassword = await User.verifyPassword(currentPassword, req.user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Password lama tidak benar",
      });
    }

    // Update password
    await User.updatePassword(userId, newPassword);

    res.status(200).json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengubah password",
      error: error.message,
    });
  }
};

// Logout (client-side mostly, but can be used to invalidate tokens)
const logout = async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    // For now, we'll just send a success response
    res.status(200).json({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat logout",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  loginMasyarakat,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout,
};
