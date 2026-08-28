import AsyncStorage from '@react-native-async-storage/async-storage';

export type VitalType = 'Blood pressure' | 'Blood glucose' | 'SpO2' | 'Weight' | 'Heart rate' | 'HbA1c';

export interface VitalEntry {
  id: string;
  type: VitalType;
  value: string;
  timestamp: string;
}

const STORAGE_KEY = '@healthai_vitals';

const initialMockData: VitalEntry[] = [
  { id: '1', type: 'Blood pressure', value: '124/82', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '2', type: 'Blood glucose', value: '98', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '3', type: 'SpO2', value: '98', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: '4', type: 'Weight', value: '78', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  // HbA1c history for trend chart
  { id: '5', type: 'HbA1c', value: '7.2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString() },
  { id: '6', type: 'HbA1c', value: '7.0', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 150).toISOString() },
  { id: '7', type: 'HbA1c', value: '6.8', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString() },
  { id: '8', type: 'HbA1c', value: '6.5', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString() },
  { id: '9', type: 'HbA1c', value: '6.2', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString() },
  { id: '10', type: 'HbA1c', value: '5.9', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
];

export async function getVitals(): Promise<VitalEntry[]> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    // Set initial mock data if empty
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialMockData));
    return initialMockData;
  } catch (e) {
    console.error("Error reading vitals", e);
    return [];
  }
}

export async function logVital(type: VitalType, value: string, timestamp: string): Promise<VitalEntry> {
  try {
    const vitals = await getVitals();
    const newVital: VitalEntry = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      value,
      timestamp,
    };
    vitals.push(newVital);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(vitals));
    return newVital;
  } catch (e) {
    console.error("Error saving vital", e);
    throw e;
  }
}
