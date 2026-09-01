require('dotenv').config({ path: '../.env' });
const { sequelize } = require('./config/db/postgres');
sequelize.query('ALTER TABLE payments ALTER COLUMN receipt_url TYPE TEXT;').then(() => {
  console.log('Success');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
