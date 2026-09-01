const paymentModel = require("../../models/postgres/paymentModel");
const userModel = require("../../models/postgres/userModel");
const { sendPaymentVerificationEmail, sendPaymentPendingEmail } = require("../../services/emailService");
const { parseCsv, extractTransactionId } = require("../../utils/csvParser");
const xlsx = require("xlsx");

const generateStudentIdCode = async (userId) => {
  const paddedId = String(userId).padStart(4, "0");
  return `LGN26-${paddedId}`;
};

const normalizeReportRow = (row) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [
    key.toLowerCase().replace(/[^a-z0-9]/g, ''),
    typeof value === 'string' ? value.trim() : value,
  ])
);

const getMyPayment = async (req, res) => {
  try {
    const payment = await paymentModel.findOne({
      where: { student_id: req.user.id },
    });

    const user = await userModel.findByPk(req.user.id);

    return res.json(
      payment || {
        amount: 150,
        status: "NOT_SUBMITTED",
        student_id_code: user ? user.student_id_code : null,
      }
    );
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payment", error: error.message });
  }
};

const createPayment = async (req, res) => {
  try {
    const { transaction_reference, receipt_url, payment_date, payment_method, amount } = req.body;

    if (!transaction_reference || !transaction_reference.trim()) {
      return res.status(400).json({ message: "Transaction reference is required" });
    }

    const trimmedRef = transaction_reference.trim();

    // Check if transaction_reference is already used by another user
    const existingRef = await paymentModel.findOne({
      where: { transaction_reference: trimmedRef },
    });

    if (existingRef && existingRef.student_id !== req.user.id) {
      return res.status(409).json({ message: "This transaction reference number has already been submitted by another account." });
    }

    if (!existingRef && trimmedRef.length < 4) {
      return res.status(400).json({ message: "Transaction reference looks incomplete. Please verify the UTR or reference number." });
    }

    const existing = await paymentModel.findOne({
      where: { student_id: req.user.id },
    });

    if (existing && existing.status === "VERIFIED") {
      return res.status(409).json({
        message: "Payment already verified",
        payment: existing,
      });
    }

    const paymentAmount = amount ? Number(amount) : 150;

    const payment = existing
      ? await existing.update({
          amount: paymentAmount,
          transaction_reference: trimmedRef,
          receipt_url: receipt_url || existing.receipt_url,
          payment_date: payment_date || existing.payment_date,
          payment_method: payment_method || existing.payment_method,
          status: "PENDING",
          rejection_reason: null,
        })
      : await paymentModel.create({
          student_id: req.user.id,
          amount: paymentAmount,
          transaction_reference: trimmedRef,
          receipt_url: receipt_url || null,
          payment_date: payment_date || null,
          payment_method: payment_method || "UPI",
          status: "PENDING",
        });

    const user = await userModel.findByPk(req.user.id);
    if (user) {
      sendPaymentPendingEmail({
        to: user.email,
        name: user.name,
        eventName: 'LOGIN 2026 Registration',
        portalUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard`,
      }).catch(() => {});
    }

    return res.status(201).json({
      message: "Payment reference submitted successfully. Pending admin verification.",
      payment,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to submit payment reference",
      error: error.message,
    });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await paymentModel.findAll({
      include: [
        {
          model: userModel,
          as: "student",
          attributes: ["id", "name", "email", "phone", "college_name", "department", "roll_no", "student_id_code"],
          where: { user_type: "PARTICIPANT" },
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch payments", error: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    const payment = await paymentModel.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    const targetStatus = status ? status.toUpperCase() : "VERIFIED";

    if (targetStatus === "VERIFIED") {
      await payment.update({
        status: "VERIFIED",
        verified_by: req.user.id,
        verified_at: new Date(),
        rejection_reason: null,
      });

      // Generate & update official Student ID
      const user = await userModel.findByPk(payment.student_id);
      if (user) {
        if (!user.student_id_code) {
          const studentIdCode = await generateStudentIdCode(user.id);
          user.student_id_code = studentIdCode;
          await user.save();
        }
        sendPaymentVerificationEmail(user, user.student_id_code);
      }
      return res.json({ message: "Payment verified successfully", payment });
    } else if (targetStatus === "REJECTED") {
      await payment.update({
        status: "REJECTED",
        rejection_reason: rejection_reason || "Invalid transaction details",
        verified_by: req.user.id,
        verified_at: new Date(),
      });
      
      return res.json({ message: "Payment rejected. Participant can resubmit details." });
    } else {
      return res.status(400).json({ message: "Invalid verification status. Must be VERIFIED or REJECTED." });
    }
  } catch (error) {
    return res.status(500).json({ message: "Failed to verify payment", error: error.message });
  }
};

const initiateRefund = async (req, res) => {
  try {
    const payment = await paymentModel.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    await payment.update({
      status: "refund_initiated",
      refund_status: "initiated",
      verified_by: req.user.id,
    });

    return res.json({ message: "Refund initiated", payment });
  } catch (error) {
    return res.status(500).json({ message: "Failed to initiate refund", error: error.message });
  }
};

/**
 * POST /payments/upload-csv
 * Admin/coordinator uploads CSV from payment portal.
 * Returns matched (found in DB) and unmatched transaction IDs.
 */
const uploadAndMatchCsv = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV, XLS, or XLSX file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const filename = req.file.originalname || '';
    
    let rows = [];
    if (filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls')) {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = xlsx.utils.sheet_to_json(worksheet);
    } else {
      const csvText = fileBuffer.toString('utf-8');
      const csvRows = parseCsv(csvText);
      // convert array of strings back to object for compatibility
      if (csvRows.length > 0) {
        const headers = csvRows[0];
        for (let i = 1; i < csvRows.length; i++) {
          const obj = {};
          headers.forEach((h, idx) => obj[h.toLowerCase()] = csvRows[i][idx]);
          rows.push(obj);
        }
      }
    }

    if (rows.length === 0) {
      return res.status(400).json({ message: 'File is empty or could not be parsed' });
    }

    const matched = [];
    const unmatched = [];

    for (const row of rows) {
      const normalizedRow = normalizeReportRow(row);
      const txnId = normalizedRow.receiptno || normalizedRow.receiptnumber || normalizedRow.transactionid || normalizedRow.utr || extractTransactionId(Object.values(row));
      if (!txnId) continue;

      const payment = await paymentModel.findOne({
        where: { transaction_reference: txnId },
        include: [{
          model: userModel,
          as: 'student',
          attributes: ['id', 'name', 'email', 'login_id', 'student_id_code'],
        }],
      });

      if (payment) {
        matched.push({
          payment_id: payment.id,
          transaction_reference: txnId,
          current_status: payment.status,
          amount: payment.amount,
          student_name: payment.student ? payment.student.name : null,
          student_login_id: payment.student ? payment.student.login_id : null,
          student_email: payment.student ? payment.student.email : null,
          csv_row: row,
        });
      } else {
        unmatched.push({ transaction_reference: txnId, csv_row: row });
      }
    }

    return res.json({
      message: `CSV processed: ${matched.length} matched, ${unmatched.length} unmatched`,
      total_rows: rows.length,
      matched,
      unmatched,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process CSV', error: error.message });
  }
};

/**
 * POST /payments/bulk-verify
 * Verify multiple payments at once (after CSV match).
 * Body: { payment_ids: number[] }
 */
const bulkVerify = async (req, res) => {
  try {
    const { payment_ids } = req.body;
    if (!Array.isArray(payment_ids) || payment_ids.length === 0) {
      return res.status(400).json({ message: 'payment_ids must be a non-empty array' });
    }

    const results = { verified: [], skipped: [], failed: [] };

    for (const id of payment_ids) {
      try {
        const payment = await paymentModel.findByPk(id);
        if (!payment) { results.skipped.push({ id, reason: 'Not found' }); continue; }
        if (payment.status === 'VERIFIED') { results.skipped.push({ id, reason: 'Already verified' }); continue; }

        await payment.update({
          status: 'VERIFIED',
          verified_by: req.user.id,
          verified_at: new Date(),
          rejection_reason: null,
        });

        const user = await userModel.findByPk(payment.student_id);
        if (user && !user.student_id_code) {
          user.student_id_code = await generateStudentIdCode(user.id);
          await user.save();
        }
        if (user) {
          sendPaymentVerificationEmail(user, user.student_id_code).catch(() => {});
        }

        results.verified.push(id);
      } catch (err) {
        results.failed.push({ id, error: err.message });
      }
    }

    return res.json({
      message: `Bulk verification complete: ${results.verified.length} verified, ${results.skipped.length} skipped, ${results.failed.length} failed`,
      ...results,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Bulk verification failed', error: error.message });
  }
};

module.exports = {
  getMyPayment,
  createPayment,
  getAllPayments,
  verifyPayment,
  initiateRefund,
  uploadAndMatchCsv,
  bulkVerify,
};

