import type { Report, LabValue } from '@/types';

const mockReports: Report[] = [
  { id: '1', title: 'Thyroid Profile', date: '2024-05-05', status: 'attention' },
  { id: '2', title: 'Complete Blood Count', date: '2024-04-12', status: 'good' },
  { id: '3', title: 'Lipid Profile', date: '2024-03-28', status: 'good' },
];

const mockValues: LabValue[] = [
  { name: 'TSH', value: '8.20', range: '0.40 - 4.00', status: 'high' },
  { name: 'T3', value: '1.12', range: '0.80 - 2.00', status: 'normal' },
  { name: 'T4', value: '7.80', range: '5.10 - 14.10', status: 'normal' },
  { name: 'FT3', value: '2.90', range: '2.00 - 4.40', status: 'normal' },
  { name: 'FT4', value: '1.20', range: '0.80 - 1.80', status: 'normal' },
];

export const reportsService = {
  list: async () => mockReports,
  values: async (_id: string) => mockValues,
};
