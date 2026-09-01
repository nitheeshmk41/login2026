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
  "https://login2026-client.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://frontend:5173",
].filter(Boolean));

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  if (allowedOrigins.has(origin)) return true;

  return (
    origin.includes("login.psgtech.ac.in") ||
    origin.includes("login2026-client") &&
    (origin.includes(".vercel.app") || origin.includes("localhost"))
  );
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.post("/api/contact", async (req, res) => {
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

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif; background:#0A0607; color:#F7F2F2; padding:28px; border:1px solid #2A1A1D; max-width:640px; margin:0 auto;">
        <div style="background:linear-gradient(135deg,#E01B22 0%,#26080C 100%); padding:20px 24px; margin-bottom:20px; border-radius:8px;">
          <div style="font-size:12px; letter-spacing:3px; text-transform:uppercase; font-weight:700;">LOGIN 2K26</div>
          <div style="font-size:11px; letter-spacing:2px; opacity:0.8; margin-top:8px;">CONTACT FORM MESSAGE</div>
        </div>
        <div style="line-height:1.8; font-size:15px; color:#F7F2F2;">
          <p><strong>Name:</strong> ${trimmedName}</p>
          <p><strong>Email:</strong> ${trimmedEmail}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap; color:#A79798;">${trimmedMessage.replace(/\n/g, '<br/>')}</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: "login@psgtech.ac.in",
      subject: `[LOGIN 2K26] Contact form message from ${trimmedName}`,
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
