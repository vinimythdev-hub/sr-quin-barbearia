export interface BarberItem {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface AppointmentDetail {
  id: string;
  start_time: string;
  end_time: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  profiles: {
    name: string;
    phone: string | null;
  } | null;
  barbers: {
    id: string;
    name: string;
  } | null;
  services: {
    name: string;
    duration_minutes: number;
  } | null;
}
