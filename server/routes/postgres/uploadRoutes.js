const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyJwt } = require("../../middleware/auth");

const router = express.Router();

// Ensure uploads directory exists
const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
const baseUploadDir = isVercel ? "/tmp/uploads" : path.join(__dirname, "../../public/uploads");
const uploadDir = path.join(baseUploadDir, "receipts");
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {
    console.error("Failed to create uploadDir:", e);
  }
}

// Configure Multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "receipt-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to only allow images/PDF
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed."), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

const sharp = require("sharp");

router.post("/receipt", verifyJwt, upload.single("receipt"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded or invalid file format" });
  }
  
  try {
    let fileUrl = "";

    // If it's a PDF, we might not want to process with sharp, but the user said "add image processing"
    // We can just base64 encode PDF directly, and use Sharp for images.
    if (req.file.mimetype === "application/pdf") {
      const fileData = fs.readFileSync(req.file.path);
      fileUrl = `data:application/pdf;base64,${fileData.toString("base64")}`;
    } else {
      const processedBuffer = await sharp(req.file.path)
        .resize(800, null, { withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer();
      fileUrl = `data:image/webp;base64,${processedBuffer.toString("base64")}`;
    }

    // Optionally delete the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

    res.status(200).json({
      message: "File uploaded successfully",
      url: fileUrl,
    });
  } catch (error) {
    console.error("Processing error:", error);
    res.status(500).json({ message: "Failed to process receipt" });
  }
});

const bonafideDir = path.join(baseUploadDir, "bonafides");
if (!fs.existsSync(bonafideDir)) {
  try {
    fs.mkdirSync(bonafideDir, { recursive: true });
  } catch (e) {
    console.error("Failed to create bonafideDir:", e);
  }
}

const bonafideStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bonafideDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "bonafide-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadBonafide = multer({
  storage: bonafideStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

router.post("/bonafide", verifyJwt, uploadBonafide.single("bonafide"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded or invalid file format" });
  }
  
  const fileUrl = `/uploads/bonafides/${req.file.filename}`;
  
  res.status(200).json({
    message: "File uploaded successfully",
    url: fileUrl,
  });
});

module.exports = router;
