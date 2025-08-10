/**
 * Test Results Processor
 * Processes and enhances test results
 */

const fs = require('fs');
const path = require('path');

module.exports = (results) => {
  // Create test results directory if it doesn't exist
  const resultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Process test results
  const processedResults = {
    ...results,
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: results.numTotalTests,
      passedTests: results.numPassedTests,
      failedTests: results.numFailedTests,
      pendingTests: results.numPendingTests,
      totalTestSuites: results.numTotalTestSuites,
      passedTestSuites: results.numPassedTestSuites,
      failedTestSuites: results.numFailedTestSuites,
      testRunTime: results.testResults.reduce((total, suite) => total + suite.perfStats.end - suite.perfStats.start, 0)
    },
    coverage: results.coverageMap ? {
      statements: results.coverageMap.getCoverageSummary().statements.pct,
      branches: results.coverageMap.getCoverageSummary().branches.pct,
      functions: results.coverageMap.getCoverageSummary().functions.pct,
      lines: results.coverageMap.getCoverageSummary().lines.pct
    } : null,
    performance: {
      slowestTests: results.testResults
        .flatMap(suite => suite.testResults.map(test => ({
          name: test.fullName,
          duration: test.duration,
          suite: suite.testFilePath
        })))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10),
      slowestSuites: results.testResults
        .map(suite => ({
          name: suite.testFilePath,
          duration: suite.perfStats.end - suite.perfStats.start
        }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
    },
    failureAnalysis: results.testResults
      .filter(suite => suite.numFailingTests > 0)
      .map(suite => ({
        suite: suite.testFilePath,
        failures: suite.testResults
          .filter(test => test.status === 'failed')
          .map(test => ({
            name: test.title,
            error: test.failureMessages[0],
            duration: test.duration
          }))
      }))
  };
  
  // Write detailed results to JSON file
  const resultsFile = path.join(resultsDir, 'test-results.json');
  fs.writeFileSync(resultsFile, JSON.stringify(processedResults, null, 2));
  
  // Write summary to text file
  const summaryFile = path.join(resultsDir, 'test-summary.txt');
  const summaryText = `
BDMS Test Suite Results
=======================
Timestamp: ${processedResults.timestamp}

Test Summary:
- Total Tests: ${processedResults.summary.totalTests}
- Passed: ${processedResults.summary.passedTests}
- Failed: ${processedResults.summary.failedTests}
- Pending: ${processedResults.summary.pendingTests}
- Total Runtime: ${Math.round(processedResults.summary.testRunTime)}ms

Test Suites:
- Total: ${processedResults.summary.totalTestSuites}
- Passed: ${processedResults.summary.passedTestSuites}
- Failed: ${processedResults.summary.failedTestSuites}

${processedResults.coverage ? `
Coverage:
- Statements: ${processedResults.coverage.statements}%
- Branches: ${processedResults.coverage.branches}%
- Functions: ${processedResults.coverage.functions}%
- Lines: ${processedResults.coverage.lines}%
` : ''}

Slowest Tests:
${processedResults.performance.slowestTests.slice(0, 5).map((test, i) => 
  `${i + 1}. ${test.name} (${test.duration}ms)`
).join('\n')}

${processedResults.failureAnalysis.length > 0 ? `
Failed Tests:
${processedResults.failureAnalysis.map(suite => 
  `${suite.suite}:\n${suite.failures.map(f => `  - ${f.name}`).join('\n')}`
).join('\n\n')}
` : 'All tests passed! 🎉'}
`;
  
  fs.writeFileSync(summaryFile, summaryText);
  
  // Console output
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${processedResults.summary.passedTests}`);
  console.log(`❌ Failed: ${processedResults.summary.failedTests}`);
  console.log(`⏸️  Pending: ${processedResults.summary.pendingTests}`);
  console.log(`⏱️  Runtime: ${Math.round(processedResults.summary.testRunTime)}ms`);
  
  if (processedResults.coverage) {
    console.log('\n📈 Coverage Summary:');
    console.log(`Statements: ${processedResults.coverage.statements}%`);
    console.log(`Branches: ${processedResults.coverage.branches}%`);
    console.log(`Functions: ${processedResults.coverage.functions}%`);
    console.log(`Lines: ${processedResults.coverage.lines}%`);
  }
  
  if (processedResults.performance.slowestTests.length > 0) {
    console.log('\n🐌 Slowest Tests:');
    processedResults.performance.slowestTests.slice(0, 3).forEach((test, i) => {
      console.log(`${i + 1}. ${test.name} (${test.duration}ms)`);
    });
  }
  
  if (processedResults.failureAnalysis.length > 0) {
    console.log('\n❌ Failed Test Suites:');
    processedResults.failureAnalysis.forEach(suite => {
      console.log(`- ${suite.suite} (${suite.failures.length} failures)`);
    });
  }
  
  console.log(`\n📁 Detailed results saved to: ${resultsFile}`);
  
  return results;
};