"use client";

import React from "react";
import Header from "@/components/Header";
import { useRelatorios } from "./hooks/useRelatorios";
import { FiltroPeriodo } from "./componentes/FiltroPeriodo";
import { MetricasFinanceiras } from "./componentes/MetricasFinanceiras";
import { TabelaComissoes } from "./componentes/TabelaComissoes";
import { TabelaComprovantes } from "./componentes/TabelaComprovantes";

export default function ReportsFinancePage() {
  const {
    carregando,
    agendamentos,
    dataInicial,
    setDataInicial,
    dataFinal,
    setDataFinal,
    aoAplicarFiltro,
    listaEstatisticasBarbeiros,
    faturamentoBruto,
    totalComissoes,
    lucroLiquido,
    aoExportarCSV,
    aoImprimirPDF,
  } = useRelatorios();

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
              Período: <span className="font-mono font-semibold text-slate-200 print-text-black">{dataInicial.split("-").reverse().join("/")}</span> até <span className="font-mono font-semibold text-slate-200 print-text-black">{dataFinal.split("-").reverse().join("/")}</span>
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-wrap gap-3 w-full sm:w-auto no-print">
            <button
              onClick={aoImprimirPDF}
              disabled={agendamentos.length === 0}
              className="flex-1 sm:flex-initial bg-transparent hover:bg-[#27272a] border border-[#27272a] hover:border-slate-400 text-white font-bold text-xs rounded-lg px-5 py-3 tracking-widest transition duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm5-14V4a2 2 0 114 0v10" />
              </svg>
              IMPRIMIR PDF
            </button>
            <button
              onClick={aoExportarCSV}
              disabled={agendamentos.length === 0}
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
        <FiltroPeriodo
          dataInicial={dataInicial}
          aoAlterarDataInicial={setDataInicial}
          dataFinal={dataFinal}
          aoAlterarDataFinal={setDataFinal}
          aoFiltrar={aoAplicarFiltro}
        />

        {carregando ? (
          <section className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">Consolidando dados...</span>
          </section>
        ) : (
          <>
            {/* 2. DASHBOARD DE MÉTRICAS OPERACIONAIS */}
            <MetricasFinanceiras
              faturamentoBruto={faturamentoBruto}
              totalComissoes={totalComissoes}
              lucroLiquido={lucroLiquido}
              quantidadeCortes={agendamentos.length}
            />

            {/* 3. RELATÓRIO INDIVIDUAR POR BARBEIRO */}
            <TabelaComissoes estatisticasBarbeiros={listaEstatisticasBarbeiros} />

            {/* 4. TABELA DE COMPROVANTES DOS CORTES REALIZADOS */}
            <TabelaComprovantes agendamentos={agendamentos} />
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
