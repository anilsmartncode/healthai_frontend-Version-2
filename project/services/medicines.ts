import type { Medicine } from '@/types';

const meds: Medicine[] = [
  { id: '1', name: 'Atorvastatin 10mg', dose: 'Before food', time: '08:00' },
  { id: '2', name: 'Amlukalyam D3', dose: 'After dinner', time: '21:00' },
];

export const medicinesService = {
  list: async () => meds,
};
