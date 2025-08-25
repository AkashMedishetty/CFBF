// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const logger = require('../utils/logger');

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bdms');
    logger.info(`MongoDB Connected: ${conn.connection.host}`, 'DB_MIGRATION');
  } catch (error) {
    logger.error('Database connection failed', 'DB_MIGRATION', error);
    process.exit(1);
  }
};

// Fix users with invalid status
const fixUserStatus = async () => {
  try {
    logger.info('Starting user status migration...', 'DB_MIGRATION');
    
    // Find users with 'approved' status and change to 'active'
    const result = await User.updateMany(
      { status: 'approved' },
      { $set: { status: 'active' } }
    );
    
    logger.success(`Updated ${result.modifiedCount} users from 'approved' to 'active' status`, 'DB_MIGRATION');
    
    // Find users with 'rejected' status and change to 'inactive'
    const rejectedResult = await User.updateMany(
      { status: 'rejected' },
      { $set: { status: 'inactive' } }
    );
    
    logger.success(`Updated ${rejectedResult.modifiedCount} users from 'rejected' to 'inactive' status`, 'DB_MIGRATION');
    
    // List all unique status values to check for other invalid ones
    const statusCounts = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    logger.info('Current status distribution:', 'DB_MIGRATION');
    statusCounts.forEach(({ _id, count }) => {
      logger.info(`  ${_id}: ${count} users`, 'DB_MIGRATION');
    });
    
    // Check for any remaining invalid statuses
    const validStatuses = ['pending', 'active', 'inactive', 'suspended', 'banned'];
    const invalidStatuses = statusCounts
      .map(s => s._id)
      .filter(status => !validStatuses.includes(status));
    
    if (invalidStatuses.length > 0) {
      logger.warn(`Found users with invalid statuses: ${invalidStatuses.join(', ')}`, 'DB_MIGRATION');
      logger.warn('Please manually review and fix these statuses', 'DB_MIGRATION');
    } else {
      logger.success('All user statuses are now valid!', 'DB_MIGRATION');
    }
    
  } catch (error) {
    logger.error('Error during user status migration', 'DB_MIGRATION', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await fixUserStatus();
    logger.success('User status migration completed successfully!', 'DB_MIGRATION');
  } catch (error) {
    logger.error('Migration failed', 'DB_MIGRATION', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    logger.info('Database connection closed', 'DB_MIGRATION');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fixUserStatus };