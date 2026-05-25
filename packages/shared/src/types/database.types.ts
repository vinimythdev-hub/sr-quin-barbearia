export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email?: string | null
          phone?: string | null
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          role?: string
          created_at?: string
        }
      }
      services: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          duration_minutes: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          duration_minutes: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          duration_minutes?: number
          is_active?: boolean
          created_at?: string
        }
      }
      barbers: {
        Row: {
          id: string
          name: string
          bio: string | null
          avatar_url: string | null
          commission_rate: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          bio?: string | null
          avatar_url?: string | null
          commission_rate?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          bio?: string | null
          avatar_url?: string | null
          commission_rate?: number
          is_active?: boolean
          created_at?: string
        }
      }
      barber_work_hours: {
        Row: {
          id: string
          barber_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          barber_id: string
          day_of_week: number
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          barber_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          client_id: string
          barber_id: string
          service_id: string
          start_time: string
          end_time: string
          price: number
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          barber_id: string
          service_id: string
          start_time: string
          end_time: string
          price: number
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          barber_id?: string
          service_id?: string
          start_time?: string
          end_time?: string
          price?: number
          status?: string
          created_at?: string
        }
      }
      whatsapp_settings: {
        Row: {
          id: string
          api_url: string
          instance_name: string
          api_token: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_url: string
          instance_name: string
          api_token: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          api_url?: string
          instance_name?: string
          api_token?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      pending_notifications: {
        Row: {
          id: string
          appointment_id: string | null
          client_id: string
          phone: string
          type: string
          scheduled_at: string
          message: string
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id?: string | null
          client_id: string
          phone: string
          type: string
          scheduled_at: string
          message: string
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string | null
          client_id?: string
          phone?: string
          type?: string
          scheduled_at?: string
          message?: string
          status?: string
          error_message?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      book_appointment: {
        Args: {
          p_barber_id: string
          p_service_id: string
          p_start_time: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
