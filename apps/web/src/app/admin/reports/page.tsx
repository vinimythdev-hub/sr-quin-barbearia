"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { formatToRondoniaTime, RONDONIA_TIMEZONE } from "@barbearia/shared";

interface BarberItem {
  id: string;
  name: string;
  commission_rate: number;
}

interface AppointmentDetail {
  id: string;
  start_time: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  profiles: {
    name: string;
  } | null;
  barbers: {
    id: string;
    name: string;
    commission_rate: number;
  } | null;
  services: {
    name: string;
  } | null;
}

interface BarberStat {
  id: string;
  name: string;
  rate: number;
  cutsCount: number;
  totalRevenue: number;
  totalCommission: number;
}

export default function ReportsFinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDetail[]>([]);

  // Filtros de Data
  const [startDate, setStartDate] = useState<string>(() => {
    // Início do mês atual
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    // Hoje
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  // Carregar dados contábeis
  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      // 1. Carregar barbeiros para inicializar a lista de estatísticas
      const { data: barberData, error: barberError } = await supabase
        .from("barbers")
        .select("id, name, commission_rate");

      if (barberError) throw barberError;
      setBarbers(barberData || []);

      // 2. Carregar agendamentos concluídos no período
      const startLocal = `${startDate}T00:00:00`;
      const endLocal = `${endDate}T23:59:59`;
      const startISO = new Date(`${startLocal}-04:00`).toISOString();
      const endISO = new Date(`${endLocal}-04:00`).toISOString();

      const { data: appData, error: appError } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          price,
          status,
          profiles (name),
          barbers (id, name, commission_rate),
          services (name)
        `)
        .gte("start_time", startISO)
        .lte("start_time", endISO)
        .eq("status", "completed")
        .order("start_time", { ascending: false });

      if (appError) throw appError;
      setAppointments((appData || []) as any);
    } catch (err: any) {
      console.error("Erro ao carregar relatório financeiro:", err);
    } finally {
      setLoading(false);
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

        await fetchFinanceData();
      } catch (err) {
        console.error("Erro de autenticação no financeiro:", err);
        router.push("/login");
      }
    };

    checkAuthAndFetch();
  }, [router]);

  const handleApplyFilter = () => {
    fetchFinanceData();
  };

  // Agregações por barbeiro
  const barberStatsMap: { [id: string]: BarberStat } = {};

  // Inicializa todos os barbeiros
  barbers.forEach((b) => {
    barberStatsMap[b.id] = {
      id: b.id,
      name: b.name,
      rate: Number(b.commission_rate),
      cutsCount: 0,
      totalRevenue: 0,
      totalCommission: 0
    };
  });

  // Calcula com base nos agendamentos
  appointments.forEach((app) => {
    const barberId = app.barbers?.id;
    if (!barberId) return;

    if (!barberStatsMap[barberId]) {
      barberStatsMap[barberId] = {
        id: barberId,
        name: app.barbers?.name || "Barbeiro Inativo",
        rate: Number(app.barbers?.commission_rate || 0),
        cutsCount: 0,
        totalRevenue: 0,
        totalCommission: 0
      };
    }

    const stat = barberStatsMap[barberId];
    stat.cutsCount += 1;
    stat.totalRevenue += Number(app.price);
    stat.totalCommission += Number(app.price) * stat.rate;
  });

  const barberStatsList = Object.values(barberStatsMap).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Totais Gerais
  const totalRevenue = appointments.reduce((sum, a) => sum + Number(a.price), 0);
  const totalCommissions = barberStatsList.reduce((sum, b) => sum + b.totalCommission, 0);
  const netProfit = totalRevenue - totalCommissions;

  // Exportar dados para CSV
  const handleExportCSV = () => {
    if (appointments.length === 0) return;

    // Cabeçalhos do CSV
    const headers = [
      "ID Agendamento",
      "Data/Hora (Rondônia)",
      "Cliente",
      "Barbeiro",
      "Serviço",
      "Valor do Serviço (R$)",
      "Taxa de Comissão Barbeiro (%)",
      "Comissão Paga (R$)",
      "Lucro Líquido Barbearia (R$)"
    ];

    // Linhas correspondentes
    const rows = appointments.map((app) => {
      const barberName = app.barbers?.name || "Sem Barbeiro";
      const serviceName = app.services?.name || "Sem Serviço";
      const clientName = app.profiles?.name || "Sem Cliente";
      const dateFormatted = formatToRondoniaTime(app.start_time);
      const price = Number(app.price);
      const rate = Number(app.barbers?.commission_rate || 0);
      const commission = price * rate;
      const profit = price - commission;

      return [
        `"${app.id}"`,
        `"${dateFormatted}"`,
        `"${clientName}"`,
        `"${barberName}"`,
        `"${serviceName}"`,
        price.toFixed(2),
        `"${(rate * 100).toFixed(0)}%"`,
        commission.toFixed(2),
        profit.toFixed(2)
      ];
    });

    // Resumo no final do arquivo CSV
    const summaryRows = [
      [],
      ["RESUMO FINANCEIRO DO PERÍODO"],
      ["Intervalo de Datas", `"${startDate} a ${endDate}"`],
      ["Faturamento Bruto Total", `"${totalRevenue.toFixed(2)}"`],
      ["Total de Comissões Pagas", `"${totalCommissions.toFixed(2)}"`],
      ["Lucro Líquido da Barbearia", `"${netProfit.toFixed(2)}"`],
      ["Total de Cortes Concluídos", appointments.length]
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [
        headers.join(","),
        ...rows.map((e) => e.join(",")),
        ...summaryRows.map((e) => e.join(","))
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sr_quin_relatorio_financeiro_${startDate}_a_${endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Acionar impressão e geração de PDF nativa
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none no-print" />

      {/* Regras CSS nativas para Impressão/PDF limpo */}
      <style>{`
        @media print {
          header, footer, .no-print, button, input {
            display: none !important;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            color: black !important;
          }
          .print-full-width {
            width: 100% !important;
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .print-card-white {
            background: white !important;
            border: 1px solid #d1d5db !important;
            color: black !important;
            box-shadow: none !important;
          }
          .print-text-black {
            color: black !important;
          }
          .print-text-gold {
            color: #b45309 !important; /* Dourado escuro para contraste no papel */
            font-weight: bold !important;
          }
          .print-table {
            border: 1px solid #d1d5db !important;
          }
          .print-table th {
            background: #f3f4f6 !important;
            color: black !important;
            border-bottom: 1px solid #d1d5db !important;
          }
          .print-table td {
            color: #374151 !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
        }
      `}</style>

      {/* Cabeçalho */}
      <div className="no-print">
        <Header activePage="reports" />
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-8 print-full-width print-text-black">
        {/* Topo / Cabeçalho da tela */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#27272a]/60 print-full-width">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold no-print">Área Contábil</span>
            <span className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold hidden print:inline">RELATÓRIO FINANCEIRO OFICIAL</span>
            <h1 className="font-display text-3xl font-light text-white print-text-black">Relatórios & Comissões</h1>
            <p className="text-xs text-slate-400 font-light print-text-black">
              Período: <span className="font-mono font-semibold text-slate-200 print-text-black">{startDate.split("-").reverse().join("/")}</span> até <span className="font-mono font-semibold text-slate-200 print-text-black">{endDate.split("-").reverse().join("/")}</span>
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 w-full sm:w-auto no-print">
            <button
              onClick={handlePrintPDF}
              disabled={appointments.length === 0}
              className="flex-1 sm:flex-initial bg-transparent hover:bg-[#27272a] border border-[#27272a] hover:border-slate-400 text-white font-bold text-xs rounded-lg px-5 py-3 tracking-widest transition duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm5-14V4a2 2 0 114 0v10" />
              </svg>
              IMPRIMIR PDF
            </button>
            <button
              onClick={handleExportCSV}
              disabled={appointments.length === 0}
              className="flex-1 sm:flex-initial bg-[#d4af37] hover:bg-[#c5a130] text-black font-bold text-xs rounded-lg px-5 py-3 tracking-widest transition duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.15)] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              EXPORTAR CSV
            </button>
          </div>
        </section>

        {/* 1. SELETOR DE PERÍODO (BARRA DE FILTROS) */}
        <section className="bg-[#121215] border border-[#27272a] rounded-xl p-6 no-print">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Data Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-2.5 outline-none transition font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Data Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-2.5 outline-none transition font-mono"
                />
              </div>
            </div>
            <button
              onClick={handleApplyFilter}
              className="bg-[#27272a] hover:bg-[#3f3f46] text-white font-bold text-xs py-3 rounded-lg px-8 tracking-widest uppercase transition duration-300 w-full sm:w-auto"
            >
              Aplicar Filtro
            </button>
          </div>
        </section>

        {loading ? (
          <section className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">Consolidando dados...</span>
          </section>
        ) : (
          <>
            {/* 2. DASHBOARD DE MÉTRICAS OPERACIONAIS */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Card 1: Faturamento Bruto */}
              <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 space-y-4 hover:border-[#d4af37]/20 transition duration-300 print-card-white">
                <div className="flex justify-between items-center no-print">
                  <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Faturamento Bruto</span>
                  <svg className="w-5 h-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold hidden print:inline">Faturamento Bruto</span>
                  <h4 className="text-3xl font-bold text-white font-mono print-text-black mt-1">
                    R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h4>
                  <p className="text-[9px] text-green-400 mt-1 print-text-black">
                    ✓ {appointments.length} cortes concluídos no total
                  </p>
                </div>
              </div>

              {/* Card 2: Total Comissões */}
              <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 space-y-4 hover:border-[#d4af37]/20 transition duration-300 print-card-white">
                <div className="flex justify-between items-center no-print">
                  <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Repasse Comissões</span>
                  <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold hidden print:inline">Repasse Comissões</span>
                  <h4 className="text-3xl font-bold text-orange-400 print-text-black mt-1">
                    R$ {totalCommissions.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h4>
                  <p className="text-[9px] text-slate-400 mt-1 print-text-black">
                    Com base no percentual de cada barbeiro
                  </p>
                </div>
              </div>

              {/* Card 3: Lucro Líquido */}
              <div className="bg-[#121215] border border-[#d4af37]/30 rounded-xl p-6 space-y-4 hover:border-[#d4af37]/50 transition duration-300 print-card-white">
                <div className="flex justify-between items-center no-print">
                  <span className="text-[10px] uppercase tracking-wider text-[#d4af37] font-semibold">Lucro Líquido Loja</span>
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold hidden print:inline">Lucro Líquido Loja</span>
                  <h4 className="text-3xl font-bold text-white print-text-gold mt-1">
                    R$ {netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h4>
                  <p className="text-[9px] text-green-400 mt-1 print-text-black">
                    ✓ Líquido disponível para a administração
                  </p>
                </div>
              </div>
            </section>

            {/* 3. RELATÓRIO INDIVIDUAR POR BARBEIRO */}
            <section className="space-y-4 print-full-width">
              <h3 className="font-display text-lg font-semibold tracking-wide text-white print-text-black">
                Comissão Acumulada por Profissional
              </h3>

              <div className="bg-[#121215] border border-[#27272a]/70 rounded-xl overflow-hidden shadow-xl print-table">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa] font-mono">
                      <th className="py-4 px-6">Barbeiro</th>
                      <th className="py-4 px-6 text-center">Taxa Comissão</th>
                      <th className="py-4 px-6 text-center">Quantidade Cortes</th>
                      <th className="py-4 px-6 text-right">Faturamento Gerado</th>
                      <th className="py-4 px-6 text-right">Comissão Devida</th>
                      <th className="py-4 px-6 text-right">Lucro Loja (Líquido)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/50 text-sm font-light">
                    {barberStatsList.map((stat) => {
                      const shopProfit = stat.totalRevenue - stat.totalCommission;
                      return (
                        <tr key={stat.id} className="hover:bg-[#18181b]/20 transition duration-150">
                          <td className="py-4 px-6 font-semibold text-slate-200 print-text-black">
                            {stat.name}
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-slate-300">
                            {(stat.rate * 100).toFixed(0)}%
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-slate-300">
                            {stat.cutsCount} cortes
                          </td>
                          <td className="py-4 px-6 text-right font-mono text-slate-300">
                            R$ {stat.totalRevenue.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-right font-mono text-orange-400 font-semibold">
                            R$ {stat.totalCommission.toFixed(2)}
                          </td>
                          <td className="py-4 px-6 text-right font-mono text-green-400 font-semibold print-text-gold">
                            R$ {shopProfit.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* 4. TABELA DE COMPROVANTES DOS CORTES REALIZADOS */}
            <section className="space-y-4 print-full-width">
              <h3 className="font-display text-lg font-semibold tracking-wide text-white print-text-black">
                Comprovantes e Histórico Consolidado
              </h3>

              <div className="bg-[#121215] border border-[#27272a]/70 rounded-xl overflow-hidden shadow-xl print-table">
                {appointments.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-light text-sm">
                    Nenhum agendamento concluído encontrado no período.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa] font-mono">
                          <th className="py-4 px-6">Data</th>
                          <th className="py-4 px-6">Cliente</th>
                          <th className="py-4 px-6">Barbeiro</th>
                          <th className="py-4 px-6">Serviço</th>
                          <th className="py-4 px-6 text-right">Valor Pago</th>
                          <th className="py-4 px-6 text-right">Comissão</th>
                          <th className="py-4 px-6 text-right">Lucro Loja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a]/50 text-sm font-light">
                        {appointments.map((app) => {
                          const dateLocal = formatToRondoniaTime(app.start_time).split(", ")[0];
                          const hourLocal = formatToRondoniaTime(app.start_time).split(", ")[1];
                          const price = Number(app.price);
                          const rate = Number(app.barbers?.commission_rate || 0);
                          const commission = price * rate;
                          const profit = price - commission;

                          return (
                            <tr key={app.id} className="hover:bg-[#18181b]/20 transition duration-150">
                              <td className="py-4 px-6 font-mono text-slate-300">
                                <div className="flex flex-col">
                                  <span>{dateLocal}</span>
                                  <span className="text-[10px] text-slate-500 mt-0.5">{hourLocal}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-slate-200 font-medium">
                                {app.profiles?.name || "Sem Cliente"}
                              </td>
                              <td className="py-4 px-6 text-slate-300">
                                {app.barbers?.name || "Inativo"}
                              </td>
                              <td className="py-4 px-6 text-slate-300">
                                {app.services?.name}
                              </td>
                              <td className="py-4 px-6 text-right font-mono text-slate-200">
                                R$ {price.toFixed(2)}
                              </td>
                              <td className="py-4 px-6 text-right font-mono text-orange-400">
                                <div className="flex flex-col">
                                  <span>R$ {commission.toFixed(2)}</span>
                                  <span className="text-[9px] text-slate-500">({(rate * 100).toFixed(0)}%)</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right font-mono text-green-400 print-text-gold">
                                R$ {profit.toFixed(2)}
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
          </>
        )}
      </main>

      {/* Rodapé */}
      <footer className="border-t border-[#27272a]/30 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto no-print">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>
    </div>
  );
}
