"use client";

import React from "react";
import Header from "@/components/Header";
import { useServicos } from "./hooks/useServicos";
import { FormularioCadastroServico, ModalEdicaoServico } from "./componentes/FormularioServico";
import { ListaServicos } from "./componentes/ListaServicos";

export default function ServicesPage() {
  const {
    carregando,
    servicos,
    exibirFormularioCadastro,
    setExibirFormularioCadastro,
    nome,
    setNome,
    descricao,
    setDescricao,
    preco,
    setPreco,
    duracao,
    setDuracao,
    carregandoEnvio,
    mensagemErro,
    servicoSelecionadoParaEdicao,
    exibirFormularioEdicao,
    setExibirFormularioEdicao,
    nomeEdicao,
    setNomeEdicao,
    descricaoEdicao,
    setDescricaoEdicao,
    precoEdicao,
    setPrecoEdicao,
    duracaoEdicao,
    setDuracaoEdicao,
    mensagemErroEdicao,
    aoEnviarCadastro,
    aoAlternarAtivo,
    aoAbrirEdicao,
    aoEnviarEdicao,
  } = useServicos();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">
            Carregando Catálogo...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none" />

      {/* Barra de Navegação Premium Responsiva */}
      <Header activePage="services" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-10">
        
        {/* Cabeçalho da Seção */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Gerenciamento</span>
            <h1 className="font-display text-3xl font-light text-white">Catálogo de Serviços</h1>
            <p className="text-xs text-slate-400 font-light">Crie e configure todos os cortes, tratamentos e serviços oferecidos.</p>
          </div>
          <button
            onClick={() => setExibirFormularioCadastro(!exibirFormularioCadastro)}
            className="bg-[#d4af37] hover:bg-[#c5a130] text-black font-bold text-xs rounded-lg px-6 py-3 tracking-widest transition duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)]"
          >
            {exibirFormularioCadastro ? "CANCELAR" : "NOVO SERVIÇO"}
          </button>
        </section>

        {/* Formulário de Cadastro (Efeito Acordeão) */}
        {exibirFormularioCadastro && (
          <FormularioCadastroServico
            nome={nome}
            aoAlterarNome={setNome}
            descricao={descricao}
            aoAlterarDescricao={setDescricao}
            preco={preco}
            aoAlterarPreco={setPreco}
            duracao={duracao}
            aoAlterarDuracao={setDuracao}
            carregandoEnvio={carregandoEnvio}
            mensagemErro={mensagemErro}
            aoEnviar={aoEnviarCadastro}
          />
        )}

        {/* Grid de Serviços Existentes */}
        <ListaServicos
          servicos={servicos}
          aoAlternarAtivo={aoAlternarAtivo}
          aoEditar={aoAbrirEdicao}
        />

      </main>

      {/* Modal de Edição de Serviço */}
      {exibirFormularioEdicao && servicoSelecionadoParaEdicao && (
        <ModalEdicaoServico
          servicoSelecionado={servicoSelecionadoParaEdicao}
          nome={nomeEdicao}
          aoAlterarNome={setNomeEdicao}
          descricao={descricaoEdicao}
          aoAlterarDescricao={setDescricaoEdicao}
          preco={precoEdicao}
          aoAlterarPreco={setPrecoEdicao}
          duracao={duracaoEdicao}
          aoAlterarDuracao={setDuracaoEdicao}
          carregandoEnvio={carregandoEnvio}
          mensagemErro={mensagemErroEdicao}
          aoEnviar={aoEnviarEdicao}
          aoFechar={() => setExibirFormularioEdicao(false)}
        />
      )}

      {/* Rodapé */}
      <footer className="border-t border-[#27272a]/30 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>
    </div>
  );
}
