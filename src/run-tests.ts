// To run this file: npm test
// Ensure you have a .env file at the root with your VITE_GEMINI_API_KEY

import 'dotenv/config';
import { testCases } from './testCases';
import { analyzePostContent } from './services/geminiService';
import type { ComplianceReport } from './types';

// ANSI colors for console output
const red = '\x1b[31m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const reset = '\x1b[0m';
const cyan = '\x1b[36m';

async function runTests() {
  console.log(`\n${cyan}🚀 Starting BrandGuard Engine Test Suite...${reset}\n`);

  if (!process.env.VITE_GEMINI_API_KEY) {
      console.error(`${red}✖ ERROR: VITE_GEMINI_API_KEY is not set. Please create a .env file and add it.${reset}\n`);
      // FIX: Cast `process` to `any` to access the `exit` method, which may not be
      // available in the default TypeScript environment for this project.
      (process as any).exit(1);
  }
  
  const textTests = testCases.filter(tc => tc.type === 'text');
  let passed = 0;
  let failed = 0;

  for (const [index, testCase] of textTests.entries()) {
    console.log(`${yellow}Running Test ${index + 1}/${textTests.length}:${reset} ${testCase.title}`);
    try {
      // Use a quick rescan-like analysis for speed and to avoid extra features like insight generation
      const report: Omit<ComplianceReport, 'workspaceId'> = await analyzePostContent(testCase.content.text!, 'QA Test Campaign', [], true, () => {});

      const scorePass = testCase.expected.score(report.overallScore);
      const summaryPass = testCase.expected.summary(report.summary);
      const checksPass = testCase.expected.checks(report.checks);
      const allPass = scorePass && summaryPass && checksPass;

      if (allPass) {
        console.log(`${green}✔ PASSED${reset}\n`);
        passed++;
      } else {
        console.log(`${red}✖ FAILED${reset}`);
        if (!scorePass) console.log(`  - ${red}Score mismatch:${reset} Got ${report.overallScore}, Expected ${testCase.expected.scoreText}`);
        if (!summaryPass) console.log(`  - ${red}Summary mismatch:${reset} Got "${report.summary}"`);
        if (!checksPass) console.log(`  - ${red}Checks mismatch:${reset} One or more check statuses were incorrect.`);
        console.log('\n');
        failed++;
      }

    } catch (error) {
      console.log(`${red}✖ FAILED WITH ERROR${reset}`);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      console.error(`  - ${errorMessage}\n`);
      failed++;
    }
  }

  console.log('------------------------------------');
  console.log(`${cyan}---------- Test Summary ----------${reset}`);
  console.log(`  ${green}Passed: ${passed}${reset}`);
  console.log(`  ${red}Failed: ${failed}${reset}`);
  console.log(`  Total:  ${passed + failed}`);
  console.log(`${cyan}------------------------------------${reset}\n`);
  
  if (failed > 0) {
    // FIX: Cast `process` to `any` to access the `exit` method, which may not be
    // available in the default TypeScript environment for this project.
    (process as any).exit(1); // Exit with a non-zero code to indicate failure for CI/CD pipelines
  }
}

runTests();