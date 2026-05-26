"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Sem next/link para evitar incompatibilidades de tipo React 18/19 no JSX do Monorepo
import { supabase } from "@/lib/supabase";
import { formatToRondoniaTime, RONDONIA_TIMEZONE } from "@barbearia/shared";
import Header from "@/components/Header";

interface UserProfile {
  name: string;
  email: string | null;
  role: string;
}

interface AppointmentDetail {
  id: string;
  start_time: string;
  end_time: string;
  price: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  profiles: {
    name: string;
    phone: string | null;
  } | null;
  barbers: {
    name: string;
  } | null;
  services: {
    name: string;
    duration_minutes: number;
  } | null;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Dados reais buscados do Supabase
  const [appointments, setAppointments] = useState<AppointmentDetail[]>([]);
  const [activeBarbersCount, setActiveBarbersCount] = useState(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Obter intervalo de tempo UTC correspondente a "hoje" no fuso de Rondônia
  const getRondoniaTodayRange = () => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: RONDONIA_TIMEZONE,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(now);
    const getValue = (type: string) => parts.find(p => p.type === type)?.value || "";
    
    const year = getValue("year");
    const month = getValue("month").padStart(2, "0");
    const day = getValue("day").padStart(2, "0");

    const startLocal = `${year}-${month}-${day}T00:00:00`;
    const endLocal = `${year}-${month}-${day}T23:59:59`;

    const startDate = new Date(`${startLocal}-04:00`);
    const endDate = new Date(`${endLocal}-04:00`);

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  };

