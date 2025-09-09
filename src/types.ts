export type ComplianceStatus = 'pass' | 'fail' | 'warn';

export type AnalysisType = 'text' | 'video' | 'image';

export type ReportStatus = 'pending' | 'approved' | 'revision';

export interface CheckItem {
  name: string;
  status: ComplianceStatus;
  details: string;
  modality?: 'audio' | 'visual' | 'text';
}

export interface CustomRule {
    id: string;
    text: string;
}

export interface ComplianceReport {
  id: string;
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
