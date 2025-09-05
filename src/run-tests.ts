// This script provides a fast, automated way to test the core AI logic.
// It bypasses the UI and directly calls the analysis functions, providing a
// pass/fail summary in the console.
//
// To run, execute: npm run test-ai

import { analyzePostContent } from './services/geminiService';
import { testCases } from './testCases';

const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

async function runTests() {
  console.log(`${BOLD}Running BrandGuard AI Logic Test Suite...${RESET}\n`);

  const textTestCases = testCases.filter(tc => tc.type === 'text');
  let passedCount = 0;
  let failedCount = 0;

  for (const testCase of textTestCases) {
    console.log(`${YELLOW}Running Test: ${testCase.title}${RESET}`);
    try {
      const report = await analyzePostContent(testCase.content.text!);

      const scorePass = testCase.expected.score(report.overallScore);
      const summaryPass = testCase.expected.summary(report.summary);
      const checksPass = testCase.expected.checks(report.checks);
      const allPass = scorePass && summaryPass && checksPass;

      if (allPass) {
        console.log(`${GREEN}  ✓ PASSED${RESET}\n`);
        passedCount++;
      } else {
        console.log(`${RED}  ✗ FAILED${RESET}`);
        if (!scorePass) console.log(`    - Score Check Failed: Got ${report.overallScore}, Expected ${testCase.expected.scoreText}`);
        if (!summaryPass) console.log(`    - Summary Check Failed: Got "${report.summary}"`);
        if (!checksPass) console.log(`    - Checks Validation Failed.`);
        console.log('\n');
        failedCount++;
      }

    } catch (error) {
      console.log(`${RED}  ✗ FAILED WITH ERROR${RESET}`);
      console.log(`    - Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      failedCount++;
    }
  }

  console.log(`${BOLD}Test Suite Summary:${RESET}`);
  console.log(`${GREEN}  ${passedCount} Passed${RESET}`);
  console.log(`${RED}  ${failedCount} Failed${RESET}`);
  console.log('\n');

  if (failedCount > 0) {
    // Exit with a non-zero code to indicate failure, useful for CI/CD pipelines
    process.exit(1);
  }
}

runTests();
