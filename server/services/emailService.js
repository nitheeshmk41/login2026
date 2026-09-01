const nodemailer = require("nodemailer");

const getFrontendUrl = () => {
  const envUrl = (process.env.FRONTEND_URL || "").trim();
  if (!envUrl || envUrl.includes("vercel.app")) {
    return "https://login.psgtech.ac.in";
  }
  return envUrl.replace(/\/$/, "");
};
const frontendUrl = getFrontendUrl();

const BRAND = {
  bg: '#0A0607',
  panel: '#130C0E',
  border: '#2A1A1D',
  red: '#E01B22',
  redSoft: '#FF2A2A',
  gold: '#E08A17',
  green: '#1FA971',
  text: '#F7F2F2',
  muted: '#A79798',
  accent: '#1A0306',
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const renderBrandTemplate = ({ title, subtitle, preview, body, ctaText, ctaLink }) => `
  <div style="margin:0;padding:0;background:${BRAND.bg};font-family:'Segoe UI',Arial,sans-serif; color:${BRAND.text};">
    <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
      <div style="background:${BRAND.panel};border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;">
        <div style="background:linear-gradient(135deg, ${BRAND.red} 0%, #26080C 100%);padding:24px 28px 20px;">
          <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${BRAND.text};opacity:0.9;font-weight:700;">
            LOGIN 2K26
          </div>
          <div style="font-size:11px;letter-spacing:2px;color:${BRAND.text};opacity:0.75;margin-top:8px;font-family:monospace;">
            ${escapeHtml(subtitle || 'Department of Computer Applications • PSG College of Technology')}
          </div>
        </div>

        <div style="padding:28px 28px 8px;">
          <div style="font-size:11px;letter-spacing:2px;color:${BRAND.gold};text-transform:uppercase;font-weight:700; margin-bottom:8px; font-family:monospace;">
            ${escapeHtml(preview || 'OFFICIAL EMAIL')}
          </div>
          <h1 style="margin:0 0 10px; font-size:30px; line-height:1.2; color:${BRAND.text};">${escapeHtml(title)}</h1>
          <div style="height:2px;width:80px;background:${BRAND.red};margin:14px 0 18px;border-radius:999px;"></div>
          ${body}
        </div>

        ${ctaText && ctaLink ? `
          <div style="padding:0 28px 28px;">
            <a href="${ctaLink}" style="display:inline-block;background:${BRAND.red};color:${BRAND.text};text-decoration:none;padding:14px 22px;border-radius:4px;font-weight:700;letter-spacing:1px;font-size:12px;text-transform:uppercase;">
              ${escapeHtml(ctaText)}
            </a>
          </div>
        ` : ''}

        <div style="padding:0 28px 28px; color:${BRAND.muted}; font-size:12px; line-height:1.7; border-top:1px solid ${BRAND.border}; margin-top:16px;">
          For assistance, contact <a href="mailto:login@psgtech.ac.in" style="color:${BRAND.red}; text-decoration:none;">login@psgtech.ac.in</a><br/>
          Organized by Department of Computer Applications, PSG College of Technology.
        </div>
      </div>
    </div>
  </div>
`;

const createTransporter = ({ mailType = "general" } = {}) => {
  const isOtp = String(mailType).toLowerCase() === "otp";
  const host = process.env.SMTP_HOST;
  const user = isOtp ? process.env.SMTP_OTP_USER : process.env.SMTP_USER;
  const pass = isOtp ? process.env.SMTP_OTP_PASS : process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user,
        pass,
      },
    });
  }

  return null;
};

