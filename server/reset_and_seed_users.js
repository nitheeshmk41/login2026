require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/db/postgres');
const { User, Event, EventCoordinator } = require('./models/postgres');

const seedUsers = [
  {
    name: 'Symposium Administrator',
    email: process.env.ADMIN_EMAIL || 'login@psgtech.ac.in',
    phone: '8148251567',
    password: process.env.ADMIN_PASSWORD || 'C@@Adminlogin',
    college_name: 'PSG College of Technology',
    department: 'Computer Applications',
    role: 'admin',
    user_type: 'STAFF',
    login_id: 'login26admin',
    student_id_code: 'LGN26-0001',
    must_change_password: false,
  },
  {
    name: 'Barathvikraman',
    email: '25mx103@psgtech.ac.in',
    phone: '8148251567',
    password: 'admin123',
    college_name: 'PSG College of Technology',
    department: 'Computer Applications',
    role: 'admin_power',
    user_type: 'STAFF',
    login_id: '25mx103',
    student_id_code: 'LGN26-0002',
    must_change_password: true,
  },
  {
    name: 'Swarna Rathna',
    email: '25mx127@psgtech.ac.in',
    phone: '9952873426',
    password: 'admin123',
    college_name: 'PSG College of Technology',
    department: 'Computer Applications',
    role: 'admin_power',
    user_type: 'STAFF',
    login_id: '25mx127',
    student_id_code: 'LGN26-0003',
    must_change_password: true,
  },
  {
    name: 'Stephina Smily',
    email: '25mx125@psgtech.ac.in',
    phone: '8300526351',
    password: 'admin123',
    college_name: 'PSG College of Technology',
    department: 'Computer Applications',
    role: 'admin_power',
    user_type: 'STAFF',
    login_id: '25mx125',
    student_id_code: 'LGN26-0004',
    must_change_password: true,
  },
];

async function clearNonAlumniTables() {
  const [tables] = await sequelize.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name NOT IN ('alumni', 'spatial_ref_sys')
    ORDER BY table_name;
  `);

  const tableNames = tables.map((row) => row.table_name).filter(Boolean);
  if (tableNames.length === 0) {
    console.log('No non-alumni tables to clear.');
    return;
  }

  console.log('Clearing tables:', tableNames.join(', '));
  await sequelize.query(`TRUNCATE TABLE ${tableNames.map((name) => `"${name}"`).join(', ')} RESTART IDENTITY CASCADE;`);
  console.log('Non-alumni tables cleared successfully.');
}

async function seedUsersList() {
  for (const userData of seedUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const email = String(userData.email).toLowerCase();
    const loginId = userData.login_id ? String(userData.login_id).trim() : null;

    const [user] = await User.findOrCreate({
      where: { email },
      defaults: {
        name: userData.name,
        email,
        phone: userData.phone,
        password: hashedPassword,
        college_name: userData.college_name,
        department: userData.department,
        role: userData.role,
        user_type: userData.user_type,
        login_id: loginId,
        student_id_code: userData.student_id_code,
        must_change_password: userData.must_change_password,
      },
    });

    await user.update({
      name: userData.name,
      phone: userData.phone,
      password: hashedPassword,
      college_name: userData.college_name,
      department: userData.department,
      role: userData.role,
      user_type: userData.user_type,
      login_id: loginId,
      student_id_code: userData.student_id_code,
      must_change_password: userData.must_change_password,
    });

    console.log(`Seeded/updated user: ${userData.email}`);
  }
}

async function main() {
  try {
    await sequelize.authenticate();
    await sequelize.query("ALTER TYPE \"enum_users_user_type\" ADD VALUE IF NOT EXISTS 'STAFF';");
    await clearNonAlumniTables();
    await seedUsersList();
    const firstEvent = await Event.findOne({ order: [['id', 'ASC']] });
    if (firstEvent) {
      const admin = await User.findOne({ where: { email: 'login@psgtech.ac.in' } });
      if (admin) {
        const assignmentExists = await EventCoordinator.findOne({ where: { user_id: admin.id, event_id: firstEvent.id } });
        if (!assignmentExists) {
          await EventCoordinator.create({ user_id: admin.id, event_id: firstEvent.id });
          console.log(`Assigned admin to event: ${firstEvent.name}`);
        }
      }
    }
    console.log('Reset and re-seed complete.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to reset and seed users:', error);
    process.exit(1);
  }
}

main();
