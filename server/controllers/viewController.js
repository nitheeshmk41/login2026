const { User, Event, Payment, Registration, Announcement, LegacyEdition, LegacyItem } = require('../models/postgres');

const getSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const GUARDIAN_SPEECH = {
  'blind-coding': { name: 'VEIL', voice: 'Quiet, economical, unnervingly certain. Code without eyes.' },
  'codexcape': { name: 'VAULTWARDEN', voice: 'Gatekeeper. Taunting, always clocking your escape sequence.' },
  'debug-arena': { name: 'FRACTURE', voice: 'Terse, surgical. No sympathy for bad code or broken pointers.' },
  'extraction': { name: 'BLACKOUT-9', voice: 'Whispering handler on an encrypted CTF channel.' },
  'project-phoenix-system-recovery': { name: 'PYRE-01', voice: 'Field commander rallying a recovery squad after total failure.' },
  'code-relay': { name: 'TANDEM', voice: 'Twin torsos alternating mid-sentence every five minutes.' },
  'in-the-slot': { name: 'GAVELON', voice: 'Fast auctioneer cadence. All momentum and cricket wisdom.' },
  'hunt-your-treasure-qr-escape-challenge': { name: 'QRUX', voice: 'Riddling lantern eye projecting hidden campus codes.' },
  'nostos-the-journey-home': { name: 'HELMSMAN', voice: 'Weary, poetic, long travelled mariner mech.' },
  'pixel-paradox-ai-or-reality': { name: 'SIMULACRA', voice: 'Unsettling two-faced head. AI or reality?' },
  'star-of-login': { name: 'THE LAST STANDING', voice: 'Colossal, battle-damaged. The supreme last mind standing.' }
};