const sendEmail = async ({ to, subject, html, text, mailType = "general", from } = {}) => {
  try {
    const transporter = createTransporter({ mailType });
    const finalFrom = from || (
      String(mailType).toLowerCase() === "otp"
        ? (process.env.SMTP_OTP_FROM || `"LOGIN 2026 OTP" <caa@psgtech.ac.in>`)
        : (process.env.SMTP_FROM || `"LOGIN 2026" <login@psgtech.ac.in>`)
    );

    if (transporter) {
      const info = await transporter.sendMail({
        from: finalFrom,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, ""),
      });
      const senderLabel = String(mailType).toLowerCase() === "otp" ? (process.env.SMTP_OTP_USER || 'otp') : (process.env.SMTP_USER || 'login');
      console.log(`[Email Sent from ${senderLabel}] To: ${to} | Subject: ${subject} | ID: ${info.messageId}`);
      return info;
    }

    const mockSender = String(mailType).toLowerCase() === "otp" ? (process.env.SMTP_OTP_FROM || 'caa@psgtech.ac.in') : (process.env.SMTP_FROM || 'login@psgtech.ac.in');
    console.log(`[Email Logged (Sender: ${mockSender})] To: ${to} | Subject: ${subject}`);
    return { mock: true, from: mockSender };
  } catch (error) {
    console.error(`[Email Error] To: ${to} | Error:`, error.message);
    return { error: error.message };
  }
};

const sendOtpEmail = async (to, otp, expiryMinutes = 10) => {
  const subject = '[LOGIN 2026] Your verification OTP';
  const html = renderBrandTemplate({
    title: 'VERIFY YOUR ACCOUNT',
    subtitle: 'LOGIN 2K26 • Secure registration step',
    preview: 'OTP VERIFICATION',
    body: `
      <p style="margin:0 0 16px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Hello,<br /><br />
        Use the one-time password below to continue your LOGIN 2K26 registration.
      </p>
      <div style="background:${BRAND.accent};border:1px solid ${BRAND.red};padding:22px 18px;border-radius:6px;text-align:center;margin:20px 0;">
        <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${BRAND.gold};margin-bottom:10px;font-family:monospace;">Your OTP</div>
        <div style="font-size:34px;letter-spacing:6px;font-weight:800;color:${BRAND.text};font-family:monospace;">${escapeHtml(otp)}</div>
      </div>
      <p style="margin:0; font-size:13px; line-height:1.7; color:${BRAND.muted};">
        This code expires in ${expiryMinutes} minutes. Never share it with anyone.
      </p>
    `,
  });

  return sendEmail({ to, subject, html, mailType: "otp" });
};

