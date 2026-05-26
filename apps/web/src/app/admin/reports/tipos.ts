export interface BarberItem {
  id: string;
  name: string;
  commission_rate: number;
}

export interface AppointmentDetail {
  id: string;
  start_time: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  profiles: {
    name: string;
  } | null;
  barbers: {
    id: string;
    name: string;
    commission_rate: number;
  } | null;
  services: {
    name: string;
  } | null;
}

export interface BarberStat {
  id: string;
  name: string;
  rate: number;
  cutsCount: number;
  totalRevenue: number;
  totalCommission: number;
}
