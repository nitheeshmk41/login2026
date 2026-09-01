const path = require('path');
const bcrypt = require('bcryptjs');

const repoEnvPath = path.resolve(__dirname, '../.env');
const serverEnvPath = path.resolve(__dirname, '.env');
require('dotenv').config({ path: repoEnvPath });
require('dotenv').config({ path: serverEnvPath });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_login_2026';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'super_secret_session_key_login_2026';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const fs = require("fs");
const app = require("./app");
const { connectPostgres, sequelize, neonSequelize } = require("./config/db/postgres");
require("./models/postgres");
const userModel = require("./models/postgres/userModel");
const eventModel = require("./models/postgres/eventModel");
const { startSyncCron, syncLocalToNeon } = require("./services/dbSync");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectPostgres();

    const ensureSchema = async (dbInstance, label) => {
      if (!dbInstance) return;
      await dbInstance.sync({ force: false, alter: false, logging: false });
      console.log(`Schema check complete for ${label}`);
    };

    await ensureSchema(sequelize, 'local database');

    if (neonSequelize) {
      try {
        await ensureSchema(neonSequelize, 'Neon database');
      } catch (neonSyncErr) {
        console.warn('Neon schema sync skipped due to connection issue:', neonSyncErr.message);
      }
    }

    // Apply incremental schema updates safely
    try {
      await sequelize.query("ALTER TYPE \"enum_users_user_type\" ADD VALUE IF NOT EXISTS 'STAFF';");
    } catch (enumErr) {
      console.warn("enum_users_user_type update warning:", enumErr.message);
    }

    try {
      await sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'admin';");
      await sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'coordinator';");
      await sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE IF NOT EXISTS 'participant';");
    } catch (enumErr) {
      console.warn("enum_users_role update warning:", enumErr.message);
    }

    try {
      await sequelize.query("UPDATE users SET role = 'participant' WHERE role = 'student' OR role = 'alumni';");
      await sequelize.query("UPDATE users SET role = 'coordinator' WHERE role IN ('event_coordinator', 'special_user', 'junior_attendance');");
      await sequelize.query("UPDATE users SET role = 'admin' WHERE role IN ('admin', 'super_admin', 'admin_power');");
    } catch (roleUpdateErr) {
      console.warn('Legacy role normalization warning:', roleUpdateErr.message);
    }

    const queryInterface = sequelize.getQueryInterface();
    const { DataTypes } = sequelize.Sequelize;

    // Helper to safely add column if not exists across dialects
    const safeAddColumn = async (tableName, columnName, attributes) => {
      try {
        const tableDesc = await queryInterface.describeTable(tableName).catch(() => null);
        if (tableDesc && !Object.prototype.hasOwnProperty.call(tableDesc, columnName)) {
          await queryInterface.addColumn(tableName, columnName, attributes);
        }
      } catch (e) {
        console.warn(`Column migration warning for ${tableName}.${columnName}:`, e.message);
      }
    };

    await safeAddColumn('events', 'is_online', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
    await safeAddColumn('events', 'coordinator_name', { type: DataTypes.STRING(255) });
    await safeAddColumn('events', 'coordinator_phone', { type: DataTypes.STRING(255) });
    await safeAddColumn('users', 'accommodation_required', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });

    const seedEventCatalog = async () => {
      const seedCandidates = [
        path.resolve(__dirname, 'data/events.json'),
        path.resolve(__dirname, '../client/src/data/events.json'),
        path.resolve(__dirname, '../data/events.json'),
      ];

      const eventFile = seedCandidates.find((candidate) => fs.existsSync(candidate));
      if (!eventFile) {
        console.warn('No event catalog JSON file found for DB seeding.');
        return;
      }

      const raw = fs.readFileSync(eventFile, 'utf8');
      const eventList = JSON.parse(raw);
      if (!Array.isArray(eventList) || eventList.length === 0) {
        return;
      }

      for (const event of eventList) {
        const eventPayload = {
          id: event.id,
          name: event.name,
          description: event.description || '',
          coordinator_name: event.coordinator_name || null,
          coordinator_phone: event.coordinator_phone || null,
          date: event.date || '2026-09-18',
          start_time: event.start_time || '09:00:00',
          end_time: event.end_time || '11:00:00',
          venue: event.venue || 'TBA',
          is_online: Boolean(event.is_online),
          max_participants: event.max_participants || 0,
          category: (event.category || 'TECHNICAL').toUpperCase() === 'FLAGSHIP' ? 'FLAGSHIP' : ((event.category || 'TECHNICAL').toUpperCase() === 'NON_TECHNICAL' ? 'NON_TECHNICAL' : 'TECHNICAL'),
          team_type: (event.team_type || 'INDIVIDUAL').toUpperCase() === 'TEAM' ? 'TEAM' : 'INDIVIDUAL',
          min_team_size: event.min_team_size || 1,
          max_team_size: event.max_team_size || 1,
          day: event.day || 18,
          registration_deadline: event.registration_deadline || null,
          is_flagship: Boolean(event.is_flagship || event.category === 'FLAGSHIP'),
          guardian_asset: event.guardian_asset || null,
          entry_fee: event.entry_fee || 0,
          rules_url: event.rules_url || null,
          is_results_locked: Boolean(event.is_results_locked),
          status: event.status || 'open',
        };

        const existingEvent = await eventModel.findOne({ where: { name: eventPayload.name } });
        if (existingEvent) {
          await existingEvent.update(eventPayload);
        } else {
          await eventModel.create(eventPayload);
        }
      }

      console.log(`Seeded ${eventList.length} events into the database.`);
    };

    await seedEventCatalog();
    await safeAddColumn('payments', 'payment_date', { type: DataTypes.STRING(255) });
    await safeAddColumn('payments', 'payment_method', { type: DataTypes.STRING(255), defaultValue: 'UPI' });
    await safeAddColumn('users', 'login_id', { type: DataTypes.STRING(20), unique: true });
    
    try {
      const teamsDesc = await queryInterface.describeTable('teams').catch(() => null);
      if (teamsDesc && !Object.prototype.hasOwnProperty.call(teamsDesc, 'event_id')) {
        await queryInterface.addColumn('teams', 'event_id', {
          type: DataTypes.INTEGER,
          references: { model: 'events', key: 'id' },
          onDelete: 'CASCADE'
        });
      }
    } catch(e) {}

    await safeAddColumn('teams', 'status', { type: DataTypes.STRING(20), defaultValue: 'forming' });
    await safeAddColumn('team_members', 'role', { type: DataTypes.STRING(20), defaultValue: 'member' });
    await safeAddColumn('teams', 'member_emails', { type: DataTypes.TEXT, allowNull: true, defaultValue: '[]' });

    console.log("Database schema synchronized");

    // --- SEED ACCOUNTS ---
    try {
      const { Op } = require('sequelize');
   const seeds = [  { email: 'login@psgtech.ac.in', name: "login'26", login_id: 'login26admin', pass: 'Admin@login26', role: 'super_admin' },
   { email: '25mx103@psgtech.ac.in', name: 'Barathvikraman S K', login_id: '25mx103', pass: 'Barath2606#', role: 'super_admin' },
        { email: '25mx336@psgtech.ac.in', name: 'nitheeshmuthukrishnan', login_id: '25mx336', pass: 'Admin@login26', role: 'super_admin' }
      ];

      // Remove old static seeds if they exist
      await userModel.destroy({ where: { login_id: { [Op.in]: ['ADMIN', 'COORD'] } } }).catch(() => {});

      for (const s of seeds) {
        const hashedPw = await bcrypt.hash(s.pass, 10);
        const user = await userModel.findOne({ where: { email: s.email } });
        if (!user) {
          await userModel.create({
            name: s.name,
            email: s.email,
            password: hashedPw,
            role: s.role,
            user_type: 'STAFF',
            login_id: s.login_id,
            accommodation_required: false,
          });
          console.log(`Seeded account: ${s.login_id}`);
        } else {
          await user.update({ login_id: s.login_id, password: hashedPw, role: s.role, name: s.name });
          console.log(`Updated seed account: ${s.login_id}`);
        }
      }
    } catch (seedErr) {
      console.warn('Account seeding failed:', seedErr.message);
    }
    // ----------------------
    
    // Start Dual DB Synchronization (Local -> Neon) every 5 minutes (300000 ms)
    if (neonSequelize) {
      try {
        syncLocalToNeon().catch(console.error);
        startSyncCron(300000);
      } catch (syncErr) {
        console.warn('Neon sync startup skipped due to connection issue:', syncErr.message);
      }
    }

    app.listen(PORT, () => {
      console.log(`LOGIN 2026 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
