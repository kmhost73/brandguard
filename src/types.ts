export type ComplianceStatus = 'pass' | 'fail' | 'warn';

export type AnalysisType = 'text' | 'video' | 'image';

export type ReportStatus = 'pending' | 'approved' | 'revision';

export type MainView = 'dashboard' | 'settings' | 'certificates' | 'sandbox';

export type DashboardView = 'text' | 'video' | 'image';

export interface CheckItem {
  name: string;
  status: ComplianceStatus;
  details: string;
  modality?: 'audio' | 'visual' | 'text';
}

export interface CustomRule {
  id: string;
  intent: string; // User's original natural language request
  description: string; // AI-generated detailed description for the model
  positiveExample: string; // AI-generated example of conforming content
  negativeExample: string; // AI-generated example of violating content
}

export interface Workspace {
  id: string;
  name: string;
}

export interface ComplianceReport {
  id: string;
  workspaceId: string; // Link report to a workspace
  campaignName?: string; // Optional campaign tag
  timestamp: string;
  overallScore: number;
  summary: string;
  checks: CheckItem[];
  sourceContent: string;
  analysisType: AnalysisType;
  customRulesApplied?: CustomRule[];
  sourceMedia?: {
    data: string; // base64 encoded data
    mimeType: string;
  };
  status?: ReportStatus;
  userName?: string;
  recommendedStatus?: ReportStatus;
  suggestedRevision?: string; // Holds AI-generated revision from initial analysis.
  strategicInsight?: string; // AI-generated advice on the "why" behind the result.
}

export interface Certificate {
  id: string;
  report: ComplianceReport;
  createdAt: string;
}

// Type definition for a single test case in the QA Sandbox
export interface TestCase {
  id: string;
  title: string;
  description: string;
  type: AnalysisType;
  content: {
    text?: string;
  };
  expected: {
    score: (actual: number) => boolean;
    scoreText: string;
    summary: (actual: string) => boolean;
    checks: (actual: CheckItem[]) => boolean;
  };
}

// A profile for the AI Red Team Agent to adopt
export interface TestProfile {
  id: string;
  name: string;
  description: string;
  prompt: string; // The instruction for the AI persona
}

// The result of a dynamically generated test scenario
export interface DynamicTestResult {
  generatedContent: string;
  expectedSummary: string;
  expectedScoreText: string;
  expectedToPass: boolean;
  actualReport: ComplianceReport;
}

// New types for managing test state in the QA Sandbox
export type TestResultStatus = 'pending' | 'running' | 'pass' | 'fail';

export interface StaticTestRunResult {
  testCaseId: string;
  status: TestResultStatus;
  report?: ComplianceReport | null;
  error?: string;
  isMismatch?: boolean;
}