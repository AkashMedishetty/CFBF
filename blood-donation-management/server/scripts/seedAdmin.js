const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');

async function seedAdmin({ phone, email, password, name = 'System Admin' }) {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/bdms';
    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for admin seeding', 'SEED_ADMIN');

    let admin = await User.findOne({ role: 'admin', phoneNumber: phone });
    if (admin) {
      logger.info('Admin already exists, updating credentials', 'SEED_ADMIN');
      admin.email = email;
      admin.password = await bcrypt.hash(password, 10);
      await admin.save();
    } else {
      admin = new User({
        name,
        phoneNumber: phone,
        email,
        password: await bcrypt.hash(password, 10),
        dateOfBirth: new Date('1990-01-01'),
        gender: 'other',
        bloodType: 'O+',
        weight: 70,
        address: {
          street: 'Admin Address',
          city: 'Admin City',
          state: 'Admin State',
          pincode: '000000',
          country: 'India'
        },
        location: { type: 'Point', coordinates: [77.2090, 28.6139] },
        role: 'admin',
        status: 'active',
        verification: {
          phoneVerified: true,
          emailVerified: true,
          documentsVerified: true,
          medicallyCleared: true
        }
      });
      await admin.save();
      logger.success('Admin user created', 'SEED_ADMIN');
    }

    console.log('Admin seeded:', { phone: admin.phoneNumber, email: admin.email });
  } catch (error) {
    logger.error('Failed to seed admin', 'SEED_ADMIN', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  const phone = process.env.SEED_ADMIN_PHONE || '9988776655';
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@callforbloodfoundation.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin#123';
  seedAdmin({ phone, email, password })
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { seedAdmin };

