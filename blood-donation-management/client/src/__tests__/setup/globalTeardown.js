/**
 * Global Test Teardown
 * Runs once after all tests
 */

module.exports = async () => {
  console.log('🏁 Finishing BDMS Test Suite...');
  
  // Performance reporting
  if (global.performance && global.performance.mark && global.performance.measure) {
    try {
      global.performance.mark('test-suite-end');
      global.performance.measure('test-suite-duration', 'test-suite-start', 'test-suite-end');
      
      const measures = global.performance.getEntriesByType('measure');
      const duration = measures.find(m => m.name === 'test-suite-duration');
      
      if (duration) {
        console.log(`⏱️  Total test suite duration: ${Math.round(duration.duration)}ms`);
      }
    } catch (error) {
      // Performance API might not be available in all environments
      console.log('⚠️  Performance measurement not available');
    }
  }
  
  // Clean up global mocks
  if (global.mockCurrentTime) {
    delete global.mockCurrentTime;
  }
  
  // Memory usage report (if available)
  if (global.performance && global.performance.memory) {
    const memory = global.performance.memory;
    console.log(`💾 Memory usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB used`);
  }
  
  console.log('✅ Global test teardown completed');
};