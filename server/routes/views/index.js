const express = require('express');
const router = express.Router();
const viewController = require('../../controllers/viewController');
const { User, Event, Payment, Registration, Announcement, LegacyEdition, LegacyItem, EventChangeLog } = require('../../models/postgres');
const { sendCoordinatorCredentialsEmail, sendEventRegistrationConfirmation, sendEventChangeNotification } = require('../../services/emailService');
const bcrypt = require('bcryptjs');

// 1. Public Views
router.get('/enter', viewController.renderIntro);
router.get('/', viewController.renderLanding);
router.get('/events', viewController.renderEventsIndex);
router.get('/events/:slug', viewController.renderEventDetail);
router.get('/timeline', viewController.renderTimeline);
router.get('/legacy', viewController.renderLegacyIndex);
router.get('/legacy/:year', viewController.renderLegacyGallery);
router.get('/alumni', viewController.renderAlumni);
router.get('/contact', viewController.renderContact);
router.get('/login', viewController.renderLogin);
router.get('/register', viewController.renderRegister);

// 2. Auth Form Handlers
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.redirect('/login?error=Email%20and%20password%20are%20required');
    }

    const user = await User.findOne({ where: { email: String(email).trim().toLowerCase() } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.redirect('/login?error=Invalid%20email%20or%20password');
    }

    if (!user.is_active) {
      return res.redirect('/login?error=Account%20is%20inactive');
    }

    // Normalize role for consistent session checks
    const normalizeRole = (role) => {
      const map = { student: 'participant', event_coordinator: 'coordinator', special_user: 'coordinator', junior_attendance: 'coordinator', admin_power: 'admin', super_admin: 'admin' };
      const normalized = String(role || '').trim().toLowerCase();
      return map[normalized] || normalized || 'participant';
    };

    const normalizedRole = normalizeRole(user.role);

    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: normalizedRole,
      user_type: user.user_type,
      student_id_code: user.student_id_code
    };

    if (normalizedRole === 'admin') {
      return res.redirect('/admin');
    }
    if (normalizedRole === 'coordinator') {
      return res.redirect('/coordinator');
    }
    return res.redirect('/dashboard');
  } catch (err) {
    console.error('Login POST error:', err);
    res.redirect('/login?error=Authentication%20failed');
  }
});

// MPA registration is disabled — redirect to SPA registration which has full
// security controls (OTP verification, password strength, phone validation).
router.post('/register', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  return res.redirect(`${frontendUrl}/register`);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// 3. Participant Protected Views & Forms
router.get('/dashboard', viewController.renderDashboard);
router.get('/profile', viewController.renderProfile);

router.post('/profile/payment-reference', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const { transaction_reference } = req.body;
    const existing = await Payment.findOne({ where: { student_id: req.session.user.id } });

    if (existing) {
      await existing.update({
        transaction_reference,
        status: 'PENDING'
      });
    } else {
      await Payment.create({
        student_id: req.session.user.id,
        transaction_reference,
        amount: 150.00,
        status: 'PENDING'
      });
    }

    res.redirect('/profile?msg=Payment%20Reference%20Submitted%20Successfully');
  } catch (err) {
    console.error('Payment ref error:', err);
    res.redirect('/profile?error=Submission%20Failed');
  }
});

router.post('/events/:slug/register', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const { team_name } = req.body;
    const slug = req.params.slug;
    const events = await Event.findAll();
    const event = events.find(e => e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug);

    if (!event) return res.redirect('/events');

    await Registration.create({
      student_id: req.session.user.id,
      event_id: event.id,
      status: 'registered'
    });

    // Send confirmation email from login@psgtech.ac.in
    const user = await User.findByPk(req.session.user.id);
    if (user) {
      await sendEventRegistrationConfirmation(user, event, team_name ? { name: team_name } : null);
    }

    res.redirect(`/events/${slug}?msg=Registered%20Successfully`);
  } catch (err) {
    console.error('Event register POST error:', err);
    res.redirect(`/events/${req.params.slug}?error=Registration%20Failed`);
  }
});

// 4. Coordinator Desk Views & Forms
router.get('/coordinator', viewController.renderCoordinator);