module.exports = {
  // 1. Fullscreen Intro Video Page (/enter)
  renderIntro: (req, res) => {
    res.render('pages/enter', {
      layout: false,
      title: 'LOGIN 2026 — Intro'
    });
  },

  // 2. Main Hero & Landing Page (INK Stock)
  renderLanding: async (req, res) => {
    try {
      const [events, participantCount, announcements] = await Promise.all([
        Event.findAll(),
        User.count({ where: { user_type: 'PARTICIPANT' } }),
        Announcement.findAll({ where: { is_active: true } })
      ]);

      const formattedEvents = events.map(e => ({
        ...e.toJSON(),
        slug: getSlug(e.name),
        guardian: GUARDIAN_SPEECH[getSlug(e.name)] || { name: 'GUARDIAN', voice: 'Enter the arena.' }
      }));

      const flagship = formattedEvents.find(e => e.is_flagship) || formattedEvents[0];

      res.render('pages/landing', {
        layout: 'layouts/layout-ink',
        title: 'LOGIN 2026 — THE LAST HUMAN',
        sectionName: 'COMMAND CONSOLE',
        pageId: 'SYS-01',
        user: req.session.user || null,
        events: formattedEvents,
        flagship,
        participantCount,
        announcements
      });
    } catch (err) {
      console.error('Landing view error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // 3. Events Index Page (INK Stock)
  renderEventsIndex: async (req, res) => {
    try {
      const categoryParam = req.query.category ? req.query.category.toUpperCase() : null;
      let whereClause = {};

      if (categoryParam === 'TECHNICAL' || categoryParam === 'NON_TECHNICAL') {
        whereClause.category = categoryParam;
      }

      const [events, announcements] = await Promise.all([
        Event.findAll({ where: whereClause }),
        Announcement.findAll({ where: { is_active: true } })
      ]);

      const formattedEvents = events.map(e => ({
        ...e.toJSON(),
        slug: getSlug(e.name),
        guardian: GUARDIAN_SPEECH[getSlug(e.name)] || { name: 'GUARDIAN', voice: 'Enter the arena.' }
      }));

      res.render('pages/events-index', {
        layout: 'layouts/layout-ink',
        title: 'Competition Arenas (11)',
        sectionName: 'EVENTS INDEX',
        pageId: 'ARENA-11',
        user: req.session.user || null,
        events: formattedEvents,
        activeCategory: categoryParam || 'ALL',
        announcements
      });
    } catch (err) {
      console.error('Events index error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // 4. Event Detail Page (INK Stock)
  renderEventDetail: async (req, res) => {
    try {
      const slug = req.params.slug;
      const events = await Event.findAll();
      const event = events.find(e => getSlug(e.name) === slug);

      if (!event) {
        return res.status(404).render('pages/404', {
          layout: 'layouts/layout-ink',
          title: 'Event Not Found',
          sectionName: 'ERROR',
          pageId: 'ERR-404',
          user: req.session.user || null,
          announcements: []
        });
      }

      const guardian = GUARDIAN_SPEECH[slug] || { name: 'GUARDIAN', voice: event.description };

      let isRegistered = false;
      let paymentVerified = false;

      if (req.session.user) {
        const reg = await Registration.findOne({
          where: { student_id: req.session.user.id, event_id: event.id }
        });
        if (reg) isRegistered = true;

        const pay = await Payment.findOne({
          where: { student_id: req.session.user.id, status: 'VERIFIED' }
        });
        if (pay) paymentVerified = true;
      }

      res.render('pages/event-detail', {
        layout: 'layouts/layout-ink',
        title: event.name,
        sectionName: 'EVENT DOSSIER',
        pageId: `EVT-${event.id}`,
        user: req.session.user || null,
        event: event.toJSON(),
        slug,
        guardian,
        isRegistered,
        paymentVerified,
        announcements: []
      });
    } catch (err) {
      console.error('Event detail error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // 5. Timeline Page (INK Stock)
  renderTimeline: async (req, res) => {
    try {
      const selectedDay = Number(req.query.day) || 18;
      const events = await Event.findAll({ where: { day: selectedDay }, order: [['start_time', 'ASC']] });

      const formattedEvents = events.map(e => ({
        ...e.toJSON(),
        slug: getSlug(e.name)
      }));

      res.render('pages/timeline', {
        layout: 'layouts/layout-ink',
        title: `Timeline Day ${selectedDay}`,
        sectionName: 'SCHEDULE GRID',
        pageId: `TIMELINE-D${selectedDay}`,
        user: req.session.user || null,
        events: formattedEvents,
        selectedDay,
        announcements: []
      });
    } catch (err) {
      console.error('Timeline error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // 6. Alumni Page (INK Stock)
  renderAlumni: (req, res) => {
    res.render('pages/alumni', {
      layout: 'layouts/layout-ink',
      title: 'Alumni Invitation',
      sectionName: 'ALUMNI BAND',
      pageId: 'ALUMNI-01',
      user: req.session.user || null,
      announcements: []
    });
  },

  // 7. Contact Page (INK Stock)
  renderContact: (req, res) => {
    res.render('pages/contact', {
      layout: 'layouts/layout-ink',
      title: 'Contact Us',
      sectionName: 'CONTACT DESK',
      pageId: 'CONTACT-01',
      user: req.session.user || null,
      announcements: []
    });
  },

  // 8. Legacy Archive Index & Detail Pages
  renderLegacyIndex: async (req, res) => {
    try {
      const editions = await LegacyEdition.findAll({
        order: [['edition_number', 'DESC']]
      });

      res.render('pages/legacy-index', {
        layout: 'layouts/layout-ink',
        title: 'Legacy Archives',
        sectionName: 'LEGACY ARCHIVE',
        pageId: 'LEGACY-01',
        user: req.session.user || null,
        editions: editions.map(e => e.toJSON()),
        announcements: []
      });
    } catch (err) {
      console.error('Legacy index error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  renderLegacyGallery: async (req, res) => {
    try {
      const year = Number(req.params.year);
      const edition = await LegacyEdition.findOne({ where: { year } });

      if (!edition) {
        return res.status(404).render('pages/404', {
          layout: 'layouts/layout-ink',
          title: 'Edition Not Found',
          sectionName: 'ERROR',
          pageId: 'ERR-404',
          user: req.session.user || null,
          announcements: []
        });
      }

      const items = await LegacyItem.findAll({
        where: { edition_id: edition.id },
        order: [['sort_order', 'ASC']]
      });

      res.render('pages/legacy-gallery', {
        layout: 'layouts/layout-ink',
        title: `Legacy ${edition.year}`,
        sectionName: 'LEGACY GALLERY',
        pageId: `LEGACY-${edition.year}`,
        user: req.session.user || null,
        edition: edition.toJSON(),
        items: items.map(i => i.toJSON()),
        announcements: []
      });
    } catch (err) {
      console.error('Legacy gallery error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // 9. Auth Login & Register Pages
  renderLogin: (req, res) => {
    res.render('pages/login', {
      layout: 'layouts/layout-ink',
      title: 'Sign In',
      sectionName: 'AUTH',
      pageId: 'AUTH-LOGIN',
      user: null,
      error: req.query.error || null,
      announcements: []
    });
  },

  renderRegister: (req, res) => {
    res.render('pages/register', {
      layout: 'layouts/layout-ink',
      title: 'Register',
      sectionName: 'AUTH',
      pageId: 'AUTH-REG',
      user: null,
      error: req.query.error || null,
      announcements: []
    });
  },

  // 10. Participant Dashboard (PAPER Stock)
  renderDashboard: async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
      const [payment, registrations, announcements] = await Promise.all([
        Payment.findOne({ where: { student_id: req.session.user.id } }),
        Registration.findAll({ where: { student_id: req.session.user.id }, include: [{ model: Event, as: 'event' }] }),
        Announcement.findAll({ where: { is_active: true }, order: [['createdAt', 'DESC']] })
      ]);

      res.render('pages/dashboard', {
        layout: 'layouts/layout-paper',
        title: 'Survivor Dossier',
        sectionName: 'SURVIVOR DOSSIER',
        pageId: `DOSSIER-${req.session.user.id}`,
        user: req.session.user,
        payment: payment ? payment.toJSON() : null,
        paymentStatus: payment ? payment.status : 'NOT_SUBMITTED',
        registrations: registrations.map(r => {
          const json = r.toJSON();
          return {
            ...json,
            Event: json.event || json.Event || null
          };
        }),
        announcements: announcements.map(a => a.toJSON())
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // 11. Profile & Payment Page (PAPER Stock)
  renderProfile: async (req, res) => {
    if (!req.session.user) return res.redirect('/login');

    try {
      const payment = await Payment.findOne({ where: { student_id: req.session.user.id } });

      res.render('pages/profile', {
        layout: 'layouts/layout-paper',
        title: 'Profile & Payment',
        sectionName: 'PAYMENT GATEWAY',
        pageId: 'PAY-01',
        user: req.session.user,
        payment: payment ? payment.toJSON() : null,
        paymentStatus: payment ? payment.status : 'NOT_SUBMITTED',
        error: req.query.error || null,
        message: req.query.msg || null,
        announcements: []
      });
    } catch (err) {
      console.error('Profile error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // 12. Coordinator Desk (PAPER Stock)
  renderCoordinator: async (req, res) => {
    if (!req.session.user || !['coordinator', 'admin'].includes(req.session.user.role)) {
      return res.status(403).send('403 Forbidden: Coordinator Desk Only');
    }

    try {
      const events = await Event.findAll();
      const selectedEventId = Number(req.query.event) || (events[0] ? events[0].id : 1);

      const roster = await Registration.findAll({
        where: { event_id: selectedEventId },
        include: [{ model: User, as: 'student' }]
      });

      res.render('pages/coordinator', {
        layout: 'layouts/layout-paper',
        title: 'Coordinator Desk',
        sectionName: 'COORDINATOR DESK',
        pageId: 'DESK-01',
        user: req.session.user,
        events: events.map(e => e.toJSON()),
        selectedEventId,
        roster: roster.map(r => {
          const json = r.toJSON();
          const studentObj = json.student || json.User || {};
          return {
            ...json,
            student_id: json.student_id || studentObj.id,
            User: studentObj
          };
        }),
        announcements: []
      });
    } catch (err) {
      console.error('Coordinator desk error:', err);
      res.status(500).send('Internal Server Error');
    }
  },

  // 13. Admin Control Surface (PAPER Stock)
  renderAdmin: async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.status(403).send('403 Forbidden: Admin Panel Only');
    }

    try {
      const activeTab = req.query.tab || 'payments';

      const [payments, usersList, announcements, legacyEditions, eventsList] = await Promise.all([
        Payment.findAll({ include: [{ model: User, as: 'student' }], order: [['createdAt', 'DESC']] }),
        User.findAll({ order: [['createdAt', 'DESC']] }),
        Announcement.findAll({ order: [['createdAt', 'DESC']] }),
        LegacyEdition.findAll({ include: [{ model: LegacyItem, as: 'items' }], order: [['edition_number', 'DESC']] }),
        Event.findAll({ order: [['id', 'ASC']] })
      ]);

      res.render('pages/admin', {
        layout: 'layouts/layout-paper',
        title: 'Admin Surface',
        sectionName: 'SYSTEM ADMIN',
        pageId: 'ADMIN-01',
        user: req.session.user,
        activeTab,
        payments: payments.map(p => {
          const json = p.toJSON();
          return {
            ...json,
            User: json.student || json.User || null
          };
        }),
        usersList: usersList.map(u => u.toJSON()),
        announcements: announcements.map(a => a.toJSON()),
        legacyEditions: legacyEditions ? legacyEditions.map(l => l.toJSON()) : [],
        eventsList: eventsList ? eventsList.map(e => e.toJSON()) : []
      });
    } catch (err) {
      console.error('Admin view error:', err);
      res.status(500).send('Internal Server Error');
    }
  }
};
