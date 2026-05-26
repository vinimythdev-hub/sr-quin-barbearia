import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { formatToRondoniaTime } from '@barbearia/shared';

interface AppointmentItem {
  id: string;
  start_time: string;
  end_time: string;
  price: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  barbers: {
    name: string;
  } | null;
  services: {
    name: string;
    duration_minutes: number;
  } | null;
}

interface AppointmentsScreenProps {
  onBack: () => void;
}

export default function AppointmentsScreen({ onBack }: AppointmentsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      // Query client's appointments
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          price,
          status,
          barbers (name),
          services (name, duration_minutes)
        `)
        .eq('client_id', session.user.id)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setAppointments((data || []) as any);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar agendamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelAppointment = async (appointmentId: string) => {
    const performCancel = async () => {
      setActionLoadingId(appointmentId);
      try {
        // Update status to cancelled in Supabase
        const { error } = await (supabase.from('appointments') as any)
          .update({ status: 'cancelled' })
          .eq('id', appointmentId);

        if (error) throw error;

        // Refresh list local state
        setAppointments((prev: AppointmentItem[]) =>
          prev.map((app) =>
            app.id === appointmentId ? { ...app, status: 'cancelled' } : app
          )
        );
      } catch (err: any) {
        if (Platform.OS === 'web') {
          alert(`Erro ao cancelar: ${err.message || 'Houve um problema.'}`);
        } else {
          Alert.alert('Erro ao cancelar', err.message || 'Houve um problema ao processar seu cancelamento.');
        }
      } finally {
        setActionLoadingId(null);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('Tem certeza de que deseja cancelar seu horário de agendamento?');
      if (confirm) {
        await performCancel();
      }
    } else {
      Alert.alert(
        'Cancelar Reserva',
        'Tem certeza de que deseja cancelar seu horário de agendamento?',
        [
          { text: 'Não', style: 'cancel' },
          {
            text: 'Sim, Cancelar',
            style: 'destructive',
            onPress: performCancel,
          },
        ]
      );
    }
  };

  // Filter schedules based on tab
  const now = new Date().getTime();
  const upcomingApps = appointments.filter(
    (app) => app.status === 'scheduled' && new Date(app.start_time).getTime() > now
  );
  const historyApps = appointments.filter(
    (app) =>
      app.status !== 'scheduled' || new Date(app.start_time).getTime() <= now
  );

  const activeList = activeTab === 'upcoming' ? upcomingApps : historyApps;

  const renderStatusBadge = (status: AppointmentItem['status'], startTime: string) => {
    const isPast = new Date(startTime).getTime() <= now;
    
    if (status === 'cancelled') {
      return <View style={[styles.badge, styles.badgeCancelled]}><Text style={styles.badgeTextCancelled}>Cancelado</Text></View>;
    }
    if (status === 'no_show') {
      return <View style={[styles.badge, styles.badgeNoShow]}><Text style={styles.badgeTextNoShow}>Falta</Text></View>;
    }
    if (status === 'completed') {
      return <View style={[styles.badge, styles.badgeCompleted]}><Text style={styles.badgeTextCompleted}>Concluído</Text></View>;
    }
    if (isPast) {
      return <View style={[styles.badge, styles.badgeHistory]}><Text style={styles.badgeTextHistory}>Histórico</Text></View>;
    }
    return <View style={[styles.badge, styles.badgeActive]}><Text style={styles.badgeTextActive}>Confirmado</Text></View>;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.headerBackText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas Reservas</Text>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            PRÓXIMOS ({upcomingApps.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            HISTÓRICO ({historyApps.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      )}

      {/* Body List */}
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color="#d4af37" style={{ marginTop: 60 }} />
        ) : activeList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>{activeTab === 'upcoming' ? '📅' : '📂'}</Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'upcoming' ? 'Sem reservas futuras' : 'Histórico vazio'}
            </Text>
            <Text style={styles.emptyDesc}>
              {activeTab === 'upcoming'
                ? 'Agende um horário para começar a cuidar do seu estilo.'
                : 'Suas reservas finalizadas e canceladas serão listadas aqui.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={activeList}
            keyExtractor={(item) => item.id}
            refreshing={loading}
            onRefresh={fetchAppointments}
            renderItem={({ item }) => {
              const formattedDate = formatToRondoniaTime(item.start_time);
              const isCancellable =
                item.status === 'scheduled' &&
                new Date(item.start_time).getTime() > now;

              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.serviceName}>{item.services?.name}</Text>
                    {renderStatusBadge(item.status, item.start_time)}
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Barbeiro:</Text>
                      <Text style={styles.infoValue}>{item.barbers?.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Horário:</Text>
                      <Text style={styles.infoValue}>{formattedDate}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Valor pago:</Text>
                      <Text style={styles.infoPrice}>R$ {Number(item.price).toFixed(2)}</Text>
                    </View>
                  </View>

                  {isCancellable && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancelAppointment(item.id)}
                      disabled={actionLoadingId === item.id}
                      activeOpacity={0.8}
                    >
                      {actionLoadingId === item.id ? (
                        <ActivityIndicator size="small" color="#f87171" />
                      ) : (
                        <Text style={styles.cancelBtnText}>CANCELAR RESERVA</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 39, 42, 0.4)',
  },
  headerBack: {
    position: 'absolute',
    left: 24,
    top: 16,
    zIndex: 10,
    height: 38,
    justifyContent: 'center',
  },
  headerBackText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 39, 42, 0.3)',
  },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#d4af37',
  },
  tabText: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: '600',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#d4af37',
  },
  body: {
    flex: 1,
    padding: 24,
  },
  errorBanner: {
    backgroundColor: 'rgba(127, 29, 29, 0.2)',
    borderColor: 'rgba(185, 28, 28, 0.4)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 24,
    marginTop: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyDesc: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '300',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  cardHeader: {
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
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(20, 83, 45, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeCancelled: {
    backgroundColor: 'rgba(127, 29, 29, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  badgeNoShow: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  badgeHistory: {
    backgroundColor: 'rgba(39, 39, 42, 0.2)',
    borderColor: 'rgba(63, 63, 70, 0.4)',
  },
  badgeTextActive: {
    color: '#d4af37',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextCompleted: {
    color: '#4ade80',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextCancelled: {
    color: '#f87171',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextNoShow: {
    color: '#fdba74',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeTextHistory: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600',
  },
  cardBody: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(39, 39, 42, 0.3)',
    paddingTop: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#71717a',
  },
  infoValue: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
  infoPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d4af37',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cancelBtn: {
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
