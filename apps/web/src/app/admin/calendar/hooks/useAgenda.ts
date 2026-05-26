import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BarberItem, AppointmentDetail } from "../tipos";
import { RONDONIA_TIMEZONE } from "@barbearia/shared";

export function useAgenda() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [barbeiros, setBarbeiros] = useState<BarberItem[]>([]);
  const [agendamentos, setAgendamentos] = useState<AppointmentDetail[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState<string>(() => {
    // Inicializa com a data de hoje no formato YYYY-MM-DD local de Rondônia
    const agora = new Date();
    const formatador = new Intl.DateTimeFormat("en-CA", {
      timeZone: RONDONIA_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    return formatador.format(agora);
  });

  const [idBarbeiroMovelAtivo, setIdBarbeiroMovelAtivo] = useState<string | null>(null);
  const [escalasBarbeiros, setEscalasBarbeiros] = useState<any[]>([]);

  const buscarDadosAgenda = async () => {
    try {
      // 1. Buscar todos os barbeiros ativos
      const { data: dadosBarbeiros, error: erroBarbeiros } = await supabase
        .from("barbers")
        .select("id, name, avatar_url")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (erroBarbeiros) throw erroBarbeiros;
      setBarbeiros(dadosBarbeiros || []);

      if (dadosBarbeiros && dadosBarbeiros.length > 0 && !idBarbeiroMovelAtivo) {
        setIdBarbeiroMovelAtivo((dadosBarbeiros as any[])[0].id);
      }

      // Buscar escalas de trabalho (com almoço) para o dia da semana selecionado
      try {
        const objetoData = new Date(`${dataSelecionada}T12:00:00`);
        const diaSemana = objetoData.getDay();

        const { data: dadosEscalas, error: erroEscalas } = await supabase
          .from("barber_work_hours")
          .select("barber_id, start_time, end_time, lunch_start, lunch_end")
          .eq("day_of_week", diaSemana);

        if (erroEscalas) throw erroEscalas;
        setEscalasBarbeiros(dadosEscalas || []);
      } catch (erroEscala) {
        console.error("Erro ao carregar escala de almoço:", erroEscala);
        setEscalasBarbeiros([]);
      }

      // 2. Calcular intervalo de data correspondente à dataSelecionada no fuso de Rondônia
      const inicioLocal = `${dataSelecionada}T00:00:00`;
      const fimLocal = `${dataSelecionada}T23:59:59`;
      const dataInicio = new Date(`${inicioLocal}-04:00`);
      const dataFim = new Date(`${fimLocal}-04:00`);

      // 3. Buscar agendamentos que iniciam no dia atual
      const { data: dadosAgendamentos, error: erroAgendamentos } = await supabase
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
        .gte("start_time", dataInicio.toISOString())
        .lte("start_time", dataFim.toISOString())
        .order("start_time", { ascending: true });

      if (erroAgendamentos) throw erroAgendamentos;
      setAgendamentos((dadosAgendamentos || []) as any);
    } catch (err: any) {
      console.error("Erro ao carregar agenda:", err);
    }
  };

  useEffect(() => {
    const verificarAutenticacaoEBuscar = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        await buscarDadosAgenda();
      } catch (err) {
        console.error("Erro de autenticação no calendário:", err);
        router.push("/login");
      } finally {
        setCarregando(false);
      }
    };

    verificarAutenticacaoEBuscar();
  }, [router, dataSelecionada]);

  const aoDiaAnterior = () => {
    const d = new Date(`${dataSelecionada}T12:00:00`);
    d.setDate(d.getDate() - 1);
    setDataSelecionada(d.toISOString().split("T")[0]);
  };

  const aoProximoDia = () => {
    const d = new Date(`${dataSelecionada}T12:00:00`);
    d.setDate(d.getDate() + 1);
    setDataSelecionada(d.toISOString().split("T")[0]);
  };

  // Faixas Horárias de 08:00 às 18:00
  const slotsHorarios = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00"
  ];

  const alturaSlot = 100;

  // Função para calcular posição absoluta do card
  const obterPosicaoAgendamento = (startTimeStr: string, endTimeStr: string) => {
    const start = new Date(startTimeStr);
    const end = new Date(endTimeStr);

    // Ajustar para fuso horário de Rondônia (UTC -4) para cálculo
    const startHourLocal = start.getUTCHours() - 4 + start.getUTCMinutes() / 60;
    const endHourLocal = end.getUTCHours() - 4 + end.getUTCMinutes() / 60;

    const startDiff = startHourLocal - 8; // Início do expediente (08:00)
    const duration = endHourLocal - startHourLocal;

    return {
      top: Math.max(0, startDiff * alturaSlot),
      height: Math.max(30, duration * alturaSlot)
    };
  };

  const obterPosicaoAlmoco = (lunchStart: string, lunchEnd: string) => {
    const [startH, startM] = lunchStart.split(":").map(Number);
    const [endH, endM] = lunchEnd.split(":").map(Number);

    const startHourLocal = startH + startM / 60;
    const endHourLocal = endH + endM / 60;

    const startDiff = startHourLocal - 8; // Início do expediente (08:00)
    const duration = endHourLocal - startHourLocal;

    return {
      top: Math.max(0, startDiff * alturaSlot),
      height: Math.max(30, duration * alturaSlot)
    };
  };

  return {
    carregando,
    barbeiros,
    agendamentos,
    dataSelecionada,
    setDataSelecionada,
    idBarbeiroMovelAtivo,
    setIdBarbeiroMovelAtivo,
    escalasBarbeiros,
    aoDiaAnterior,
    aoProximoDia,
    slotsHorarios,
    alturaSlot,
    obterPosicaoAgendamento,
    obterPosicaoAlmoco,
  };
}
