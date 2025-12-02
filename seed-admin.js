/**
 * seed-admin.js
 *
 * Usage: NODE_ENV=development node seed-admin.js mongodb://localhost:27017/pyroalert admin@example.com strongPassword "Full Name" "id_number" "phone"
 *
 * This script connects to MongoDB, creates an admin user if it doesn't exist.
 */

const mongoose = require('mongoose');
const path = require('path');

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 3) {
    console.error('Usage: node seed-admin.js <mongo_uri> <email> <password> [name] [id_number] [phone]');
    process.exit(1);
  }
  const [mongoUri, email, password, name, id_number, phone] = argv;
  // load User model from project code
  const User = require(path.join(__dirname, 'src', 'models', 'User'));

  await mongoose.connect(mongoUri, { autoIndex: true });
  console.log('Connected to', mongoUri);

  const existing = await User.findOne({ email: email.toLowerCase().trim() }).exec();
  if (existing) {
    console.log('User already exists:', email);
    await mongoose.disconnect();
    process.exit(0);
  }

  try {
    const created = await User.createWithPassword({ email, password, name, id_number, phone, role: 'admin' });
    console.log('Admin user created:', email);
    console.log('Stored fields:', { email: created.email, name: created.name, id_type: created.id_type, id_number: created.id_number, phone: created.phone });
  } catch (err) {
    console.error('Error creating user:', err.message || err);
    process.exit(2);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