const sendWelcomeEmail = async ({ to, name, loginId, password, loginUrl = `${frontendUrl}/login` }) => {
  const subject = '[LOGIN 2026] Welcome! Your Participant ID & Credentials';
  const html = renderBrandTemplate({
    title: 'WELCOME TO LOGIN 2K26',
    subtitle: 'Department of Computer Applications • PSG College of Technology',
    preview: 'PARTICIPANT ACCOUNT READY',
    body: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Hello <strong style="color:${BRAND.text};">${escapeHtml(name)}</strong>,
      </p>
      <p style="margin:0 0 22px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Your participant account has been created successfully. Use the details below to log in and continue your LOGIN 2K26 journey.
      </p>
      <div style="background:${BRAND.panel};border:1px solid ${BRAND.border};padding:22px;border-radius:6px;margin-bottom:20px;">
        <div style="font-size:11px;letter-spacing:2px;color:${BRAND.gold};text-transform:uppercase;font-family:monospace;margin-bottom:8px;">Login ID</div>
        <div style="font-size:30px;letter-spacing:3px;font-weight:800;color:${BRAND.red};font-family:monospace;">${escapeHtml(loginId)}</div>
        <div style="margin-top:18px;font-size:11px;letter-spacing:2px;color:${BRAND.gold};text-transform:uppercase;font-family:monospace;">Password</div>
        <div style="font-size:22px;letter-spacing:2px;font-weight:700;color:${BRAND.text};font-family:monospace;margin-top:6px;">${escapeHtml(password)}</div>
      </div>
    `,
    ctaText: 'LOGIN TO PORTAL',
    ctaLink: loginUrl,
  });

  return sendEmail({ to, subject, html });
};

const sendAlumniWelcomeEmail = async ({ name, email, batchYear, calendarUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=LOGIN+2K26+35th+Edition+Alumni+Reunion&dates=20260918T033000Z/20260919T113000Z&details=Welcome+back+to+PSG+Tech+for+the+35th+Edition+of+LOGIN+2K26+National+Cyber+Symposium!&location=PSG+College+of+Technology,+Coimbatore' }) => {
  const subject = '[LOGIN 2K26] Welcome Back, Alumni! Confirmation';
  const html = renderBrandTemplate({
    title: 'WELCOME BACK, ALUMNI',
    subtitle: '35TH EDITION • RECONNECT. RELIVE. INSPIRE.',
    preview: 'ALUMNI REGISTRATION CONFIRMED',
    body: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Dear <strong style="color:${BRAND.text};">${escapeHtml(name)}</strong>,
      </p>
      <p style="margin:0 0 22px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        We are delighted to welcome you back for the 35th Edition of LOGIN 2K26. Your alumni RSVP has been successfully confirmed.
      </p>
      <div style="background:${BRAND.accent};border:1px solid ${BRAND.gold};padding:20px;border-radius:6px;margin-bottom:20px;">
        <div style="font-size:11px;letter-spacing:2px;color:${BRAND.gold};text-transform:uppercase;font-family:monospace;">Batch / Year</div>
        <div style="font-size:24px;font-weight:800;color:${BRAND.text};margin-top:8px;">${escapeHtml(batchYear || 'Alumni')}</div>
      </div>
      <p style="margin:0; font-size:14px; line-height:1.7; color:${BRAND.muted};">
        Mark your calendar for 18–19 September 2026 and reconnect with the legacy of PSG Tech.
      </p>
    `,
    ctaText: 'ADD TO GOOGLE CALENDAR',
    ctaLink: calendarUrl,
  });

  return sendEmail({ to: email, subject, html });
};

const sendTeamInvitationEmail = async ({ to, toName, senderName, senderLoginId, teamName, eventName, acceptUrl }) => {
  const subject = `[LOGIN 2026] Team Invitation: ${escapeHtml(teamName)}`;
  const html = renderBrandTemplate({
    title: 'TEAM INVITATION',
    subtitle: 'LOGIN 2K26 • Collaboration for the arena',
    preview: 'TEAM INVITE',
    body: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Hello <strong style="color:${BRAND.text};">${escapeHtml(toName)}</strong>,
      </p>
      <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        <strong style="color:${BRAND.text};">${escapeHtml(senderName)}</strong> (${escapeHtml(senderLoginId)}) has invited you to join <strong style="color:${BRAND.text};">${escapeHtml(teamName)}</strong> for <strong style="color:${BRAND.text};">${escapeHtml(eventName)}</strong>.
      </p>
      <div style="background:${BRAND.panel};border-left:4px solid ${BRAND.red};padding:18px;border-radius:4px;margin:18px 0;">
        <div style="font-size:11px;letter-spacing:2px;color:${BRAND.gold};text-transform:uppercase;font-family:monospace;">Team</div>
        <div style="font-size:24px;font-weight:800;color:${BRAND.text};margin-top:8px;">${escapeHtml(teamName)}</div>
        <div style="margin-top:12px;color:${BRAND.muted};font-size:14px;">Event: <strong style="color:${BRAND.text};">${escapeHtml(eventName)}</strong></div>
      </div>
    `,
    ctaText: 'ACCEPT INVITATION',
    ctaLink: acceptUrl,
  });

  return sendEmail({ to, subject, html });
};

const sendPaymentPendingEmail = async ({ to, name, eventName, portalUrl = `${frontendUrl}/dashboard` }) => {
  const subject = `[LOGIN 2026] Payment Pending: ${eventName}`;
  const html = renderBrandTemplate({
    title: 'PAYMENT PENDING',
    subtitle: 'Your registration is saved, verification is still pending',
    preview: 'PAYMENT STATUS',
    body: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Hello <strong style="color:${BRAND.text};">${escapeHtml(name)}</strong>,
      </p>
      <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Your registration for <strong style="color:${BRAND.text};">${escapeHtml(eventName)}</strong> is recorded, but payment verification is still pending.
      </p>
      <div style="background:rgba(224,27,34,0.12);border:1px solid ${BRAND.red};padding:18px;border-radius:6px;margin:20px 0;">
        <div style="font-size:11px;letter-spacing:2px;color:${BRAND.gold};text-transform:uppercase;font-family:monospace;">Action required</div>
        <p style="margin:10px 0 0; font-size:14px; line-height:1.7; color:${BRAND.text};">
          Please confirm your UTR / payment reference on the portal dashboard so the admin team can verify your participation.
        </p>
      </div>
    `,
    ctaText: 'GO TO DASHBOARD',
    ctaLink: portalUrl,
  });

  return sendEmail({ to, subject, html });
};

