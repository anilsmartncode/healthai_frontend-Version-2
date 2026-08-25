import { api } from './api';

export interface Doctor {
  id: number;
  user_id: number;
  name: string;
  specialty?: string;
  phone?: string;
  email?: string;
  clinic_name?: string;
  address?: string;
  notes?: string;
  show_to_family: boolean;
  is_mine: boolean;
  created_at: string;
  updated_at: string;
}

export async function getDoctors(): Promise<Doctor[]> {
  try {
    const raw = await api.request<any>('/api/api/doctors?include_family=true');
    return Array.isArray(raw) ? raw : (raw?.data || []);
  } catch (error) {
    console.error('[doctorsApi.getDoctors] error:', error);
    return [];
  }
}

export async function addDoctor(payload: Partial<Doctor>): Promise<{ success: boolean; data?: Doctor }> {
  try {
    const raw = await api.request<any>('/api/api/doctors', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: raw.success !== false, data: raw.data || raw };
  } catch (error) {
    console.error('[doctorsApi.addDoctor] error:', error);
    return { success: false };
  }
}

export async function updateDoctor(id: string | number, payload: Partial<Doctor>): Promise<{ success: boolean }> {
  try {
    const raw = await api.request<any>(`/api/api/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return { success: raw.success !== false };
  } catch (error) {
    console.error('[doctorsApi.updateDoctor] error:', error);
    return { success: false };
  }
}

export async function deleteDoctor(id: string | number): Promise<{ success: boolean }> {
  try {
    await api.request<any>(`/api/api/doctors/${id}`, {
      method: 'DELETE',
    });
    // The endpoint returns 204 No Content, so we just assume success if it doesn't throw
    return { success: true };
  } catch (error) {
    console.error('[doctorsApi.deleteDoctor] error:', error);
    return { success: false };
  }
}

export async function getDoctorById(id: string | number): Promise<Doctor | undefined> {
  try {
    const raw = await api.request<any>(`/api/api/doctors/${id}`);
    return raw?.data || raw;
  } catch (error) {
    console.error('[doctorsApi.getDoctorById] error:', error);
    return undefined;
  }
}
