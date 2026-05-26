import React from "react";
import { ServiceItem } from "../tipos";

interface FormularioCadastroProps {
  nome: string;
  aoAlterarNome: (v: string) => void;
  descricao: string;
  aoAlterarDescricao: (v: string) => void;
  preco: string;
  aoAlterarPreco: (v: string) => void;
  duracao: string;
  aoAlterarDuracao: (v: string) => void;
  carregandoEnvio: boolean;
  mensagemErro: string | null;
  aoEnviar: (e: React.FormEvent) => void;
}

export function FormularioCadastroServico({
  nome,
  aoAlterarNome,
  descricao,
  aoAlterarDescricao,
  preco,
  aoAlterarPreco,
  duracao,
  aoAlterarDuracao,
  carregandoEnvio,
  mensagemErro,
  aoEnviar,
}: FormularioCadastroProps) {
  return (
    <section className="bg-[#121215] border border-[#d4af37]/30 rounded-xl p-8 max-w-2xl mx-auto shadow-2xl animate-fade-in">
      <h3 className="text-lg font-semibold text-white tracking-wide mb-6 text-center">Cadastrar Novo Serviço</h3>

      {mensagemErro && (
        <div className="mb-6 p-4 rounded-lg bg-[#7f1d1d]/20 border border-[#b91c1c]/40 text-[#f87171] text-xs">
          ⚠️ {mensagemErro}
        </div>
      )}

      <form onSubmit={aoEnviar} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Nome do Serviço</label>
          <input
            type="text"
            required
            placeholder="Ex: Corte Degradê + Barba Completa"
            value={nome}
            onChange={(e) => aoAlterarNome(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Preço (R$)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ex: 50.00"
              value={preco}
              onChange={(e) => aoAlterarPreco(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Duração (Minutos)</label>
            <input
              type="number"
              required
              placeholder="Ex: 45"
              value={duracao}
              onChange={(e) => aoAlterarDuracao(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Descrição (Opcional)</label>
          <textarea
            rows={3}
            placeholder="Ex: Lavagem com shampoo premium, corte com acabamento navalhado e aplicação de pomada finalizadora modeladora."
            value={descricao}
            onChange={(e) => aoAlterarDescricao(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={carregandoEnvio}
          className="w-full bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black font-bold text-xs py-3.5 rounded-lg tracking-widest transition duration-300 shadow-lg"
        >
          {carregandoEnvio ? "CADASTRANDO..." : "CADASTRAR SERVIÇO"}
        </button>
      </form>
    </section>
  );
}

interface ModalEdicaoProps {
  servicoSelecionado: ServiceItem;
  nome: string;
  aoAlterarNome: (v: string) => void;
  descricao: string;
  aoAlterarDescricao: (v: string) => void;
  preco: string;
  aoAlterarPreco: (v: string) => void;
  duracao: string;
  aoAlterarDuracao: (v: string) => void;
  carregandoEnvio: boolean;
  mensagemErro: string | null;
  aoEnviar: (e: React.FormEvent) => void;
  aoFechar: () => void;
}

export function ModalEdicaoServico({
  servicoSelecionado,
  nome,
  aoAlterarNome,
  descricao,
  aoAlterarDescricao,
  preco,
  aoAlterarPreco,
  duracao,
  aoAlterarDuracao,
  carregandoEnvio,
  mensagemErro,
  aoEnviar,
  aoFechar,
}: ModalEdicaoProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-[#121215] border border-[#d4af37]/30 rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-[#27272a]/60 pb-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">AJUSTE DE CATÁLOGO</span>
            <h3 className="text-lg font-semibold text-white tracking-wide mt-1">Editar Serviço</h3>
          </div>
          <button onClick={aoFechar} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {mensagemErro && (
          <div className="p-3.5 bg-red-950/20 border border-red-500/35 rounded-lg text-red-400 text-xs">
            ⚠️ {mensagemErro}
          </div>
        )}

        <form onSubmit={aoEnviar} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Nome do Serviço</label>
            <input
              type="text"
              required
              placeholder="Ex: Corte Degradê + Barba Completa"
              value={nome}
              onChange={(e) => aoAlterarNome(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ex: 50.00"
                value={preco}
                onChange={(e) => aoAlterarPreco(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Duração (Minutos)</label>
              <input
                type="number"
                required
                placeholder="Ex: 45"
                value={duracao}
                onChange={(e) => aoAlterarDuracao(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Descrição (Opcional)</label>
            <textarea
              rows={3}
              placeholder="Ex: Descrição detalhada do corte..."
              value={descricao}
              onChange={(e) => aoAlterarDescricao(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#27272a]/60">
            <button
              type="button"
              onClick={aoFechar}
              className="flex-1 bg-transparent hover:bg-[#27272a]/40 border border-[#27272a] text-[#a1a1aa] hover:text-white text-xs font-semibold py-3.5 rounded-lg tracking-widest uppercase transition duration-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={carregandoEnvio}
              className="flex-1 bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black text-xs font-bold py-3.5 rounded-lg tracking-widest uppercase transition duration-300 shadow-lg"
            >
              {carregandoEnvio ? "SALVANDO..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
