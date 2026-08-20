import { api } from './api';

export interface Doctor {
  id: string;
  name: string;
  specialisation: string;
  phoneNumber: string;
  email?: string;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

let MOCK_DOCTORS: Doctor[] = [
  {
    id: "doc_12345",
    name: "Dr. Sarah Jenkins",
    specialisation: "Pediatrician",
    phoneNumber: "+1234567890",
    email: "sarah.j@clinic.com"
  },
  {
    id: "doc_67890",
    name: "Dr. Michael Chen",
    specialisation: "Cardiologist",
    phoneNumber: "+1987654321",
  }
];

export async function getDoctors(): Promise<Doctor[]> {
  // 🟢 MOCK
  await delay(500);
  return [...MOCK_DOCTORS];

  // 🔴 REAL
  // const raw = await api.request<any>('/api/doctors');
  // return raw.data.map((d: any) => ({
  //   id: String(d.id),
  //   name: d.name,
  //   specialisation: d.specialisation,
  //   phoneNumber: d.phone_number,
  //   email: d.email,
  // }));
}

export async function addDoctor(payload: Omit<Doctor, 'id'>): Promise<{ success: boolean; data: Doctor }> {
  // 🟢 MOCK
  await delay(500);
  const newDoc: Doctor = {
    id: `doc_${Date.now()}`,
    ...payload,
  };
  MOCK_DOCTORS = [...MOCK_DOCTORS, newDoc];
  return { success: true, data: newDoc };

  // 🔴 REAL
  // const raw = await api.request<any>('/api/doctors', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     name: payload.name,
  //     specialisation: payload.specialisation,
  //     phone_number: payload.phoneNumber,
  //     email: payload.email,
  //   }),
  // });
  // return { success: raw.success, data: raw.data };
}

export async function updateDoctor(id: string, payload: Partial<Doctor>): Promise<{ success: boolean }> {
  // 🟢 MOCK
  await delay(500);
  MOCK_DOCTORS = MOCK_DOCTORS.map(d => d.id === id ? { ...d, ...payload } : d);
  return { success: true };

  // 🔴 REAL
  // const body: any = {};
  // if (payload.name) body.name = payload.name;
  // if (payload.specialisation) body.specialisation = payload.specialisation;
  // if (payload.phoneNumber) body.phone_number = payload.phoneNumber;
  // if (payload.email) body.email = payload.email;
  // const raw = await api.request<any>(`/api/doctors/${id}`, {
  //   method: 'PUT',
  //   body: JSON.stringify(body),
  // });
  // return { success: raw.success };
}

export async function deleteDoctor(id: string): Promise<{ success: boolean }> {
  // 🟢 MOCK
  await delay(500);
  MOCK_DOCTORS = MOCK_DOCTORS.filter(d => d.id !== id);
  return { success: true };

  // const raw = await api.request<any>(`/api/doctors/${id}`, {
  //   method: 'DELETE',
  // });
  // return { success: raw.success };
}

export async function getDoctorById(id: string): Promise<Doctor | undefined> {
  // 🟢 MOCK
  await delay(200);
  return MOCK_DOCTORS.find(d => d.id === id);

  // 🔴 REAL
  // const raw = await api.request<any>(`/api/doctors/${id}`);
  // return {
  //   id: String(raw.data.id),
  //   name: raw.data.name,
  //   specialisation: raw.data.specialisation,
  //   phoneNumber: raw.data.phone_number,
  //   email: raw.data.email,
  // };
}
