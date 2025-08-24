/**
 * Global Test Setup
 * Runs once before all tests
 */

module.exports = async () => {
  console.log('Starting BDMS Test Suite...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.REACT_APP_ENVIRONMENT = 'test';
  process.env.REACT_APP_API_URL = 'http://localhost:3001/api/v1';
  process.env.REACT_APP_LOG_LEVEL = 'ERROR';
  
  // Mock Date.now for consistent timestamps in tests
  const mockDate = new Date('2024-02-10T10:00:00Z');
  global.mockCurrentTime = mockDate.getTime();
  
  // Setup performance monitoring
  if (global.performance && global.performance.mark) {
    global.performance.mark('test-suite-start');
  }
  
  console.log('Global test setup completed');
};