const express = require('express');
const multer = require('multer');
const { verifyJwt } = require('../../middleware/auth');
const allowRoles = require('../../middleware/allowRoles');
const paymentController = require('../../controllers/postgres/paymentController');

const router = express.Router();

// Store payment reports in memory; CSV and Excel files are parsed from the buffer.
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const filename = file.originalname.toLowerCase();
    const excelMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
    ];
    if (file.mimetype === 'text/csv' || excelMimeTypes.includes(file.mimetype) || /\.(csv|xlsx|xls)$/.test(filename)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, XLS, or XLSX files are allowed'));
    }
  },
});

// ── Participant ──────────────────────────────────────
router.get('/my', verifyJwt, allowRoles('participant'), paymentController.getMyPayment);
router.post('/', verifyJwt, allowRoles('participant'), paymentController.createPayment);

// ── Admin + Coordinator (read all payments) ──────────
router.get(
  '/',
  verifyJwt,
  allowRoles('admin', 'coordinator'),
  paymentController.getAllPayments
);

// ── Admin + Coordinator (manual verify / reject) ─────
router.put(
  '/:id/verify',
  verifyJwt,
  allowRoles('admin', 'coordinator'),
  paymentController.verifyPayment
);

// ── Admin + Coordinator (CSV upload → match) ─────────
router.post(
  '/upload-csv',
  verifyJwt,
  allowRoles('admin', 'coordinator'),
  csvUpload.single('csv'),
  paymentController.uploadAndMatchCsv
);

// ── Admin + Coordinator (bulk verify from CSV match) ──
router.post(
  '/bulk-verify',
  verifyJwt,
  allowRoles('admin', 'coordinator'),
  paymentController.bulkVerify
);

// ── Admin only (refund) ───────────────────────────────
router.put(
  '/:id/refund',
  verifyJwt,
  allowRoles('admin'),
  paymentController.initiateRefund
);

module.exports = router;
