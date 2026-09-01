const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { sequelize } = require("../../config/db/postgres");
const userModel = require("../../models/postgres/userModel");
const paymentModel = require("../../models/postgres/paymentModel");
const registrationModel = require("../../models/postgres/registrationModel");
const teamModel = require("../../models/postgres/teamModel");
const teamMemberModel = require("../../models/postgres/teamMemberModel");
const otpModel = require("../../models/postgres/otpModel");
const {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendAlumniWelcomeEmail,
} = require("../../services/emailService");
const alumniModel = require("../../models/postgres/alumniModel");

const jwtSecret = process.env.JWT_SECRET || "super_secret_jwt_key_login_2026";

const normalizeRole = (role) => {
  const value = String(role || '').trim().toLowerCase();
  const roleMap = {
    student: 'participant',
    participant: 'participant',
    event_coordinator: 'coordinator',
    coordinator: 'coordinator',
    special_user: 'coordinator',
    junior_attendance: 'coordinator',
    admin: 'admin',
    super_admin: 'admin',
    admin_power: 'admin',
  };

  return roleMap[value] || value || 'participant';
};

const LOGIN_ID_PREFIX = "LOGIN";
const LOGIN_ID_START = 101;

const parseStoredTeamEmails = (value) => {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((email) => String(email).trim().toLowerCase()).filter(Boolean);
  } catch (error) {
    return [];
  }
};

const pairPendingTeamInvite = async (userId, email) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!normalizedEmail) return null;

  const teams = await teamModel.findAll();
  let pairedTeam = null;

  for (const team of teams) {
    const pendingEmails = parseStoredTeamEmails(team.member_emails);
    if (!pendingEmails.includes(normalizedEmail)) continue;

    pairedTeam = team;
    await teamMemberModel.findOrCreate({
      where: { team_id: team.id, student_id: userId },
      defaults: { team_id: team.id, student_id: userId, role: "member", status: "accepted" },
    });

    const updatedEmails = pendingEmails.filter((item) => item !== normalizedEmail);
    await team.update({ member_emails: JSON.stringify(updatedEmails) });
    break;
  }

  return pairedTeam;
};

/**
 * Generate the next sequential LOGIN ID.
 * Uses a database transaction and unique constraint to prevent duplicates
 * under concurrent registrations.
 */