  // Buscar dados reais do Supabase
  const fetchDashboardData = async () => {
    try {
      const range = getRondoniaTodayRange();

      // 1. Buscar agendamentos de hoje
      const { data: appData, error: appError } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          price,
          status,
          profiles (name, phone),
          barbers (name),
          services (name, duration_minutes)
        `)
        .gte("start_time", range.start)
        .lte("start_time", range.end)
        .order("start_time", { ascending: true });

      if (appError) throw appError;
      setAppointments((appData || []) as any);

      // 2. Buscar contagem de barbeiros ativos
      const { count, error: barberError } = await supabase
        .from("barbers")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      if (barberError) throw barberError;
      setActiveBarbersCount(count || 0);

    } catch (err) {
      console.error("Erro ao buscar dados do painel:", err);
    }
  };

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push("/login");
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("name, email, role")
          .eq("id", session.user.id)
          .single();

        if (profileError || !profileData) {
          setProfile({
            name: session.user.user_metadata?.name || "Administrador",
            email: session.user.email || "",
            role: session.user.user_metadata?.role || "admin",
          });
        } else {
          setProfile(profileData);
        }

        // Buscar dados operacionais
        await fetchDashboardData();

      } catch (err) {
        console.error("Erro ao verificar autenticação:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    getSessionAndProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Alterar o status de um agendamento
  const handleUpdateStatus = async (appointmentId: string, newStatus: 'completed' | 'cancelled' | 'no_show') => {
    setActionLoadingId(appointmentId);
    try {
      // @ts-ignore
      const { error } = await supabase.from("appointments").update({ status: newStatus }).eq("id", appointmentId);

      if (error) throw error;
      
      // Atualiza a lista localmente
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Erro ao atualizar status: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cálculos de Métricas de Hoje
  const todayRevenue = appointments
    .filter(a => a.status === 'scheduled' || a.status === 'completed')
    .reduce((sum, a) => sum + Number(a.price), 0);

  const completedCount = appointments.filter(a => a.status === 'completed').length;
  const noShowsCount = appointments.filter(a => a.status === 'no_show').length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-charcoal">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-brand-gold border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-brand-gold/75 font-mono">
            Carregando Templo...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-charcoal text-[#f3f4f6] relative flex flex-col">
      
      {/* Elemento de brilho ambiente dourado - mantido super sutil */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-brand-gold/2 rounded-full blur-[120px] pointer-events-none" />

      {/* 1. Barra de Navegação Premium Responsiva */}
      <Header activePage="dashboard" />

      {/* 2. Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-10">
        
        {/* Banner de Boas-vindas - Estilo Tátil */}
        <section className="panel-tactile bg-brand-carbon p-8 sm:p-10 relative overflow-hidden shadow-retro-md">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-radial-gradient from-brand-gold/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] text-brand-gold font-bold">
                Painel Administrativo Live
              </span>
              <h1 className="font-display text-3xl sm:text-4xl font-light text-slate-100">
                Olá, <span className="font-semibold text-white">{profile?.name.split(" ")[0]}</span>!
              </h1>
              <p className="text-slate-400 text-sm font-light max-w-xl">
                O seu templo está aberto. O dashboard está conectado em tempo real à base de dados do Supabase.
              </p>
            </div>
 
            {/* Relógio Local de Rondônia - Estilo Tátil */}
            <div className="bg-brand-charcoal border-[1.5px] border-brand-clay rounded-[4px] px-6 py-4 flex flex-col items-center justify-center min-w-[220px] shadow-retro-sm">
              <span className="text-[9px] uppercase tracking-widest text-[#a1a1aa] font-mono">
                Horário de Rondônia (UTC-4)
              </span>
              <span className="text-lg font-bold text-white mt-1">
                {formatToRondoniaTime(currentDate).split(", ")[1]}
              </span>
              <span className="text-[10px] text-brand-gold/80 mt-0.5">
                {formatToRondoniaTime(currentDate).split(", ")[0]}
              </span>
            </div>
          </div>
        </section>

        {/* Grid de Métricas Live */}
        <section className="space-y-6">
          <h3 className="font-display text-xl font-semibold tracking-wide text-white">
            Métricas de Hoje (Tempo Real)
          </h3>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Faturamento */}
            <div className="panel-tactile bg-brand-carbon p-6 space-y-4 hover:border-brand-gold transition duration-150 shadow-retro-sm hover:shadow-retro-md hover:-translate-x-[2px] hover:-translate-y-[2px]">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Faturamento Estimado</span>
                <svg className="w-5 h-5 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white font-mono">
                  R$ {todayRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
                <p className="text-[10px] text-green-400 mt-1">✓ Atualizado em tempo real</p>
              </div>
            </div>
  
            {/* Card 2: Agendamentos */}
            <div className="panel-tactile bg-brand-carbon p-6 space-y-4 hover:border-brand-copper transition duration-150 shadow-retro-sm hover:shadow-retro-md hover:-translate-x-[2px] hover:-translate-y-[2px]">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Agendamentos Hoje</span>
                <svg className="w-5 h-5 text-brand-copper" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white font-mono">{appointments.length} Cortes</h4>
                <p className="text-[10px] text-brand-gold mt-1">{completedCount} concluídos</p>
              </div>
            </div>
  
            {/* Card 3: Barbeiros Ativos */}
            <div className="panel-tactile bg-brand-carbon p-6 space-y-4 hover:border-brand-gold transition duration-150 shadow-retro-sm hover:shadow-retro-md hover:-translate-x-[2px] hover:-translate-y-[2px]">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Equipe em Serviço</span>
                <svg className="w-5 h-5 text-brand-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white font-mono">{activeBarbersCount} Ativos</h4>
                <p className="text-[10px] text-slate-400 mt-1">Barbeiros na escala hoje</p>
              </div>
            </div>
  
            {/* Card 4: Faltas */}
            <div className="panel-tactile bg-brand-carbon p-6 space-y-4 hover:border-brand-tijolo transition duration-150 shadow-retro-sm hover:shadow-retro-md hover:-translate-x-[2px] hover:-translate-y-[2px]">
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">No-shows de Hoje</span>
                <svg className="w-5 h-5 text-brand-tijolo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="17" y1="8" x2="23" y2="14"></line>
                  <line x1="23" y1="8" x2="17" y2="14"></line>
                </svg>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-white font-mono">{noShowsCount} Faltas</h4>
                <p className="text-[10px] text-brand-tijolo mt-1">Taxa de no-shows local</p>
              </div>
            </div>
  
          </div>
        </section>

        {/* 3. Tabela de Agendamentos Reais do Dia */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-xl font-semibold tracking-wide text-white">
              Agenda do Dia
            </h3>
            <button 
              onClick={fetchDashboardData}
              className="text-xs btn-tactile px-3 py-1.5 flex items-center gap-1.5 text-slate-300 hover:text-brand-gold bg-brand-carbon"
            >
              <svg className="w-3.5 h-3.5 text-[#a1a1aa] group-hover:text-white transition duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              Atualizar
            </button>
          </div>
  
          <div className="panel-tactile bg-brand-carbon overflow-hidden shadow-retro-md">
            {appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-light text-sm">
                Nenhum agendamento registrado para o dia de hoje.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-clay bg-brand-charcoal text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa] font-mono">
                      <th className="py-4 px-6">Horário (Rondônia)</th>
                      <th className="py-4 px-6">Cliente</th>
                      <th className="py-4 px-6">Barbeiro</th>
                      <th className="py-4 px-6">Serviço</th>
                      <th className="py-4 px-6">Valor</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-clay/60 text-sm font-light">
                    {appointments.map((app) => {
                      const startTimeLocal = formatToRondoniaTime(app.start_time).split(", ")[1];
                      
                      return (
                        <tr key={app.id} className="hover:bg-[#18181b]/20 transition duration-150">
                          <td className="py-4 px-6 font-mono text-brand-gold font-semibold">
                            {startTimeLocal}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-100">{app.profiles?.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono mt-0.5">{app.profiles?.phone || "Sem telefone"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-slate-300">
                            {app.barbers?.name}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col">
                              <span className="text-slate-300">{app.services?.name}</span>
                              <span className="text-[10px] text-slate-500 mt-0.5">{app.services?.duration_minutes} min</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-200">
                            R$ {Number(app.price).toFixed(2)}
                          </td>
                          <td className="py-4 px-6">
                            <span 
                              className={`px-2.5 py-1 rounded-[2px] text-[10px] uppercase font-mono tracking-wider font-semibold ${
                                app.status === 'completed'
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                  : app.status === 'cancelled'
                                  ? "bg-red-500/10 text-brand-tijolo border border-brand-tijolo/20"
                                  : app.status === 'no_show'
                                  ? "bg-orange-500/10 text-brand-copper border border-brand-copper/20"
                                  : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                              }`}
                            >
                              {app.status === 'completed' && "Concluído"}
                              {app.status === 'cancelled' && "Cancelado"}
                              {app.status === 'no_show' && "Falta"}
                              {app.status === 'scheduled' && "Agendado"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            {app.status === 'scheduled' ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleUpdateStatus(app.id, 'completed')}
                                  disabled={actionLoadingId === app.id}
                                  className="bg-green-950/20 border-[1.5px] border-green-700/60 hover:border-green-500 text-green-400 px-3 py-1.5 rounded-[4px] text-xs font-semibold tracking-wider uppercase transition duration-100 shadow-retro-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px]"
                                >
                                  {actionLoadingId === app.id ? "..." : "Concluir"}
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(app.id, 'no_show')}
                                  disabled={actionLoadingId === app.id}
                                  className="bg-orange-950/20 border-[1.5px] border-brand-copper/60 hover:border-brand-copper text-brand-copper px-3 py-1.5 rounded-[4px] text-xs font-semibold tracking-wider uppercase transition duration-100 shadow-retro-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px]"
                                >
                                  Falta
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(app.id, 'cancelled')}
                                  disabled={actionLoadingId === app.id}
                                  className="bg-brand-charcoal border-[1.5px] border-brand-tijolo hover:border-red-500 text-brand-tijolo px-3 py-1.5 rounded-[4px] text-xs font-semibold tracking-wider uppercase transition duration-100 shadow-retro-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:-translate-x-[1px] hover:-translate-y-[1px]"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 font-mono italic">Finalizado</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Links de Atalhos Administrativos */}
        <section className="panel-tactile bg-brand-carbon p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-retro-md">
          <div className="space-y-1">
            <h4 className="text-base font-semibold text-white">Pronto para começar a gerenciar?</h4>
            <p className="text-xs text-slate-400 font-light">Adicione novos serviços ao catálogo ou cadastre novos barbeiros e escalas de trabalho na equipe.</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <a 
              href="/admin/services" 
              className="btn-tactile bg-transparent text-brand-gold border-brand-gold hover:border-brand-gold shadow-retro-sm hover:shadow-retro-md hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none px-5 py-2.5 text-xs font-semibold tracking-widest transition duration-100 flex items-center justify-center"
            >
              CADASTRAR SERVIÇOS
            </a>
            <a 
              href="/admin/barbers" 
              className="btn-tactile bg-transparent text-brand-gold border-brand-gold hover:border-brand-gold shadow-retro-sm hover:shadow-retro-md hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none px-5 py-2.5 text-xs font-semibold tracking-widest transition duration-100 flex items-center justify-center"
            >
              CADASTRAR BARBEIROS
            </a>
          </div>
        </section>

      </main>

      {/* 3. Rodapé */}
      <footer className="border-t border-brand-clay py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto bg-brand-charcoal">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>

    </div>
  );
}