// Roster CSV Export Route
router.get('/coordinator/export-csv', async (req, res) => {
  if (!req.session.user || !['coordinator', 'admin'].includes(req.session.user.role)) {
    return res.status(403).send('Forbidden');
  }

  try {
    const eventId = Number(req.query.event) || 1;
    const roster = await Registration.findAll({
      where: { event_id: eventId },
      include: [{ model: User, as: 'student' }]
    });

    let csvContent = 'STUDENT_ID,NAME,EMAIL,PHONE,COLLEGE,ATTENDANCE\n';
    roster.forEach((r) => {
      const u = r.student || {};
      csvContent += `"${u.student_id_code || '-'}","${u.name || '-'}","${u.email || '-'}","${u.phone || '-'}","${u.college_name || '-'}","${r.attendance_status || 'UNMARKED'}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="event_${eventId}_roster.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('CSV Export error:', err);
    res.redirect('/coordinator');
  }
});

router.post('/coordinator/:eventId/attendance/:studentId', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  try {
    const { eventId, studentId } = req.params;
    const reg = await Registration.findOne({
      where: { event_id: eventId, student_id: studentId }
    });

    if (reg) {
      const newStatus = reg.attendance_status === 'PRESENT' ? 'ABSENT' : 'PRESENT';
      await reg.update({ attendance_status: newStatus });
    }

    res.redirect(`/coordinator?event=${eventId}`);
  } catch (err) {
    console.error('Attendance toggle error:', err);
    res.redirect('/coordinator');
  }
});

// 5. Admin Panel Views & Forms
router.get('/admin', viewController.renderAdmin);

// Admin Event Venue & Timing Update Endpoint (Triggers Emails & Change Logs)
router.post('/admin/events/:id/update', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }

  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.redirect('/admin?tab=events');

    const { venue, start_time } = req.body;
    const oldVenue = event.venue;
    const oldTime = event.start_time;

    await event.update({
      venue: venue || event.venue,
      start_time: start_time || event.start_time
    });

    // Record Event Change Log
    if (EventChangeLog) {
      await EventChangeLog.create({
        event_id: event.id,
        changed_by: req.session.user.id,
        fields_changed: {
          venue: { old: oldVenue, new: event.venue },
          start_time: { old: oldTime, new: event.start_time }
        },
        notified: true
      });
    }

    // Broadcast Announcement Ticker Notice for all participants
    await Announcement.create({
      title: `VENUE/TIME ALERT: ${event.name.toUpperCase()}`,
      message: `${event.name} venue updated to ${event.venue} (Start: ${event.start_time} IST)`,
      is_active: true
    });

    // Dispatch Emails to all registered students from login@psgtech.ac.in
    const registrations = await Registration.findAll({
      where: { event_id: event.id },
      include: [{ model: User, as: 'student' }]
    });

    for (const reg of registrations) {
      const studentUser = reg.student || (await User.findByPk(reg.student_id));
      if (studentUser && studentUser.email) {
        await sendEventChangeNotification(studentUser, event, { venue: event.venue, start_time: event.start_time });
      }
    }

    res.redirect('/admin?tab=events&msg=Event%20Updated%20And%20Participants%20Notified');
  } catch (err) {
    console.error('Event update error:', err);
    res.redirect('/admin?tab=events');
  }
});

// Admin Role Provisioning & Coordinator Granting (§3 & §6)
router.post('/admin/access', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Forbidden: Admin Only Capability');
  }

  try {
    const { name, email, phone, role } = req.body;
    const defaultPass = process.env.STANDARD_ROLE_PASSWORD || 'CoordinatorPass2026!';
    const hashedPassword = await bcrypt.hash(defaultPass, 10);

    const [user, created] = await User.findOrCreate({
      where: { email },
      defaults: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || 'coordinator',
        user_type: 'PARTICIPANT',
        must_change_password: true,
      }
    });

    if (!created) {
      await user.update({
        role: role || 'event_coordinator',
        must_change_password: true,
      });
    }

    // Send provision email
    await sendCoordinatorCredentialsEmail(user, defaultPass, 'Assigned Competition Arena');

    res.redirect('/admin?tab=users&msg=Role%20Granted%20Successfully');
  } catch (err) {
    console.error('Role grant error:', err);
    res.redirect('/admin?tab=users&error=Role%20Grant%20Failed');
  }
});

router.post('/admin/payments/:id/verify', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }

  try {
    const payment = await Payment.findByPk(req.params.id);
    if (payment) {
      await payment.update({ status: 'VERIFIED' });

      const user = await User.findByPk(payment.student_id);
      if (user && !user.student_id_code) {
        const code = `LGN26-${String(user.id).padStart(4, '0')}`;
        await user.update({ student_id_code: code });
      }
    }

    res.redirect('/admin?tab=payments');
  } catch (err) {
    console.error('Payment verify error:', err);
    res.redirect('/admin?tab=payments');
  }
});

router.post('/admin/announcements', async (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }

  try {
    const { title, message } = req.body;
    await Announcement.create({ title, message, is_active: true });
    res.redirect('/admin?tab=announcements');
  } catch (err) {
    console.error('Announcement create error:', err);
    res.redirect('/admin?tab=announcements');
  }
});

// Admin Legacy Edition Creation
router.post('/admin/legacy/editions', async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'admin_power')) {
    return res.status(403).send('Forbidden');
  }

  try {
    const { edition_number, year, title, description, cover_image } = req.body;
    await LegacyEdition.create({
      edition_number: Number(edition_number),
      year: Number(year),
      title,
      description,
      cover_image,
      is_published: true
    });
    res.redirect('/admin?tab=legacy');
  } catch (err) {
    console.error('Legacy edition create error:', err);
    res.redirect('/admin?tab=legacy');
  }
});

// Admin Legacy Item Creation (Photos & Video Embeds)
router.post('/admin/legacy/items', async (req, res) => {
  if (!req.session.user || (req.session.user.role !== 'admin' && req.session.user.role !== 'admin_power')) {
    return res.status(403).send('Forbidden');
  }

  try {
    const { edition_id, type, storage_key, caption, credit } = req.body;
    await LegacyItem.create({
      edition_id: Number(edition_id),
      type: type || 'PHOTO',
      storage_key,
      caption,
      credit,
      consent_confirmed: true
    });
    res.redirect('/admin?tab=legacy');
  } catch (err) {
    console.error('Legacy item create error:', err);
    res.redirect('/admin?tab=legacy');
  }
});

module.exports = router;
