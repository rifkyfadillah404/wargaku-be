const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

console.log("Auth routes loaded, loginMasyarakat function:", typeof authController.loginMasyarakat);

// Public routes
router.post("/login", authController.login);

// Test route
router.post("/test", (req, res) => {
  console.log("Test route hit!");
  res.json({ success: true, message: "Test route works!" });
});
router.post(
  "/login-masyarakat",
  (req, res, next) => {
    console.log("Route /login-masyarakat hit");
    next();
  },
  authController.loginMasyarakat
);

// Protected routes
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, authController.updateProfile);
router.put("/change-password", authenticateToken, authController.changePassword);
router.post("/logout", authenticateToken, authController.logout);

// Admin only routes
router.post("/register", authenticateToken, requireAdmin, authController.register);

module.exports = router;
