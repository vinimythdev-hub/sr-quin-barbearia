import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase } from './src/lib/supabase';
import { formatToRondoniaTime } from '@barbearia/shared';
import AuthScreen from './src/screens/AuthScreen';
import BookingScreen from './src/screens/BookingScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import { Session } from '@supabase/supabase-js';
// @ts-ignore
import { Feather } from '@expo/vector-icons';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Controle de navegação por estado interno (Tabs / Stack leve e resiliente)
  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'booking' | 'appointments'>('dashboard');

  // Listen to auth state changes and fetch initial session
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      } catch (err) {
        console.error('Erro ao obter sessão inicial:', err);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        setCurrentScreen('dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  if (!session) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen />
      </>
    );
  }

  const clientName = session.user.user_metadata?.name || 'Cliente';
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

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.logoutBtnText}>Sair</Text>
            </TouchableOpacity>
          </View>

          {/* Corpo Principal do Dashboard */}
          <View style={styles.content}>

            {/* Banner Decorativo */}
            <View style={styles.welcomeCard}>
              <Text style={styles.welcomeTitle}>Sua Agenda de Estilo</Text>
              <Text style={styles.welcomeDesc}>
                Gerencie seus agendamentos e reserve seu horário exclusivo direto do seu smartphone.
              </Text>
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
          </View>

          {/* Relógio / Timezone de Porto Velho */}
          <View style={styles.timeCard}>
            <Text style={styles.timeLabel}>Horário Local de Rondônia (UTC-4):</Text>
            <Text style={styles.timeText}>{currentLocalTime}</Text>
          </View>

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
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
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
    borderBottomColor: 'rgba(39, 39, 42, 0.5)',
    justifyContent: 'space-between',
  },
  headerInfo: {
    flex: 1,
  },
  welcome: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '400',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  logoutBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  welcomeCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)',
    padding: 24,
    marginBottom: 8,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 20,
    fontWeight: '300',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)',
    borderRadius: 14,
    padding: 16,
    gap: 16,
  },
  actionEmojiBadge: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a0a0c',
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
  },
  actionDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '300',
  },
  actionArrow: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeCard: {
    backgroundColor: '#121215',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#d4af37',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(39, 39, 42, 0.3)',
  },
  footerText: {
    fontSize: 9,
    color: '#52525b',
    fontWeight: '600',
    letterSpacing: 2,
  },
});
