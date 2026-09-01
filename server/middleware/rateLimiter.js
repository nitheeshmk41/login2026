const rateLimit = require("express-rate-limit");

/**
 * Rate limiters for abuse prevention on sensitive endpoints.
 * Uses in-memory store (suitable for single-instance deployments).
 * For multi-instance, swap to express-rate-limit Redis store.
 */

// Strict limiter for login attempts — 10 requests per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again after 15 minutes." },
  skipSuccessfulRequests: false,
});

// OTP send limiter — 3 requests per 15 minutes per IP to prevent bot attacks & spam
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many OTP requests from your IP address. Please try again after 15 minutes." },
  keyGenerator: (req) => {
    const forwarded = req.headers["x-forwarded-for"];
    return forwarded ? forwarded.split(",")[0].trim() : req.ip || req.socket.remoteAddress;
  },
});

// Registration limiter — 5 registrations per 30 minutes per IP
const registrationLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many registration attempts. Please try again later." },
});

// Password reset limiter — 5 requests per 15 minutes per IP
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password reset requests. Please try again after 15 minutes." },
});

// Email check limiter — 20 requests per 10 minutes per IP
const emailCheckLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
});

// Contact form limiter — 3 submissions per 15 minutes per IP
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many messages sent. Please try again later." },
});

module.exports = {
  loginLimiter,
  otpLimiter,
  registrationLimiter,
  passwordResetLimiter,
  emailCheckLimiter,
  contactLimiter,
};
