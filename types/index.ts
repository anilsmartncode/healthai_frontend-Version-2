export type ReportStatus = 'good' | 'attention' | 'low' | 'high' | 'normal' | 'abnormal';

export interface Report {
  id: string;
  title: string;
  date: string;
  status: ReportStatus;

  // Health score fields (populated from API summary)
  score?: number;
  label?: string;
  normalCount?: number;
  attentionCount?: number;
  lastUpdated?: string;
}

export interface LabValue {
  name: string;
  value: string;
  range: string;
  status: ReportStatus;
}

export interface Medicine {
  id: string;
  name: string;
  dose: string;
  time: string;
  taken?: boolean;
}

export interface FamilyMember {
  id: string;
  name: string;
  score: number;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  attachment?: {
    name: string;
    mimeType: string;
    uri?: string;
    size?: number;
  };
  reportId?: string;
  healthScore?: number;
  abnormalCount?: number;
}
