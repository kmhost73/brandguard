export type ComplianceStatus = 'pass' | 'fail' | 'warn';

export interface CheckItem {
  name: string;
  status: ComplianceStatus;
  details: string;
  modality?: 'audio' | 'visual';
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
  analysisType: 'text' | 'video';
  customRulesApplied?: CustomRule[];
}
