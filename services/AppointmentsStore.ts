import { SecureAsyncStorage as AsyncStorage } from '@/utils/storage';

export interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  distanceKm: number;
  availabilityTag: 'Today' | 'Tomorrow';
  availableSlots: string[];
  consultationFee: number;
  avatarBg?: string;
}

export interface AppointmentBooking {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  dateStr: string;
  timeSlot: string;
  consultationType: 'OPD' | 'Follow-up' | 'Consultation';
  fee: number;
  patientName: string;
  paymentMethod: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  createdAt: string;
}

// Initial Mock Doctors
export const MOCK_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc_ananya_sharma',
    name: 'Dr. Ananya Sharma',
    specialty: 'General physician',
    hospital: 'Apollo Hospitals',
    experienceYears: 8,
    rating: 4.8,
    reviewsCount: 124,
    distanceKm: 0.7,
    availabilityTag: 'Today',
    availableSlots: ['10:30 AM', '12:00 PM', '4:30 PM'],
    consultationFee: 500,
    avatarBg: '#DCFCE7',
  },
  {
    id: 'doc_rakesh_verma',
    name: 'Dr. Rakesh Verma',
    specialty: 'Cardiologist',
    hospital: 'Fortis Health',
    experienceYears: 12,
    rating: 4.7,
    reviewsCount: 98,
    distanceKm: 1.2,
    availabilityTag: 'Tomorrow',
    availableSlots: ['11:00 AM', '03:00 PM', '06:00 PM'],
    consultationFee: 700,
    avatarBg: '#E0F2FE',
  },
  {
    id: 'doc_priya_nair',
    name: 'Dr. Priya Nair',
    specialty: 'Dermatologist',
    hospital: 'Max Healthcare',
    experienceYears: 6,
    rating: 4.9,
    reviewsCount: 156,
    distanceKm: 1.8,
    availabilityTag: 'Today',
    availableSlots: ['02:00 PM', '05:30 PM'],
    consultationFee: 600,
    avatarBg: '#FCE7F3',
  },
];

// Initial Initial Booked Appointments
export const INITIAL_APPOINTMENTS: AppointmentBooking[] = [
  {
    id: 'HA-8834920',
    doctorId: 'doc_ananya_sharma',
    doctorName: 'Dr. Ananya Sharma',
    specialty: 'General physician',
    hospital: 'Apollo Hospitals',
    dateStr: '22 May 2025, Thursday',
    timeSlot: '10:30 - 11:00 AM',
    consultationType: 'OPD',
    fee: 500,
    patientName: 'Arjun Kumar (You)',
    paymentMethod: 'UPI — arjun@upi',
    status: 'Confirmed',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'HA-7721094',
    doctorId: 'doc_rakesh_verma',
    doctorName: 'Dr. Rakesh Verma',
    specialty: 'Cardiologist',
    hospital: 'Fortis Health',
    dateStr: '28 May 2025, Wednesday',
    timeSlot: '4:00 PM',
    consultationType: 'Follow-up',
    fee: 700,
    patientName: 'Arjun Kumar (You)',
    paymentMethod: 'UPI — arjun@upi',
    status: 'Pending',
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = 'healthai_user_appointments';

export async function getAppointments(): Promise<AppointmentBooking[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
      return INITIAL_APPOINTMENTS;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading appointments store:', e);
    return INITIAL_APPOINTMENTS;
  }
}

export async function addAppointment(booking: Omit<AppointmentBooking, 'id' | 'createdAt'>): Promise<AppointmentBooking> {
  const list = await getAppointments();
  const newBooking: AppointmentBooking = {
    ...booking,
    id: `HA-${Math.floor(1000000 + Math.random() * 9000000)}`,
    createdAt: new Date().toISOString(),
  };
  const updated = [newBooking, ...list];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newBooking;
}

export function getDoctorById(id: string): DoctorProfile {
  const found = MOCK_DOCTORS.find((d) => d.id === id);
  if (found) return found;
  return MOCK_DOCTORS[0];
}
