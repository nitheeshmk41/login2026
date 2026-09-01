const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const { sendEmail } = require("./services/emailService");

const app = express();
const publicUploadsDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "https://login.psgtech.ac.in",
  "https://www.login.psgtech.ac.in",
  "http://login.psgtech.ac.in",
  "http://www.login.psgtech.ac.in",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://frontend:5173",
].filter(Boolean));

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.has(origin)) return true;

  // Strict domain check: allow psgtech.ac.in subdomains
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname === 'login.psgtech.ac.in' || hostname === 'www.login.psgtech.ac.in' || hostname.endsWith('.psgtech.ac.in')) return true;
  } catch (_) {
    // Invalid URL — reject
  }

  return false;
};

const isProductionRequest =
  (process.env.APP_ENV || process.env.NODE_ENV || "").toLowerCase() === "production";

if (isProductionRequest) {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProductionRequest) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Express Session setup for MPA Cookie Auth
app.use(
  session({
    secret: process.env.SESSION_SECRET || "login_2k26_super_secret_session_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProductionRequest,
      sameSite: isProductionRequest ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Templating Engine setup (EJS + Express Layouts)
app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/layout-ink");

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(publicUploadsDir));

// MPA View Routes (Server-rendered HTML)
app.use("/", require("./routes/views/index"));

const { contactLimiter } = require("./middleware/rateLimiter");

/**
 * Escape HTML special characters for safe email embedding.
 */
const escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

app.post("/api/contact", contactLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body || {};
    const trimmedName = String(name || "").trim();
    const trimmedEmail = String(email || "").trim();
    const trimmedMessage = String(message || "").trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (trimmedMessage.length < 12) {
      return res.status(400).json({ message: "Your message must be at least 12 characters long." });
    }

    // Sanitize user input for email HTML to prevent XSS
    const safeName = escapeHtml(trimmedName);
    const safeEmail = escapeHtml(trimmedEmail);
    const safeMessage = escapeHtml(trimmedMessage);

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif; background:#0A0607; color:#F7F2F2; padding:28px; border:1px solid #2A1A1D; max-width:640px; margin:0 auto;">
        <div style="background:linear-gradient(135deg,#E01B22 0%,#26080C 100%); padding:20px 24px; margin-bottom:20px; border-radius:8px;">
          <div style="font-size:12px; letter-spacing:3px; text-transform:uppercase; font-weight:700;">LOGIN 2K26</div>
          <div style="font-size:11px; letter-spacing:2px; opacity:0.8; margin-top:8px;">CONTACT FORM MESSAGE</div>
        </div>
        <div style="line-height:1.8; font-size:15px; color:#F7F2F2;">
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap; color:#A79798;">${safeMessage.replace(/\n/g, '<br/>')}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: "login@psgtech.ac.in",
      subject: `[LOGIN 2K26] Contact form message from ${safeName}`,
      html,
      text: `Name: ${trimmedName}\nEmail: ${trimmedEmail}\nMessage: ${trimmedMessage}`,
    });

    return res.status(200).json({ message: "Your message has been sent successfully." });
  } catch (error) {
    console.error("Contact form email error:", error);
    return res.status(500).json({ message: "Unable to send message right now. Please contact login@psgtech.ac.in directly." });
  }
});

// API Routes
app.use("/api/events", require("./routes/postgres/eventRoutes"));
app.use("/api/registrations", require("./routes/postgres/registrationRoutes"));
app.use("/api/payments", require("./routes/postgres/paymentRoutes"));
app.use("/api/teams", require("./routes/postgres/teamRoutes"));
app.use("/api/attendance", require("./routes/postgres/attendanceRoutes"));
app.use("/api/bonafides", require("./routes/postgres/bonafideRoutes"));
app.use("/api/notifications", require("./routes/postgres/notificationRoutes"));
app.use("/api/results", require("./routes/postgres/resultRoutes"));
app.use("/api/users", require("./routes/postgres/userRoutes"));
app.use("/api/exports", require("./routes/postgres/exportRoutes"));
app.use("/api/auth", require("./routes/postgres/authRoutes"));
app.use("/api/announcements", require("./routes/postgres/announcementRoutes"));
app.use("/api/settings", require("./routes/postgres/settingRoutes"));
app.use("/api/stats", require("./routes/postgres/statsRoutes"));
app.use("/api/upload", require("./routes/postgres/uploadRoutes"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use((req, res) => {
  res.status(404).render("pages/404", {
    layout: "layouts/layout-ink",
    title: "404 Page Not Found",
    sectionName: "ERROR",
    pageId: "ERR-404",
    user: req.session.user || null,
    announcements: [],
  });
});

module.exports = app;
