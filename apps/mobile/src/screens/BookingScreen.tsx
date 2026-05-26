import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { formatToRondoniaTime, RONDONIA_TIMEZONE } from '@barbearia/shared';
import { FONT_DISPLAY, FONT_BODY, FONT_MONO, COLOR_BG_BASE, COLOR_BG_CARD, COLOR_BORDER, COLOR_GOLD } from '../lib/typography';
// @ts-ignore
import { Feather } from '@expo/vector-icons';

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
}

interface BarberItem {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
}

interface WorkHourItem {
  start_time: string;
  end_time: string;
}

interface AppointmentItem {
  start_time: string;
  end_time: string;
}

interface BookingScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function BookingScreen({ onBack, onSuccess }: BookingScreenProps) {
  const getBarberIcon = (name: string): "scissors" | "user" | "award" | "smile" => {
    const lower = name.toLowerCase();
    if (lower.includes('carlos') || lower.includes('corte') || lower.includes('cabelo')) return 'scissors';
    if (lower.includes('barba') || lower.includes('navalha')) return 'award';
    return 'user';
  };

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
      const { data, error } = await (supabase as any).rpc('book_appointment', {
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

  // UI Step 1: Select Service
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Escolha o Serviço</Text>
      <Text style={styles.sectionSubtitle}>Selecione um corte ou tratamento clássico</Text>

      {services.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.serviceCard,
                selectedService?.id === item.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedService(item)}
              activeOpacity={0.8}
            >
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{item.name}</Text>
                <Text style={styles.servicePrice}>R$ {Number(item.price).toFixed(2)}</Text>
              </View>
              {item.description && (
                <Text style={styles.serviceDesc}>{item.description}</Text>
              )}
              <View style={styles.serviceFooter}>
                <Text style={styles.serviceDuration}>⏳ Duração: {item.duration_minutes} min</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedService && (
        <TouchableOpacity style={styles.nextBtn} onPress={fetchBarbers} activeOpacity={0.8}>
          <Text style={styles.nextBtnText}>SELECIONAR BARBEIRO</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // UI Step 2: Select Barber
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>Escolha o Barbeiro</Text>
      <Text style={styles.sectionSubtitle}>Selecione o profissional de sua preferência</Text>

      {barbers.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum barbeiro ativo no momento.</Text>
      ) : (
        <FlatList
          data={barbers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.barberCard,
                selectedBarber?.id === item.id && styles.selectedCard,
              ]}
              onPress={() => setSelectedBarber(item)}
              activeOpacity={0.8}
            >
              <View style={styles.barberInfo}>
                <View style={styles.barberAvatarBadge}>
                  {item.avatar_url && item.avatar_url.startsWith('http') ? (
                    <Image source={{ uri: item.avatar_url }} style={styles.barberAvatarImage} />
                  ) : (
                    <Feather name={getBarberIcon(item.name)} size={20} color="#d4af37" />
                  )}
                </View>
                <View style={styles.barberTextContent}>
                  <Text style={styles.barberName}>{item.name}</Text>
                  {item.bio && <Text style={styles.barberBio}>{item.bio}</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.stepFooterBtns}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.8}>
          <Text style={styles.backBtnText}>VOLTAR</Text>
        </TouchableOpacity>
        {selectedBarber && (
          <TouchableOpacity
            style={[styles.nextBtn, { flex: 1, marginTop: 0 }]}
            onPress={() => setStep(3)}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>VER DATAS</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // UI Step 3: Select Date & Time
  const renderStep3 = () => {
    const next7Days = getNext7Days();

    if (showGuestForm) {
      return (
        <View style={styles.stepContainer}>
          <Text style={styles.sectionTitle}>Identificação do Cliente</Text>
          <Text style={styles.sectionSubtitle}>Preencha seus dados para receber o agendamento</Text>

          <View style={styles.guestForm}>
            {/* Campo Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Seu Nome</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Carlos Silva"
                placeholderTextColor="#52525b"
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="words"
              />
            </View>

            {/* Campo Telefone */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Celular / WhatsApp para contato</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: (69) 99999-9999"
                placeholderTextColor="#52525b"
                value={userPhone}
                onChangeText={setUserPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.stepFooterBtns}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setShowGuestForm(false)} activeOpacity={0.8}>
              <Text style={styles.backBtnText}>VOLTAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.nextBtn, { flex: 1, marginTop: 0 }]}
              onPress={handleConfirmBooking}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#0a0a0c" />
              ) : (
                <Text style={styles.nextBtnText}>CONFIRMAR AGENDAMENTO</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.sectionTitle}>Data e Horário</Text>
        <Text style={styles.sectionSubtitle}>Escolha a data e um horário livre</Text>

        {/* Date Horizontal Selector */}
        <View style={styles.dateSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {next7Days.map((date, idx) => {
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '');
              const dayNum = date.getDate();
              const monthName = date.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.dateBtn, isSelected && styles.dateBtnSelected]}
                  onPress={() => {
                    setSelectedDate(date);
                    calculateAvailableSlots(date);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dateDayName, isSelected && styles.dateTextSelected]}>{dayName}</Text>
                  <Text style={[styles.dateDayNum, isSelected && styles.dateTextSelected]}>{dayNum}</Text>
                  <Text style={[styles.dateMonthName, isSelected && styles.dateTextSelected]}>{monthName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Available Hour Slots */}
        <View style={styles.slotsContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="#d4af37" style={{ marginTop: 24 }} />
          ) : !selectedDate ? (
            <Text style={styles.selectDatePrompt}>Selecione um dia acima para buscar horários.</Text>
          ) : availableSlots.length === 0 ? (
            <Text style={styles.emptyText}>Não há horários disponíveis para este profissional nesta data.</Text>
          ) : (
            <FlatList
              data={availableSlots}
              keyExtractor={(item) => item}
              numColumns={4}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.slotBtn,
                    selectedSlot === item && styles.slotBtnSelected,
                  ]}
                  onPress={() => setSelectedSlot(item)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.slotText, selectedSlot === item && styles.slotTextSelected]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
              columnWrapperStyle={styles.slotRow}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.stepFooterBtns}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)} activeOpacity={0.8}>
            <Text style={styles.backBtnText}>VOLTAR</Text>
          </TouchableOpacity>
          {selectedSlot && (
            <TouchableOpacity
              style={[styles.nextBtn, { flex: 1, marginTop: 0 }]}
              onPress={() => {
                if (isUserAnonymous && (!userName.trim() || !userPhone.trim())) {
                  setShowGuestForm(true);
                } else {
                  handleConfirmBooking();
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.nextBtnText}>CONFIRMAR</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // UI Step 4: Success Screen
  const renderStep4 = () => (
    <View style={[styles.stepContainer, styles.successContainer]}>
      <View style={styles.successBadge}>
        <Text style={styles.successEmoji}>🎉</Text>
      </View>
      <Text style={styles.successTitle}>Reserva Confirmada!</Text>
      <Text style={styles.successDesc}>
        Seu horário foi agendado com sucesso e já está integrado à agenda do templo.
      </Text>

      <View style={styles.receipt}>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Serviço:</Text>
          <Text style={styles.receiptValue}>{selectedService?.name}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Profissional:</Text>
          <Text style={styles.receiptValue}>{selectedBarber?.name}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Data/Hora:</Text>
          <Text style={styles.receiptValue}>
            {selectedDate && selectedSlot
              ? `${selectedDate.toLocaleDateString('pt-BR')} às ${selectedSlot}`
              : ''}
          </Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Valor total:</Text>
          <Text style={[styles.receiptValue, { color: '#d4af37', fontWeight: 'bold' }]}>
            R$ {Number(selectedService?.price).toFixed(2)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.nextBtn, { width: '100%' }]} onPress={onSuccess} activeOpacity={0.8}>
        <Text style={styles.nextBtnText}>VER MINHAS RESERVAS</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header com indicador de etapa */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.headerBackText}>✕ Cancelar</Text>
        </TouchableOpacity>
        {step < 4 && (
          <Text style={styles.stepIndicator}>Etapa {step} de 3</Text>
        )}
      </View>

      {/* Loading e Mensagens */}
      {loading && step !== 3 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#d4af37" />
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* renderização de etapas */}
      <View style={styles.body}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLOR_BG_BASE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER,
  },
  headerBack: {
    paddingVertical: 6,
  },
  headerBackText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  stepIndicator: {
    color: COLOR_GOLD,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_BODY,
  },
  body: {
    flex: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    fontFamily: FONT_DISPLAY,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '400',
    marginTop: 4,
    marginBottom: 24,
    fontFamily: FONT_BODY,
  },
  listContent: {
    paddingBottom: 24,
  },
  serviceCard: {
    backgroundColor: COLOR_BG_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  selectedCard: {
    borderColor: COLOR_GOLD,
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
    fontFamily: FONT_DISPLAY,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLOR_GOLD,
    fontFamily: FONT_MONO,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: FONT_BODY,
  },
  serviceFooter: {
    flexDirection: 'row',
    marginTop: 4,
  },
  serviceDuration: {
    fontSize: 11,
    color: COLOR_GOLD,
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  barberCard: {
    backgroundColor: COLOR_BG_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  barberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  barberAvatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    backgroundColor: COLOR_BG_BASE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barberInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLOR_GOLD,
    fontFamily: FONT_DISPLAY,
  },
  barberAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
  },
  barberTextContent: {
    flex: 1,
    gap: 4,
  },
  barberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: FONT_DISPLAY,
  },
  barberBio: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '400',
    lineHeight: 16,
    fontFamily: FONT_BODY,
  },
  emptyText: {
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 40,
    fontWeight: '400',
    fontFamily: FONT_BODY,
  },
  nextBtn: {
    height: 48,
    backgroundColor: COLOR_GOLD,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  nextBtnText: {
    color: '#0a0a0c',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: FONT_BODY,
  },
  stepFooterBtns: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  backBtn: {
    height: 48,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backBtnText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_BODY,
  },
  dateSelectorContainer: {
    height: 80,
    marginBottom: 20,
  },
  dateScroll: {
    gap: 10,
    paddingRight: 24,
  },
  dateBtn: {
    width: 60,
    height: 72,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    backgroundColor: COLOR_BG_CARD,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dateBtnSelected: {
    borderColor: COLOR_GOLD,
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  dateDayName: {
    fontSize: 9,
    color: '#71717a',
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  dateDayNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: FONT_DISPLAY,
  },
  dateMonthName: {
    fontSize: 9,
    color: '#71717a',
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  dateTextSelected: {
    color: COLOR_GOLD,
  },
  slotsContainer: {
    flex: 1,
  },
  selectDatePrompt: {
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center',
    marginTop: 40,
    fontWeight: '400',
    fontFamily: FONT_BODY,
  },
  slotRow: {
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  slotBtn: {
    flex: 1,
    maxWidth: '23%',
    height: 38,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    backgroundColor: COLOR_BG_CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBtnSelected: {
    borderColor: COLOR_GOLD,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  slotText: {
    fontSize: 13,
    color: '#ffffff',
    fontFamily: FONT_MONO,
  },
  slotTextSelected: {
    color: COLOR_GOLD,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10, 10, 12, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  errorBanner: {
    backgroundColor: 'rgba(127, 29, 29, 0.1)',
    borderColor: 'rgba(185, 28, 28, 0.3)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    marginHorizontal: 24,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: FONT_BODY,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(20, 83, 45, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(21, 128, 61, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successEmoji: {
    fontSize: 36,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: FONT_DISPLAY,
  },
  successDesc: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 28,
    paddingHorizontal: 16,
    fontFamily: FONT_BODY,
  },
  receipt: {
    width: '100%',
    backgroundColor: COLOR_BG_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    padding: 20,
    gap: 12,
    marginBottom: 32,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    fontFamily: FONT_BODY,
  },
  receiptValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  guestForm: {
    gap: 16,
    marginBottom: 24,
    backgroundColor: COLOR_BG_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    padding: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: '#a1a1aa',
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  textInput: {
    height: 48,
    backgroundColor: COLOR_BG_BASE,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    paddingHorizontal: 16,
    color: '#f3f4f6',
    fontSize: 14,
    fontFamily: FONT_BODY,
  },
});
