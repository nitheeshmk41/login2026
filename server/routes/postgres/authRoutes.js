const express = require("express");
const { verifyJwt } = require("../../middleware/auth");
const authController = require("../../controllers/postgres/authController");
const {
  loginLimiter,
  otpLimiter,
  registrationLimiter,
  passwordResetLimiter,
  emailCheckLimiter,
} = require("../../middleware/rateLimiter");

const router = express.Router();

router.post("/register", registrationLimiter, authController.registerUser);
router.post("/check-email", emailCheckLimiter, authController.checkEmail);
router.post("/send-otp", otpLimiter, authController.sendOtp);
router.post("/login", loginLimiter, authController.loginUser);
router.post("/logout", authController.logoutUser);
router.post("/forgot-password", passwordResetLimiter, authController.forgotPassword);
router.post("/reset-password", passwordResetLimiter, authController.resetPassword);
router.post("/change-password", verifyJwt, authController.changePassword);

module.exports = router;
