export interface AppointmentItem {
  id: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  start_time: string;
}

export interface ClientItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  appointments: AppointmentItem[];
}
