import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { ServiceItem, BarberItem } from '../tipos';

export function useAgendamento(onSuccess: () => void) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Database Data
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // Selections
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<BarberItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Guest Mode State
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isUserAnonymous, setIsUserAnonymous] = useState(false);

  // Check if current session is anonymous
  useEffect(() => {
    const checkUserType = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setIsUserAnonymous(user.is_anonymous || false);
          setUserName(user.user_metadata?.name || '');
          setUserPhone(user.user_metadata?.phone || '');
        }
      } catch (err) {
        console.error('Erro ao verificar tipo de usuário:', err);
      }
    };
    checkUserType();
  }, []);

  // Fetch Services (Step 1)
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('id, name, description, price, duration_minutes')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (error) throw error;
        setServices(data || []);
      } catch (err: any) {
        setErrorMessage(err.message || 'Erro ao carregar serviços.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Fetch Barbers (Step 2)
  const fetchBarbers = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, name, bio, avatar_url')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setBarbers(data || []);
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar barbeiros.');
    } finally {
      setLoading(false);
    }
  };

  // Generate next 7 days for the horizontal slider (Step 3)
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Exclui Domingo da listagem básica de seleção (dia 0)
      if (date.getDay() !== 0) {
        days.push(date);
      }
    }
    return days;
  };

  // Calculate Slots based on Selected Date & Barber (Step 3)
  const calculateAvailableSlots = async (date: Date) => {
    if (!selectedBarber || !selectedService) return;
    setLoading(true);
    setErrorMessage(null);
    setSelectedSlot(null);
    setAvailableSlots([]);

    try {
      const dayOfWeek = date.getDay(); // 0 = Dom, 1 = Seg, etc.

      // 1. Fetch barber working hours for this day of week
      const { data: hoursData, error: hoursError } = await supabase
        .from('barber_work_hours')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber.id)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();

      if (hoursError) throw hoursError;
      if (!hoursData) {
        setAvailableSlots([]);
        return;
      }

      // Convert day date parts in Rondônia timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Construct bounds using Rondônia offset
      const startOfDayISO = new Date(`${dateStr}T00:00:00-04:00`).toISOString();
      const endOfDayISO = new Date(`${dateStr}T23:59:59-04:00`).toISOString();

      // 2. Fetch occupied appointments for this barber on this day
      const { data: appData, error: appError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('barber_id', selectedBarber.id)
        .neq('status', 'cancelled')
        .gte('start_time', startOfDayISO)
        .lte('start_time', endOfDayISO);

      if (appError) throw appError;

      // 3. Generate slots between start_time and end_time
      const [startHour, startMin] = (hoursData as any).start_time.split(':').map(Number);
      const [endHour, endMin] = (hoursData as any).end_time.split(':').map(Number);

      const slots: string[] = [];
      let current = new Date();
      current.setHours(startHour, startMin, 0, 0);

      const limit = new Date();
      limit.setHours(endHour, endMin, 0, 0);

      const duration = selectedService.duration_minutes;

      while (current.getTime() < limit.getTime()) {
        const slotHour = String(current.getHours()).padStart(2, '0');
        const slotMin = String(current.getMinutes()).padStart(2, '0');
        const slotTimeStr = `${slotHour}:${slotMin}`;

        // Construct slot bounds in UTC/ISO
        const slotStart = new Date(`${dateStr}T${slotTimeStr}:00-04:00`);
        const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

        // Check if slot overlaps with any occupied appointment
        const isOccupied = ((appData as any[]) || []).some((app: any) => {
          const appStart = new Date(app.start_time).getTime();
          const appEnd = new Date(app.end_time).getTime();
          const sTime = slotStart.getTime();
          const eTime = slotEnd.getTime();

          // Overlap check
          return sTime < appEnd && eTime > appStart;
        });

        // Also check if slot is in the past compared to current real time
        const now = new Date();
        const isValidFuture = slotStart.getTime() > now.getTime();

        if (!isOccupied && isValidFuture) {
          slots.push(slotTimeStr);
        }

        // Advance by 30 mins for slot availability options
        current = new Date(current.getTime() + 30 * 60 * 1000);
      }

      setAvailableSlots(slots);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao calcular horários.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Booking (Step 4)
  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedSlot) return;

    if (showGuestForm) {
      if (!userName.trim() || !userPhone.trim()) {
        setErrorMessage('Por favor, preencha seu nome e telefone.');
        return;
      }
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      // Se for um usuário anônimo no guest form, atualiza seus dados de contato primeiro
      if (showGuestForm) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { name: userName.trim(), phone: userPhone.trim() }
        });
        if (updateError) throw updateError;
      }

      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Construct starting timestamp in Rondônia ISO format
      const startDateTimeISO = new Date(`${dateStr}T${selectedSlot}:00-04:00`).toISOString();

      // Invoke book_appointment RPC
      const { error } = await (supabase as any).rpc('book_appointment', {
        p_barber_id: selectedBarber.id,
        p_service_id: selectedService.id,
        p_start_time: startDateTimeISO,
      });

      if (error) throw error;
      setStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'Horário indisponível ou erro ao agendar.');
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    setStep,
    loading,
    setLoading,
    errorMessage,
    setErrorMessage,
    services,
    barbers,
    availableSlots,
    selectedService,
    setSelectedService,
    selectedBarber,
    setSelectedBarber,
    selectedDate,
    setSelectedDate,
    selectedSlot,
    setSelectedSlot,
    userName,
    setUserName,
    userPhone,
    setUserPhone,
    showGuestForm,
    setShowGuestForm,
    isUserAnonymous,
    fetchBarbers,
    getNext7Days,
    calculateAvailableSlots,
    handleConfirmBooking,
  };
}
