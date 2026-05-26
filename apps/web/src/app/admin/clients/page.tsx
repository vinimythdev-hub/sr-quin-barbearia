"use client";

import React from "react";
import Header from "@/components/Header";
import { useClientes } from "./hooks/useClientes";
import { PesquisaClientes } from "./componentes/PesquisaClientes";
import { TabelaClientes } from "./componentes/TabelaClientes";
import { FichaClienteCRM } from "./componentes/FichaClienteCRM";

export default function ClientsCRMPage() {
  const {
    carregando,
    consultaPesquisa,
    setConsultaPesquisa,
    clienteSelecionado,
    setClienteSelecionado,
    clientesFiltrados,
    aoExportarCSV,
  } = useClientes();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">
            Carregando CRM...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none" />

      {/* Cabeçalho */}
      <Header activePage="clients" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-8">
        
        {/* Topo / Título */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Base de Dados</span>
            <h1 className="font-display text-3xl font-light text-white">Central de Clientes & CRM</h1>
            <p className="text-xs text-slate-400 font-light">Estatísticas de fidelidade, histórico de visitas e controle de faltas.</p>
          </div>

          <button
            onClick={aoExportarCSV}
            disabled={clientesFiltrados.length === 0}
            className="w-full md:w-auto bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/20 disabled:text-black/55 text-black font-bold text-xs rounded-lg px-6 py-3 tracking-widest transition duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.15)] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            EXPORTAR CSV
          </button>
        </section>

        {/* Barra de Pesquisa */}
        <PesquisaClientes
          valor={consultaPesquisa}
          aoAlterar={setConsultaPesquisa}
        />

        {/* Tabela de Clientes */}
        <TabelaClientes
          clientes={clientesFiltrados}
          aoSelecionarCliente={setClienteSelecionado}
        />

      </main>

      {/* Drawer / Sidebar Lateral de CRM do Cliente */}
      {clienteSelecionado && (
        <FichaClienteCRM
          cliente={clienteSelecionado}
          aoFechar={() => setClienteSelecionado(null)}
        />
      )}

      {/* Rodapé */}
      <footer className="border-t border-[#27272a]/30 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>
    </div>
  );
}
