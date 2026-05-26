"use client";

import React from "react";
import Header from "@/components/Header";
import { useBarbeiros } from "./hooks/useBarbeiros";
import { FormularioCadastroBarbeiro, ModalEdicaoBarbeiro } from "./componentes/FormularioBarbeiro";
import { ListaBarbeiros } from "./componentes/ListaBarbeiros";
import { ModalEscala } from "./componentes/ModalEscala";

export default function BarbersPage() {
  const {
    carregando,
    barbeiros,
    exibirFormularioCadastro,
    setExibirFormularioCadastro,
    nome,
    setNome,
    bio,
    setBio,
    comissao,
    setComissao,
    urlAvatar,
    setUrlAvatar,
    carregandoEnvio,
    mensagemErro,
    barbeiroSelecionadoParaEscala,
    setBarbeiroSelecionadoParaEscala,
    exibirModalEscala,
    setExibirModalEscala,
    escalaModal,
    setEscalaModal,
    carregandoModal,
    erroModal,
    barbeiroSelecionadoParaEdicao,
    setBarbeiroSelecionadoParaEdicao,
    exibirFormularioEdicao,
    setExibirFormularioEdicao,
    nomeEdicao,
    setNomeEdicao,
    bioEdicao,
    setBioEdicao,
    comissaoEdicao,
    setComissaoEdicao,
    urlAvatarEdicao,
    setUrlAvatarEdicao,
    mensagemErroEdicao,
    aoEnviarCadastro,
    aoAlternarAtivo,
    aoAbrirEscala,
    aoSalvarEscala,
    aoAbrirEdicao,
    aoEnviarEdicao,
  } = useBarbeiros();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">
            Carregando Equipe...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none" />

      {/* Barra de Navegação Premium Responsiva */}
      <Header activePage="barbers" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-10">
        
        {/* Cabeçalho */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Equipe de Elite</span>
            <h1 className="font-display text-3xl font-light text-white">Nossos Barbeiros</h1>
            <p className="text-xs text-slate-400 font-light">Gerencie os profissionais, comissões de serviço e horários de expediente.</p>
          </div>
          <button
            onClick={() => setExibirFormularioCadastro(!exibirFormularioCadastro)}
            className="bg-[#d4af37] hover:bg-[#c5a130] text-black font-bold text-xs rounded-lg px-6 py-3 tracking-widest transition duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)]"
          >
            {exibirFormularioCadastro ? "CANCELAR" : "NOVO BARBEIRO"}
          </button>
        </section>

        {/* Formulário de Cadastro (Efeito Acordeão) */}
        {exibirFormularioCadastro && (
          <FormularioCadastroBarbeiro
            nome={nome}
            aoAlterarNome={setNome}
            comissao={comissao}
            aoAlterarComissao={setComissao}
            urlAvatar={urlAvatar}
            aoAlterarUrlAvatar={setUrlAvatar}
            bio={bio}
            aoAlterarBio={setBio}
            carregandoEnvio={carregandoEnvio}
            mensagemErro={mensagemErro}
            aoEnviar={aoEnviarCadastro}
          />
        )}

        {/* Grid de Barbeiros Existentes */}
        <ListaBarbeiros
          barbeiros={barbeiros}
          aoAlternarAtivo={aoAlternarAtivo}
          aoEditar={aoAbrirEdicao}
          aoAbrirEscala={aoAbrirEscala}
        />

      </main>

      {/* Modal de Escala de Trabalho (Shifts Editor) */}
      {exibirModalEscala && barbeiroSelecionadoParaEscala && (
        <ModalEscala
          barbeiroSelecionado={barbeiroSelecionadoParaEscala}
          escala={escalaModal}
          aoAlterarEscala={setEscalaModal}
          carregando={carregandoModal}
          erro={erroModal}
          aoSalvar={aoSalvarEscala}
          aoFechar={() => {
            setExibirModalEscala(false);
            setBarbeiroSelecionadoParaEscala(null);
          }}
        />
      )}

      {/* Modal de Edição de Cadastro do Barbeiro */}
      {exibirFormularioEdicao && barbeiroSelecionadoParaEdicao && (
        <ModalEdicaoBarbeiro
          barbeiroSelecionado={barbeiroSelecionadoParaEdicao}
          nome={nomeEdicao}
          aoAlterarNome={setNomeEdicao}
          comissao={comissaoEdicao}
          aoAlterarComissao={setComissaoEdicao}
          urlAvatar={urlAvatarEdicao}
          aoAlterarUrlAvatar={setUrlAvatarEdicao}
          bio={bioEdicao}
          aoAlterarBio={setBioEdicao}
          carregandoEnvio={carregandoEnvio}
          mensagemErro={mensagemErroEdicao}
          aoEnviar={aoEnviarEdicao}
          aoFechar={() => {
            setExibirFormularioEdicao(false);
            setBarbeiroSelecionadoParaEdicao(null);
          }}
        />
      )}

      {/* Rodapé */}
      <footer className="border-t border-[#27272a]/30 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>
    </div>
  );
}
