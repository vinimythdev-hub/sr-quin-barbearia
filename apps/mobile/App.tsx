import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';
import { formatToRondoniaTime } from '@barbearia/shared';
import AuthScreen from './src/screens/AuthScreen';
import BookingScreen from './src/screens/BookingScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import { Session } from '@supabase/supabase-js';
// @ts-ignore
import { Feather } from '@expo/vector-icons';
import { FONT_DISPLAY, FONT_BODY, FONT_MONO, COLOR_BG_BASE, COLOR_BG_CARD, COLOR_BORDER, COLOR_GOLD } from './src/lib/typography';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedCutsCount, setCompletedCutsCount] = useState(0);

  // Controle de navegação por estado interno (Tabs / Stack leve e resiliente)
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'booking' | 'appointments'>('dashboard');

  // Função para buscar os agendamentos concluídos do cliente
  const fetchCompletedCuts = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', userId)
        .eq('status', 'completed');
      
      if (error) {
        console.error('Erro ao buscar cortes concluídos:', error);
      } else if (count !== null) {
        setCompletedCutsCount(count);
      }
    } catch (err) {
      console.error('Erro na requisição de cortes concluídos:', err);
    }
  };

  // Listen to auth state changes and fetch initial session
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          setSession(currentSession);
        } else {
          // Se não houver sessão ativa, realiza a autenticação anônima silenciosa
          const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously();
          if (anonymousError) {
            console.error('Erro ao autenticar anonimamente:', anonymousError);
          } else if (anonymousData.session) {
            setSession(anonymousData.session);
          }
        }
      } catch (err) {
        console.error('Erro ao obter sessão inicial:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        setCurrentScreen('dashboard');
        // Se a sessão expirou ou o usuário deslogou, recria uma sessão anônima silenciosa
        try {
          const { data: anonymousData, error: anonymousError } = await supabase.auth.signInAnonymously();
          if (anonymousError) {
            console.error('Erro ao autenticar anonimamente no fallback:', anonymousError);
          } else if (anonymousData.session) {
            setSession(anonymousData.session);
          }
        } catch (err) {
          console.error('Erro ao recuperar sessão anônima no fallback:', err);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Busca cortes concluídos sempre que a sessão mudar ou navegar para o dashboard
  useEffect(() => {
    if (session?.user?.id && currentScreen === 'dashboard') {
      fetchCompletedCuts(session.user.id);
    }
  }, [session, currentScreen]);

  // Update clock every 10 seconds
  useEffect(() => {
    if (session) {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#d4af37" />
        <Text style={styles.loadingText}>Carregando templo...</Text>
      </SafeAreaView>
    );
  }

  const clientName = session?.user?.user_metadata?.name || 'Convidado';
  const currentLocalTime = formatToRondoniaTime(currentTime);

  // Renderizador de telas com base no estado ativo
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {currentScreen === 'booking' && (
        <BookingScreen
          onBack={() => setCurrentScreen('dashboard')}
          onSuccess={() => setCurrentScreen('appointments')}
        />
      )}

      {currentScreen === 'appointments' && (
        <AppointmentsScreen
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}

      {currentScreen === 'dashboard' && (
        <>
          {/* Header Premium do Dashboard */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.welcome}>Seja bem-vindo,</Text>
              <Text style={styles.clientName}>{clientName}</Text>
            </View>

            {session && !session.user.is_anonymous && (
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                <Text style={styles.logoutBtnText}>Sair</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Corpo Principal do Dashboard com Rolagem Elegante */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
            {/* Banner Decorativo */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Sua Agenda de Estilo</Text>
              <Text style={styles.welcomeDesc}>
                Gerencie seus agendamentos e reserve seu horário exclusivo direto do seu smartphone.
              </Text>
            </View>

            {/* Cartão Fidelidade Digital Dinâmico */}
            <View style={styles.loyaltyCard}>
              <View style={styles.loyaltyHeader}>
                <View style={styles.loyaltyTitleContainer}>
                  <Feather name="award" size={18} color="#d4af37" />
                  <Text style={styles.loyaltyTitle}>Cartão Fidelidade</Text>
                </View>
                <Text style={styles.loyaltySubtitle}>
                  {completedCutsCount >= 10
                    ? "Parabéns! Você tem corte cortesia disponível!"
                    : `${completedCutsCount % 10}/10 selos para ganhar um corte cortesia`}
                </Text>
              </View>

              <View style={styles.stampsGrid}>
                {Array.from({ length: 10 }).map((_, index) => {
                  const stampNumber = index + 1;
                  const activeStamps = completedCutsCount % 10 === 0 && completedCutsCount > 0 ? 10 : completedCutsCount % 10;
                  const isStamped = stampNumber <= activeStamps;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.stampSlot,
                        isStamped ? styles.stampStamped : styles.stampEmpty
                      ]}
                    >
                      {isStamped ? (
                        <View style={styles.stampIconBg}>
                          <Feather name="scissors" size={14} color="#d4af37" />
                        </View>
                      ) : (
                        <Text style={styles.stampNumber}>{stampNumber}</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {completedCutsCount >= 10 && (
                <View style={styles.voucherContainer}>
                  <Feather name="gift" size={18} color="#0a0a0c" />
                  <View style={styles.voucherTextContainer}>
                    <Text style={styles.voucherTitle}>Corte Cortesia Disponível!</Text>
                    <Text style={styles.voucherDesc}>Apresente este cartão no caixa da barbearia para resgatar.</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Ação 1: Agendar Novo Horário */}
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => setCurrentScreen('booking')}
              activeOpacity={0.85}
            >
              <View style={styles.actionEmojiBadge}>
                <Feather name="calendar" size={22} color="#d4af37" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Agendar Horário</Text>
                <Text style={styles.actionDesc}>Escolha o barbeiro, serviço e reserve em segundos</Text>
              </View>
              <Text style={styles.actionArrow}>➔</Text>
            </TouchableOpacity>

            {/* Ação 2: Minhas Reservas */}
            <TouchableOpacity
              style={[styles.actionCard, { borderColor: 'rgba(39, 39, 42, 0.7)', backgroundColor: '#121215' }]}
              onPress={() => setCurrentScreen('appointments')}
              activeOpacity={0.85}
            >
              <View style={[styles.actionEmojiBadge, { borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Feather name="book-open" size={22} color="#a1a1aa" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Minhas Reservas</Text>
                <Text style={styles.actionDesc}>Veja horários agendados e cancele se necessário</Text>
              </View>
              <Text style={styles.actionArrow}>➔</Text>
            </TouchableOpacity>

            {/* Relógio / Timezone de Porto Velho */}
            <View style={styles.timeCard}>
              <Text style={styles.timeLabel}>Horário Local de Rondônia (UTC-4):</Text>
              <Text style={styles.timeText}>{currentLocalTime}</Text>
            </View>
          </ScrollView>

          {/* Rodapé Art Déco */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>SR. QUIN BARBEARIA • EST. 2026</Text>
          </View>
        </>
      )}
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0c',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(212, 175, 55, 0.8)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: FONT_DISPLAY,
  },
  container: {
    flex: 1,
    backgroundColor: COLOR_BG_BASE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER,
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
  },
  welcome: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '400',
    fontFamily: FONT_BODY,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
    fontFamily: FONT_DISPLAY,
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  logoutBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONT_BODY,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
  },
  loyaltyCard: {
    backgroundColor: COLOR_BG_CARD,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 20,
    marginBottom: 8,
  },
  loyaltyHeader: {
    gap: 6,
    marginBottom: 16,
  },
  loyaltyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loyaltyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
    fontFamily: FONT_DISPLAY,
  },
  loyaltySubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '400',
    fontFamily: FONT_BODY,
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  stampSlot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampStamped: {
    borderWidth: 1.5,
    borderColor: COLOR_GOLD,
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
  },
  stampEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.2)',
    backgroundColor: 'transparent',
  },
  stampIconBg: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampNumber: {
    fontSize: 13,
    color: 'rgba(212, 175, 55, 0.4)',
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  voucherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_GOLD,
    borderRadius: 4,
    padding: 14,
    marginTop: 20,
    gap: 12,
  },
  voucherTextContainer: {
    flex: 1,
    gap: 2,
  },
  voucherTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0a0a0c',
    fontFamily: FONT_DISPLAY,
  },
  voucherDesc: {
    fontSize: 11,
    color: 'rgba(10, 10, 12, 0.8)',
    fontWeight: '500',
    fontFamily: FONT_BODY,
  },
  welcomeCard: {
    backgroundColor: COLOR_BG_CARD,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    padding: 24,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: FONT_DISPLAY,
  },
  welcomeDesc: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 20,
    fontWeight: '400',
    fontFamily: FONT_BODY,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_BG_CARD,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    padding: 16,
    gap: 16,
  },
  actionEmojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_BG_BASE,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionTextContainer: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: FONT_DISPLAY,
  },
  actionDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '400',
    fontFamily: FONT_BODY,
  },
  actionArrow: {
    color: COLOR_GOLD,
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeCard: {
    backgroundColor: COLOR_BG_CARD,
    borderRadius: 4,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 6,
    letterSpacing: 0.5,
    fontFamily: FONT_BODY,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLOR_GOLD,
    fontFamily: FONT_MONO,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDER,
  },
  footerText: {
    fontSize: 9,
    color: '#52525b',
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: FONT_DISPLAY,
  },
});
