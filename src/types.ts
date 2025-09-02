export type ComplianceStatus = 'pass' | 'fail' | 'warn';

export type AnalysisType = 'text' | 'video' | 'image';

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
  }
}