const sendPaymentVerifiedEmail = async ({ to, name, studentIdCode, portalUrl = `${frontendUrl}/dashboard` }) => {
  const subject = `[LOGIN 2026] Payment Verified! Your Student ID is ${studentIdCode}`;
  const html = renderBrandTemplate({
    title: 'PAYMENT VERIFIED',
    subtitle: 'Your registration is now fully approved',
    preview: 'VERIFIED',
    body: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Hello <strong style="color:${BRAND.text};">${escapeHtml(name)}</strong>,
      </p>
      <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Your LOGIN 2026 payment has been verified by the organizing committee.
      </p>
      <div style="background:rgba(31,169,113,0.12);border:1px solid ${BRAND.green};padding:20px;border-radius:6px;text-align:center;margin:20px 0;">
        <div style="font-size:11px;letter-spacing:2px;color:${BRAND.gold};text-transform:uppercase;font-family:monospace;">Official Student ID</div>
        <div style="font-size:28px;letter-spacing:3px;font-weight:800;color:${BRAND.text};font-family:monospace;margin-top:10px;">${escapeHtml(studentIdCode)}</div>
      </div>
      <p style="margin:0; font-size:14px; line-height:1.7; color:${BRAND.muted};">
        You can now continue with event registration and portal access without any blockers.
      </p>
    `,
    ctaText: 'OPEN DASHBOARD',
    ctaLink: portalUrl,
  });

  return sendEmail({ to, subject, html });
};

const sendEventRegistrationConfirmation = async (user, event, team = null) => {
  // Disabled as per system policy: Event registration emails are disabled. Only OTP, Payment Verified, Forgot Password, and Registration Greeting emails are enabled.
  return Promise.resolve(false);
};

const sendEventChangeNotification = async (user, event, changes) => {
  const subject = `[LOGIN 2026] URGENT ALERT: Venue/Time Update for ${event.name}`;
  const html = renderBrandTemplate({
    title: 'SCHEDULE UPDATE',
    subtitle: 'LOGIN 2026 • Important venue or timing notice',
    preview: 'EVENT ALERT',
    body: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Hello <strong style="color:${BRAND.text};">${escapeHtml(user.name)}</strong>,
      </p>
      <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Please note that the schedule or venue details for <strong style="color:${BRAND.text};">${escapeHtml(event.name)}</strong> have been updated by the organizing committee.
      </p>
      <div style="background:${BRAND.panel};border-left:4px solid ${BRAND.red};padding:18px;border-radius:4px;">
        <div>Event Arena: <strong style="color:${BRAND.text};">${escapeHtml(event.name)}</strong></div>
        <div style="margin-top:8px;">New Venue: <strong style="color:${BRAND.text};">${escapeHtml(event.venue || 'Check Portal Dashboard')}</strong></div>
        <div style="margin-top:8px;">New Start Time: <strong style="color:${BRAND.text};">${escapeHtml(event.start_time || 'Check Portal Schedule')} IST</strong></div>
        <div style="margin-top:8px;">Day: <strong style="color:${BRAND.text};">Day ${event.day} (18–19 September 2026)</strong></div>
      </div>
    `,
    ctaText: 'VIEW SCHEDULE',
    ctaLink: `${frontendUrl}/dashboard`,
  });

  return sendEmail({ to: user.email, subject, html });
};

