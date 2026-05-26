export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
}

export interface BarberItem {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
}

export interface WorkHourItem {
  start_time: string;
  end_time: string;
}

export interface AppointmentItem {
  start_time: string;
  end_time: string;
}

export interface BookingScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}