const generateLoginId = async (transaction) => {
  const result = await sequelize.query(
    `SELECT login_id FROM users WHERE login_id IS NOT NULL ORDER BY id DESC LIMIT 50`,
    { type: sequelize.constructor.QueryTypes.SELECT, transaction }
  );

  let maxNum = LOGIN_ID_START - 1;
  for (const row of result) {
    const match = row.login_id && row.login_id.match(/^LOGIN(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return `${LOGIN_ID_PREFIX}${maxNum + 1}`;
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const existingOtp = await otpModel.findOne({ where: { email: email.toLowerCase() } });
    if (existingOtp) {
      await existingOtp.update({ otp, expires_at: expiresAt });
    } else {
      await otpModel.create({ email: email.toLowerCase(), otp, expires_at: expiresAt });
    }

    await sendOtpEmail(email, otp, 10);

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

const buildUserResponse = (user, hasPaidFee, registrations = []) => ({
  id: user.id,
  login_id: user.login_id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  college_name: user.college_name,
  department: user.department,
  roll_no: user.roll_no,
  role: user.role,
  user_type: user.user_type,
  student_id_code: user.student_id_code,
  is_active: user.is_active,
  accommodation_required: user.accommodation_required,
  must_change_password: user.must_change_password,
  hasPaidFee,
  registrations: registrations.map((r) => ({ worldId: r.event_id })),
});

const registerUser = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      name,
      email,
      phone,
      password,
      college_name,
      department,
      roll_no,
      user_type = "PARTICIPANT",
      gender,
      year_of_study,
      batch_year,
      place,
      current_organization,
      accommodation_required = false,
      otp,
    } = req.body;

    const isAlumni = String(user_type).toUpperCase() === "ALUMNI";
    const trimmedName = String(name || "").trim();
    const finalEmail = email ? String(email).trim().toLowerCase() : "";
    const finalPhone = phone ? String(phone).trim() : "";
    const trimmedPassword = typeof password === "string" ? password.trim() : "";
    const trimmedOtp = typeof otp === "string" ? otp.trim() : "";

    if (!trimmedName) {
      await transaction.rollback();
      return res.status(400).json({ message: "Full name is required for registration." });
    }

    if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!isAlumni && (!trimmedPassword || trimmedPassword.length < 6)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    if (!isAlumni && (!college_name || String(college_name).trim().length < 2)) {
      await transaction.rollback();
      return res.status(400).json({ message: "College name is required." });
    }

    if (!isAlumni && (!department || String(department).trim().length < 2)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Department is required." });
    }

    if (!gender || String(gender).trim().length < 1) {
      await transaction.rollback();
      return res.status(400).json({ message: "Please select a gender." });
    }

    if (finalPhone && !/^\+?[0-9\s()-]{10,15}$/.test(finalPhone)) {
      await transaction.rollback();
      return res.status(400).json({ message: "Please enter a valid mobile number." });
    }

    if (isAlumni && batch_year && !/^\d{2,4}(MX)?$/i.test(String(batch_year).trim())) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Please enter a valid batch (e.g. 25MX)",
      });
    }

    if (!trimmedOtp || !/^\d{6}$/.test(trimmedOtp)) {
      await transaction.rollback();
      return res.status(400).json({ message: "OTP is required and must be a 6-digit code." });
    }

    const loginId = isAlumni ? null : await generateLoginId(transaction);

    const validOtp = await otpModel.findOne({ where: { email: finalEmail, otp: trimmedOtp }, transaction });
    if (!validOtp) {
      await transaction.rollback();
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (new Date() > validOtp.expires_at) {
      await transaction.rollback();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Delete OTP so it cannot be reused
    await validOtp.destroy({ transaction });

    const existingAlumni = isAlumni && email
      ? await alumniModel.findOne({ where: { email: finalEmail }, transaction })
      : null;
    if (existingAlumni) {
      await transaction.rollback();
      return res.status(409).json({ message: "Email address is already registered" });
    }

    // Only check for an existing user when registering a participant or staff account.
    if (email) {
      const existingUser = await userModel.findOne({
        where: { email: finalEmail },
        transaction,
      });

      if (existingUser) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Email address is already registered",
        });
      }
    }

    if (isAlumni) {
      const alumni = await alumniModel.create({
        name,
        email: finalEmail,
        phone: finalPhone,
        batch_year: String(batch_year || "").trim(),
        gender,
        place,
        current_organization,
        accommodation_required: Boolean(accommodation_required),
      }, { transaction });
      await transaction.commit();
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      sendAlumniWelcomeEmail({
        name: alumni.name,
        email: finalEmail,
        batchYear: alumni.batch_year || 'Alumni',
        calendarUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=LOGIN+2K26+35th+Edition+Alumni+Reunion&dates=20260918T033000Z/20260919T113000Z&details=Welcome+back+to+PSG+Tech+for+the+35th+Edition+of+LOGIN+2K26+National+Cyber+Symposium!&location=PSG+College+of+Technology,+Coimbatore`,
      }).catch((err) => console.error("Failed to send alumni welcome email:", err));
      return res.status(201).json({ message: "Alumni registration saved successfully." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedRole = "participant";
    const user = await userModel.create(
      {
        name,
        email: finalEmail,
        phone: finalPhone,
        password: hashedPassword,
        college_name: college_name || "PSG College of Technology",
        department: department || "MCA",
        roll_no,
        user_type: "PARTICIPANT",
        gender,
        year_of_study,
        batch_year,
        place,
        current_organization,
        accommodation_required: Boolean(accommodation_required),
        role: normalizedRole,
        login_id: loginId,
      },
      { transaction }
    );

    await transaction.commit();

    await pairPendingTeamInvite(user.id, user.email);

    // Send welcome email with calendar invite only if email is provided
    if (email) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=LOGIN+2K26+35th+Edition+Alumni+Reunion&dates=20260918T033000Z/20260919T113000Z&details=Welcome+back+to+PSG+Tech+for+the+35th+Edition+of+LOGIN+2K26+National+Cyber+Symposium!&location=PSG+College+of+Technology,+Coimbatore`;

      if (isAlumni) {
        sendAlumniWelcomeEmail({
          name: user.name,
          email: finalEmail,
          batchYear: batch_year || 'Alumni',
          calendarUrl: calendarLink,
        }).catch((err) => console.error("Failed to send alumni welcome email:", err));
      } else {
        sendWelcomeEmail({
          to: finalEmail,
          name: user.name,
          loginId,
          password: password,
          loginUrl: `${frontendUrl}/login`,
        }).catch((err) => console.error("Failed to send welcome email:", err));
      }
    }

    return res.status(201).json({
      message: "User registered successfully.",
      loginId
    });
  } catch (error) {
    try { await transaction.rollback(); } catch (_) {}
    return res.status(500).json({
      message: "Failed to register user",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { loginId, email, password } = req.body;

    // Support dual-mode login: LOGIN ID (primary) or email (fallback for admins)
    if (!loginId && !email) {
      return res.status(400).json({
        message: "LOGIN ID or email is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    let user = null;

    // Try LOGIN ID first
    if (loginId) {
      user = await userModel.findOne({
        where: sequelize.where(
          sequelize.fn("LOWER", sequelize.col("login_id")),
          loginId.trim().toLowerCase()
        ),
      });
    }

    // Fallback to email if LOGIN ID not provided or not found
    if (!user && email) {
      user = await userModel.findOne({
        where: { email },
      });
    }

    // Also try loginId value as email (backward compat if someone types email in loginId field)
    if (!user && loginId && loginId.includes("@")) {
      user = await userModel.findOne({
        where: { email: loginId.trim() },
      });
    }

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        message: "User account is inactive",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const normalizedRole = normalizeRole(user.role);
    if (normalizedRole === 'alumni' || String(user.user_type || '').toUpperCase() === 'ALUMNI') {
      return res.status(403).json({ message: 'Alumni accounts are not available for dashboard login.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: normalizedRole,
        user_type: user.user_type,
      },
      jwtSecret,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const payment = await paymentModel.findOne({
      where: { student_id: user.id, status: ["PENDING", "VERIFIED"] }
    });

    const registrations = await registrationModel.findAll({
      where: { student_id: user.id }
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: buildUserResponse(user, !!payment, registrations),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
      error: error.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await userModel.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Return success anyway for security reasons
      return res.status(200).json({ message: "If account exists, an OTP has been sent." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const existingOtp = await otpModel.findOne({ where: { email: email.toLowerCase() } });
    if (existingOtp) {
      await existingOtp.update({ otp, expires_at: expiresAt });
    } else {
      await otpModel.create({ email: email.toLowerCase(), otp, expires_at: expiresAt });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendUrl}/reset-password?email=${encodeURIComponent(user.email)}&otp=${otp}`;

    await sendEmail({
      to: user.email,
      subject: "[LOGIN 2026] Password Reset Link",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0607; color: #F7F2F2; padding: 32px; border-radius: 6px; border: 1px solid #2A1A1D; text-align: center; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E01B22; margin-top: 0; font-size: 24px;">Password Reset Request</h2>
          <p style="color: #A79798; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">We received a request to reset your password. Click the secure button below to set a new password for your account.</p>
          <a href="${resetLink}" style="background-color: #E01B22; color: #F7F2F2; text-decoration: none; padding: 14px 28px; border-radius: 2px; font-weight: bold; font-family: monospace; letter-spacing: 1px; display: inline-block;">RESET PASSWORD</a>
          <p style="color: #6B5A5C; font-size: 12px; margin-top: 32px; border-top: 1px solid #2A1A1D; padding-top: 16px;">This link will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      message: "OTP sent to your email",
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to request password reset", error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required" });
    }

    const validOtp = await otpModel.findOne({ where: { email: email.toLowerCase(), otp } });
    if (!validOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (new Date() > validOtp.expires_at) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    const user = await userModel.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.must_change_password = false;
    await user.save();

    await validOtp.destroy();

    return res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    return res.status(400).json({ message: "Failed to reset password", error: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await userModel.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (currentPassword) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) return res.status(400).json({ message: "Current password does not match" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.must_change_password = false;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to change password", error: error.message });
  }
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ exists: false, message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await userModel.findOne({
      where: { email: normalizedEmail },
    });

    if (user) {
      return res.json({ exists: true, message: "This email address is already registered." });
    }

    return res.json({ exists: false, message: "Email is available." });
  } catch (error) {
    return res.status(500).json({ exists: false, message: "Failed to check email", error: error.message });
  }
};

module.exports = {
  sendOtp,
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  checkEmail,
};