const sendEventReminderEmail = async (user, event) => {
  const subject = `[LOGIN 2026 REMINDER] Upcoming Competition Arena: ${event.name}`;
  const html = renderBrandTemplate({
    title: 'EVENT REMINDER',
    subtitle: 'Your LOGIN 2026 slot is coming up',
    preview: 'REMINDER',
    body: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Hello <strong style="color:${BRAND.text};">${escapeHtml(user.name)}</strong>,
      </p>
      <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        This is a reminder for your upcoming event <strong style="color:${BRAND.text};">${escapeHtml(event.name)}</strong>.
      </p>
      <div style="background:${BRAND.panel};border:1px solid ${BRAND.red};padding:18px;border-radius:6px;">
        <div>Venue: <strong style="color:${BRAND.text};">${escapeHtml(event.venue)}</strong></div>
        <div style="margin-top:8px;">Time: <strong style="color:${BRAND.text};">${escapeHtml(event.start_time)} IST</strong></div>
        <div style="margin-top:8px;">Student ID: <strong style="color:${BRAND.text};">${escapeHtml(user.student_id_code)}</strong></div>
      </div>
    `,
  });

  return sendEmail({ to: user.email, subject, html });
};

const sendPaymentVerificationEmail = async (user, studentIdCode) => {
  return sendPaymentVerifiedEmail({
    to: user.email,
    name: user.name,
    studentIdCode,
    portalUrl: `${frontendUrl}/dashboard`,
  });
};

const sendCoordinatorCredentialsEmail = async (user, defaultPassword, eventName) => {
  const subject = '[LOGIN 2026] Coordinator Account Provisioned';
  const html = renderBrandTemplate({
    title: 'COORDINATOR ACCESS',
    subtitle: 'LOGIN 2026 • Portal credentials assigned',
    preview: 'COORDINATOR PORTAL',
    body: `
      <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        Hello <strong style="color:${BRAND.text};">${escapeHtml(user.name)}</strong>,
      </p>
      <p style="margin:0 0 18px; font-size:15px; line-height:1.7; color:${BRAND.muted};">
        You have been assigned as an event coordinator for <strong style="color:${BRAND.text};">${escapeHtml(eventName)}</strong>.
      </p>
      <div style="background:${BRAND.panel};border:1px solid ${BRAND.border};padding:18px;border-radius:6px;">
        <div>Email: <strong style="color:${BRAND.text};">${escapeHtml(user.email)}</strong></div>
        <div style="margin-top:8px;">Temporary Password: <strong style="color:${BRAND.text};">${escapeHtml(defaultPassword)}</strong></div>
      </div>
      <p style="margin:16px 0 0; font-size:14px; line-height:1.7; color:${BRAND.gold};">
        Important: change your password on your first login.
      </p>
    `,
    ctaText: 'LOGIN TO PORTAL',
    ctaLink: `${frontendUrl}/login`,
  });

  return sendEmail({ to: user.email, subject, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendAlumniWelcomeEmail,
  sendTeamInvitationEmail,
  sendPaymentPendingEmail,
  sendPaymentVerifiedEmail,
  sendEventRegistrationConfirmation,
  sendEventChangeNotification,
  sendEventReminderEmail,
  sendPaymentVerificationEmail,
  sendCoordinatorCredentialsEmail,
};
