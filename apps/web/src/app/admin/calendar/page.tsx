"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { formatToRondoniaTime, RONDONIA_TIMEZONE } from "@barbearia/shared";

interface BarberItem {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface AppointmentDetail {
  id: string;
  start_time: string;
  end_time: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  profiles: {
    name: string;
    phone: string | null;
  } | null;
  barbers: {
    id: string;
    name: string;
  } | null;
  services: {
    name: string;
    duration_minutes: number;
  } | null;
}

export default function CalendarGridPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDetail[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Inicializa com a data de hoje no formato YYYY-MM-DD
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: RONDONIA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatter.format(now); // Formato YYYY-MM-DD local de Rondonia
  });

  // Controle do barbeiro selecionado em modo mobile
  const [activeMobileBarberId, setActiveMobileBarberId] = useState<string | null>(null);

  // Carregar barbeiros e agendamentos para o dia selecionado
  const fetchCalendarData = async () => {
    try {
      // 1. Buscar todos os barbeiros ativos
      const { data: barberData, error: barberError } = await supabase
        .from("barbers")
        .select("id, name, avatar_url")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (barberError) throw barberError;
      setBarbers(barberData || []);

      if (barberData && barberData.length > 0 && !activeMobileBarberId) {
        setActiveMobileBarberId((barberData as any[])[0].id);
      }

      // 2. Calcular intervalo de data correspondente à selectedDate no fuso de Rondônia
      const startLocal = `${selectedDate}T00:00:00`;
      const endLocal = `${selectedDate}T23:59:59`;
      const startDate = new Date(`${startLocal}-04:00`);
      const endDate = new Date(`${endLocal}-04:00`);

      // 3. Buscar agendamentos que iniciam no dia atual
      const { data: appData, error: appError } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          end_time,
          price,
          status,
          profiles (name, phone),
          barbers (id, name),
          services (name, duration_minutes)
        `)
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time", { ascending: true });

      if (appError) throw appError;
      setAppointments((appData || []) as any);
    } catch (err: any) {
      console.error("Erro ao carregar agenda:", err);
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        await fetchCalendarData();
      } catch (err) {
        console.error("Erro de autenticação no calendário:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router, selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  // Faixas Horárias de 08:00 às 18:00
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  // Altura do Slot de 1 hora = 100px (50px por 30 minutos)
  const slotHeight = 100;
  const halfSlotHeight = 50;

  // Função para calcular posição absoluta do card
  const getAppointmentPosition = (startTimeStr: string, endTimeStr: string) => {
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);

    // Ajustar para fuso horário de Rondônia (UTC -4) para cálculo
    const startHourLocal = start.getUTCHours() - 4 + start.getUTCMinutes() / 60;
    const endHourLocal = end.getUTCHours() - 4 + end.getUTCMinutes() / 60;

    const startDiff = startHourLocal - 8; // Início do expediente (08:00)
    const duration = endHourLocal - startHourLocal;

    return {
      top: Math.max(0, startDiff * slotHeight),
      height: Math.max(30, duration * slotHeight)
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">
            Carregando Agenda Visual...
          </span>
        </div>
      </div>
    );
  }

  // Filtrar agendamentos ativos (não cancelados) para o modo visual
  const activeAppointments = appointments.filter((app) => app.status !== "cancelled");

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none" />

      {/* Cabeçalho */}
      <Header activePage="calendar" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-8 flex flex-col">
        {/* Topo / Seletor de Data */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#27272a]/60 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Grade Horária</span>
            <h1 className="font-display text-3xl font-light text-white">Agenda Visual Live</h1>
          </div>

          {/* Controlador de Data */}
          <div className="flex items-center gap-2 bg-[#121215] border border-[#27272a] rounded-lg p-1.5 w-full sm:w-auto justify-between">
            <button
              onClick={handlePrevDay}
              className="text-[#a1a1aa] hover:text-white p-2 hover:bg-[#0a0a0c] rounded-md transition duration-150"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-center font-mono font-bold text-sm text-[#d4af37] outline-none cursor-pointer focus:text-white transition w-36"
            />
            <button
              onClick={handleNextDay}
              className="text-[#a1a1aa] hover:text-white p-2 hover:bg-[#0a0a0c] rounded-md transition duration-150"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>

        {barbers.length === 0 ? (
          <section className="bg-[#121215] border border-[#27272a] rounded-xl p-16 text-center text-slate-500 font-light text-sm flex-1">
            Nenhum barbeiro ativo cadastrado na equipe. Cadastre profissionais na tela de equipe para liberar a agenda visual.
          </section>
        ) : (
          <>
            {/* 1. SELETOR DE BARBEIROS - MODO MOBILE SOMENTE */}
            <section className="lg:hidden flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin">
              {barbers.map((barber) => {
                const isActive = activeMobileBarberId === barber.id;
                const barberApps = activeAppointments.filter((a) => a.barbers?.id === barber.id);

                return (
                  <button
                    key={barber.id}
                    onClick={() => setActiveMobileBarberId(barber.id)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex-shrink-0 ${
                      isActive
                        ? "bg-[#d4af37] text-black border-[#d4af37]"
                        : "bg-[#121215] text-[#a1a1aa] border-[#27272a] hover:border-[#d4af37]/35"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border border-black/10 overflow-hidden flex items-center justify-center bg-black/20">
                      {barber.avatar_url ? (
                        <img src={barber.avatar_url} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-mono text-[9px] font-bold">
                          {barber.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span>{barber.name.split(" ")[0]}</span>
                    <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${isActive ? "bg-black/25 text-black" : "bg-[#0a0a0c] text-slate-400"}`}>
                      {barberApps.length}
                    </span>
                  </button>
                );
              })}
            </section>

            {/* 2. TABELA DE GRADE HORÁRIA GERAL (CALENDAR SCROLLER CONTAINER) */}
            <section className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] flex-1 min-h-[500px]">
                {/* O grid tem largura flexível na web e fixa no mobile */}
                <div
                  className="relative select-none flex"
                  style={{
                    minWidth: "100%",
                    width: "max-content",
                    height: `${slotHeight * 10}px` // 10 faixas de horas (das 08h às 18h)
                  }}
                >
                  {/* COLUNA 0: Marcadores de Horas */}
                  <div className="w-16 bg-[#18181b]/50 border-r border-[#27272a] flex-shrink-0 sticky left-0 z-20 flex flex-col">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="border-b border-[#27272a]/30 text-[10px] font-mono text-slate-400 font-semibold flex items-start justify-center pt-2"
                        style={{ height: `${slotHeight}px` }}
                      >
                        {String(8 + i).padStart(2, "0")}:00
                      </div>
                    ))}
                  </div>

                  {/* 3. COLUNAS DE BARBEIROS (MODO DESKTOP / MODO MOBILE ADAPTATIVO) */}
                  <div className="flex-1 flex">
                    {barbers.map((barber) => {
                      const isMobileActive = activeMobileBarberId === barber.id;
                      const barberApps = activeAppointments.filter((a) => a.barbers?.id === barber.id);

                      return (
                        <div
                          key={barber.id}
                          className={`flex-col relative border-r border-[#27272a] w-72 lg:w-80 flex-shrink-0 ${
                            isMobileActive ? "flex" : "hidden lg:flex"
                          }`}
                        >
                          {/* Topo da Coluna: Cabeçalho do Barbeiro */}
                          <div className="bg-[#18181b]/35 border-b border-[#27272a] py-3.5 px-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                            <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">{barber.name}</span>
                            <span className="text-[10px] font-mono text-[#d4af37]">{barberApps.length} cortes</span>
                          </div>

                          {/* O Grid com as linhas de marcação */}
                          <div className="relative flex-1">
                            {/* Linhas de fundo de meia em meia hora */}
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div
                                key={i}
                                className="border-b border-[#27272a]/30 relative flex flex-col justify-end"
                                style={{ height: `${slotHeight}px` }}
                              >
                                <div className="absolute top-1/2 left-0 w-full border-b border-dashed border-[#27272a]/15 pointer-events-none" />
                              </div>
                            ))}

                            {/* Cartões dos Agendamentos */}
                            {barberApps.map((app) => {
                              const pos = getAppointmentPosition(app.start_time, app.end_time);
                              
                              // Obter horário local formatado de Rondônia
                              const startTimeLocal = formatToRondoniaTime(app.start_time).split(", ")[1];

                              return (
                                <div
                                  key={app.id}
                                  className={`absolute left-3 right-3 rounded-lg border p-3 flex flex-col justify-between overflow-hidden shadow-lg group hover:scale-[1.01] hover:z-10 transition duration-200 cursor-default ${
                                    app.status === "completed"
                                      ? "bg-green-950/20 border-green-500/40 hover:border-green-400 text-green-300"
                                      : app.status === "no_show"
                                      ? "bg-orange-950/20 border-orange-500/40 hover:border-orange-400 text-orange-300"
                                      : "bg-[#1e1a12] border-[#d4af37]/40 hover:border-[#d4af37] text-amber-200"
                                  }`}
                                  style={{
                                    top: `${pos.top + 6}px`,
                                    height: `${pos.height - 12}px`
                                  }}
                                >
                                  <div className="flex flex-col leading-tight">
                                    <span className="text-[10px] font-mono tracking-wider font-semibold opacity-75">
                                      {startTimeLocal} ({app.services?.duration_minutes} min)
                                    </span>
                                    <span className="text-xs font-bold text-white tracking-wide mt-1.5 truncate">
                                      {app.profiles?.name}
                                    </span>
                                    <span className="text-[9px] uppercase tracking-widest font-mono opacity-80 mt-0.5 truncate">
                                      {app.services?.name}
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-center text-[9px] font-mono pt-1">
                                    <span className="font-bold opacity-90">R$ {Number(app.price).toFixed(2)}</span>
                                    <span className="uppercase tracking-widest font-bold">
                                      {app.status === "completed" && "Concluído"}
                                      {app.status === "no_show" && "Falta"}
                                      {app.status === "scheduled" && "Agendado"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Rodapé */}
      <footer className="border-t border-[#27272a]/30 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>
    </div>
  );
}
