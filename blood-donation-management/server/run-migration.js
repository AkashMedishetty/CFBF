#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

// Run the migration
require('./scripts/fix-user-status.js');