"use client";

import React from "react";
import Header from "@/components/Header";
import { useAgenda } from "./hooks/useAgenda";
import { ControladorData } from "./componentes/ControladorData";
import { FiltroBarbeiroMobile } from "./componentes/FiltroBarbeiroMobile";
import { GradeHoraria } from "./componentes/GradeHoraria";

export default function CalendarGridPage() {
  const {
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
    alturaSlot,
    obterPosicaoAgendamento,
    obterPosicaoAlmoco,
  } = useAgenda();

  if (carregando) {
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
  const agendamentosAtivos = agendamentos.filter((app) => app.status !== "cancelled");

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
          <ControladorData
            dataSelecionada={dataSelecionada}
            aoAlterarData={setDataSelecionada}
            aoDiaAnterior={aoDiaAnterior}
            aoProximoDia={aoProximoDia}
          />
        </section>

        {barbeiros.length === 0 ? (
          <section className="bg-[#121215] border border-[#27272a] rounded-xl p-16 text-center text-slate-500 font-light text-sm flex-1">
            Nenhum barbeiro ativo cadastrado na equipe. Cadastre profissionais na tela de equipe para liberar a agenda visual.
          </section>
        ) : (
          <>
            {/* 1. SELETOR DE BARBEIROS - MODO MOBILE SOMENTE */}
            <FiltroBarbeiroMobile
              barbeiros={barbeiros}
              idBarbeiroMovelAtivo={idBarbeiroMovelAtivo}
              aoSelecionarBarbeiro={setIdBarbeiroMovelAtivo}
              agendamentosAtivos={agendamentosAtivos}
            />

            {/* 2. TABELA DE GRADE HORÁRIA GERAL */}
            <GradeHoraria
              barbeiros={barbeiros}
              agendamentosAtivos={agendamentosAtivos}
              idBarbeiroMovelAtivo={idBarbeiroMovelAtivo}
              escalasBarbeiros={escalasBarbeiros}
              alturaSlot={alturaSlot}
              obterPosicaoAgendamento={obterPosicaoAgendamento}
              obterPosicaoAlmoco={obterPosicaoAlmoco}
            />
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
