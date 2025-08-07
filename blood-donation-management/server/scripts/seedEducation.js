#!/usr/bin/env node

/**
 * Educational Content Seeding Script
 * Run this script to populate the database with sample educational content
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { seedEducationalContent } = require('../utils/seedEducationalContent');
const logger = require('../utils/logger');

async function runSeeding() {
  try {
    logger.info('Starting educational content seeding process...', 'SEED');
    
    // Connect to MongoDB with fallback options
    const mongoURIs = [
      process.env.MONGODB_URI,
      process.env.MONGODB_ATLAS_URI,
      'mongodb://localhost:27017/bdms'
    ].filter(Boolean);
    
    let connected = false;
    let lastError = null;
    
    for (const mongoURI of mongoURIs) {
      try {
        logger.info(`Attempting to connect to MongoDB: ${mongoURI.replace(/\/\/.*@/, '//***:***@')}`, 'SEED');
        
        await mongoose.connect(mongoURI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000, // 5 second timeout
        });
        
        connected = true;
        logger.success('Connected to MongoDB successfully', 'SEED');
        break;
      } catch (error) {
        lastError = error;
        logger.warn(`Failed to connect to ${mongoURI.replace(/\/\/.*@/, '//***:***@')}: ${error.message}`, 'SEED');
      }
    }
    
    if (!connected) {
      throw new Error(`Could not connect to any MongoDB instance. Last error: ${lastError?.message}`);
    }
    
    logger.success('Connected to MongoDB successfully', 'SEED');
    
    // Run the seeding
    const result = await seedEducationalContent();
    
    logger.success(`Seeding completed successfully!`, 'SEED');
    logger.info(`Educational content items: ${result.contentCount}`, 'SEED');
    logger.info(`FAQ items: ${result.faqCount}`, 'SEED');
    
    // Close connection
    await mongoose.connection.close();
    logger.info('Database connection closed', 'SEED');
    
    process.exit(0);
    
  } catch (error) {
    logger.error('Seeding failed', 'SEED', error);
    
    // Close connection if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSeeding();
}

module.exports = { runSeeding };