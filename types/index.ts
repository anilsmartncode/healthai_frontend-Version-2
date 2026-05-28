export type ReportStatus = 'good' | 'attention' | 'low' | 'high' | 'normal';

export interface Report {
  id: string;
  title: string;
  date: string;
  status: ReportStatus;
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
}
