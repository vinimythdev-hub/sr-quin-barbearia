export interface BarberItem {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface WorkHourModalItem {
  day_of_week: number;
  is_working: boolean;
  start_time: string;
  end_time: string;
  lunch_start: string;
  lunch_end: string;
}
