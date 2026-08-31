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
const { sendEmail } = require("../../services/emailService");
const alumniModel = require("../../models/postgres/alumniModel");

const jwtSecret = process.env.JWT_SECRET || "super_secret_jwt_key_login_2026";

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

    await sendEmail({
      to: email,
      subject: "[LOGIN 2026] Your Verification OTP",
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #0A0607; color: #F7F2F2; padding: 24px; border-radius: 6px; border: 1px solid #2A1A1D; text-align: center;">
          <h2 style="color: #E01B22; margin-top: 0;">LOGIN 2026 Verification</h2>
          <p>Your OTP code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #F7F2F2; background: #130C0E; padding: 16px; display: inline-block; border: 1px solid #E01B22; border-radius: 4px; margin: 16px 0;">
            ${otp}
          </div>
          <p style="color: #A79798; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });

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

    const loginId = isAlumni ? null : await generateLoginId(transaction);

    const finalEmail = email ? email.toLowerCase().trim() : null;
    const finalPhone = phone || null;

    if (!name || (!isAlumni && !password)) {
      await transaction.rollback();
      return res.status(400).json({
        message: isAlumni ? "Name is required" : "Name and password are required",
      });
    }

    if (isAlumni && batch_year && !/^\d{2,4}(MX)?$/i.test(String(batch_year).trim())) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Please enter a valid batch (e.g. 25MX)",
      });
    }

    if (!email) {
      await transaction.rollback();
      return res.status(400).json({ message: "Email is required for registration." });
    }

    if (!otp) {
      await transaction.rollback();
      return res.status(400).json({ message: "OTP is required for registration." });
    }

    const validOtp = await otpModel.findOne({ where: { email: finalEmail, otp }, transaction });
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
      sendEmail({
        to: finalEmail,
        subject: "[LOGIN 2K26] Welcome Back, Alumni! Confirmation",
        html: `<p>Welcome back, ${alumni.name}! Your LOGIN 2K26 alumni RSVP is confirmed.</p><p>Visit <a href="${frontendUrl}">${frontendUrl}</a> for event updates.</p>`,
      }).catch((err) => console.error("Failed to send alumni welcome email:", err));
      return res.status(201).json({ message: "Alumni registration saved successfully." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const normalizedRole = "student";
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
      const calendarLink = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=LOGIN+2K26+35th+Edition+Alumni+Reunion&dates=20260918T033000Z/20260919T113000Z&details=Welcome+back+to+PSG+Tech+for+the+35th+Edition+of+LOGIN+2K26+National+Cyber+Symposium!&location=PSG+College+of+Technology,+Coimbatore";
      
      const emailSubject = isAlumni
        ? `[LOGIN 2K26] Welcome Back, Alumni! Confirmation & Event Calendar Reminder`
        : `[LOGIN 2K26] Welcome! Your Participant ID & Credentials`;

      const emailHtml = isAlumni ? `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0A0607; color: #F7F2F2; padding: 32px; border-radius: 6px; max-width: 600px; margin: 0 auto; border: 1px solid #2A1A1D;">
          <div style="border-bottom: 2px solid #E01B22; padding-bottom: 16px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: #E01B22; margin: 0; font-size: 26px; letter-spacing: 3px;">LOGIN 2K26</h1>
            <p style="color: #E08A17; margin: 6px 0 0 0; font-size: 13px; font-family: monospace; font-weight: bold;">35TH EDITION • ALUMNI REUNION</p>
            <p style="color: #A79798; margin: 4px 0 0 0; font-size: 11px;">Department of Computer Applications • PSG College of Technology</p>
          </div>
          
          <h2 style="color: #F7F2F2; font-size: 22px; margin-top: 0; text-align: center;">WELCOME BACK, ${user.name.toUpperCase()}!</h2>
          
          <p style="color: #A79798; font-size: 14px; line-height: 1.6;">
            We are honored to have you register for the <strong style="color: #F7F2F2;">35th Edition of LOGIN 2K26</strong>! You were part of the journey, and we are excited to have you back as part of the legacy.
          </p>

          <div style="background: #130C0E; border: 2px solid #E08A17; padding: 20px; margin: 24px 0; border-radius: 4px; text-align: center;">
            <p style="color: #E08A17; font-size: 11px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 2px; font-family: monospace;">Official Alumni Registration Pass</p>
            <h3 style="color: #F7F2F2; font-size: 24px; margin: 0 0 8px 0; font-family: monospace;">${loginId}</h3>
            <p style="color: #A79798; font-size: 12px; margin: 0;">Batch: <strong style="color: #F7F2F2;">${batch_year || 'Alumni'}</strong> • Location: <strong style="color: #F7F2F2;">${place || 'PSG Tech'}</strong></p>
          </div>

          <div style="background: #1A0306; border-left: 4px solid #E01B22; padding: 16px; margin-bottom: 24px; border-radius: 2px;">
            <p style="color: #F7F2F2; font-size: 13px; margin: 0 0 6px 0; font-weight: bold;">📅 MARK YOUR CALENDAR</p>
            <p style="color: #A79798; font-size: 12px; margin: 0;">Dates: September 18-19, 2026<br/>Venue: PSG College of Technology, Coimbatore</p>
          </div>

          <div style="margin: 32px 0; text-align: center;">
            <a href="${calendarLink}" target="_blank" style="background-color: #E01B22; color: #F7F2F2; text-decoration: none; padding: 14px 28px; border-radius: 2px; font-weight: bold; font-family: monospace; letter-spacing: 1px; display: inline-block; box-shadow: 0 4px 15px rgba(224,27,34,0.4);">+ ADD TO GOOGLE CALENDAR</a>
          </div>

          <p style="color: #6B5A5C; font-size: 12px; margin-top: 24px; border-top: 1px solid #2A1A1D; padding-top: 16px; text-align: center;">
            🔒 Your information is strictly used for LOGIN 2K26 coordination.<br/>
            Organized by Department of Computer Applications, PSG College of Technology.
          </p>
        </div>
      ` : `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0A0607; color: #F7F2F2; padding: 32px; border-radius: 6px; max-width: 600px; margin: 0 auto; border: 1px solid #2A1A1D;">
          <div style="border-bottom: 2px solid #E01B22; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #E01B22; margin: 0; font-size: 24px; letter-spacing: 2px;">LOGIN 2K26</h1>
            <p style="color: #A79798; margin: 6px 0 0 0; font-size: 12px; font-family: monospace;">Department of Computer Applications • PSG College of Technology</p>
          </div>
          <h2 style="color: #F7F2F2; font-size: 20px; margin-top: 0;">Welcome to LOGIN 2K26!</h2>
          <p style="color: #A79798; font-size: 14px; line-height: 1.6;">Hello <strong style="color: #F7F2F2;">${user.name}</strong>,</p>
          <p style="color: #A79798; font-size: 14px; line-height: 1.6;">Your participant account has been created successfully. Here are your login credentials:</p>
          
          <div style="background: #130C0E; border: 2px solid #E01B22; padding: 24px; margin: 24px 0; border-radius: 4px; text-align: center;">
            <p style="color: #A79798; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">Your Participant ID (Username)</p>
            <h2 style="color: #E01B22; font-size: 32px; margin: 0 0 16px 0; letter-spacing: 4px; font-family: monospace;">${loginId}</h2>
            
            <p style="color: #A79798; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;">Your Password</p>
            <div style="background: #0A0607; border: 1px dashed #E01B22; display: inline-block; padding: 8px 16px; color: #F7F2F2; font-family: monospace; font-size: 18px; letter-spacing: 2px;">
              ${rawPassword}
            </div>
          </div>

          <p style="color: #A79798; font-size: 14px; line-height: 1.6;">Use these credentials to log in at <a href="${frontendUrl}/login" style="color: #E01B22;">${frontendUrl}/login</a>.</p>
          
          <div style="margin: 32px 0; text-align: center;">
            <a href="${calendarLink}" target="_blank" style="background-color: #E01B22; color: #F7F2F2; text-decoration: none; padding: 12px 24px; border-radius: 2px; font-weight: bold; font-family: monospace; letter-spacing: 1px; display: inline-block;">+ ADD TO GOOGLE CALENDAR</a>
          </div>

          <p style="color: #6B5A5C; font-size: 12px; margin-top: 24px; border-top: 1px solid #2A1A1D; padding-top: 16px;">
            For assistance, contact the organizing team at <a href="mailto:login@psgtech.ac.in" style="color: #E01B22;">login@psgtech.ac.in</a>.
          </p>
        </div>
      `;

      sendEmail({
        to: finalEmail,
        subject: emailSubject,
        html: emailHtml,
      }).catch(err => console.error("Failed to send welcome email:", err));
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

    const normalizedRole = String(user.role || "student").toLowerCase();

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
