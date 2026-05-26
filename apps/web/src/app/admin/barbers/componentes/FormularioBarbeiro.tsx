import React from "react";
import { BarberItem } from "../tipos";

interface FormularioCadastroProps {
  nome: string;
  aoAlterarNome: (v: string) => void;
  comissao: string;
  aoAlterarComissao: (v: string) => void;
  urlAvatar: string;
  aoAlterarUrlAvatar: (v: string) => void;
  bio: string;
  aoAlterarBio: (v: string) => void;
  carregandoEnvio: boolean;
  mensagemErro: string | null;
  aoEnviar: (e: React.FormEvent) => void;
}

export function FormularioCadastroBarbeiro({
  nome,
  aoAlterarNome,
  comissao,
  aoAlterarComissao,
  urlAvatar,
  aoAlterarUrlAvatar,
  bio,
  aoAlterarBio,
  carregandoEnvio,
  mensagemErro,
  aoEnviar,
}: FormularioCadastroProps) {
  return (
    <section className="bg-[#121215] border border-[#d4af37]/30 rounded-xl p-8 max-w-2xl mx-auto shadow-2xl animate-fade-in">
      <h3 className="text-lg font-semibold text-white tracking-wide mb-6 text-center">Cadastrar Novo Barbeiro</h3>
      
      {mensagemErro && (
        <div className="mb-6 p-4 rounded-lg bg-[#7f1d1d]/20 border border-[#b91c1c]/40 text-[#f87171] text-xs">
          ⚠️ {mensagemErro}
        </div>
      )}

      <form onSubmit={aoEnviar} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Nome do Barbeiro</label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Oliveira"
              value={nome}
              onChange={(e) => aoAlterarNome(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Taxa de Comissão (Decimal)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ex: 0.50 para 50%"
              value={comissao}
              onChange={(e) => aoAlterarComissao(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">URL do Avatar / Foto (Opcional)</label>
          <input
            type="text"
            placeholder="Ex: https://imagens.com/carlos.jpg"
            value={urlAvatar}
            onChange={(e) => aoAlterarUrlAvatar(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Biologia / Especialidade</label>
          <textarea
            rows={3}
            placeholder="Ex: Especialista em barba com toalha quente e cortes clássicos e artísticos."
            value={bio}
            onChange={(e) => aoAlterarBio(e.target.value)}
            className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition resize-none"
          />
        </div>

        <div className="p-4 bg-[#0a0a0c]/50 rounded-lg border border-[#27272a] space-y-1 text-center">
          <span className="text-xs text-[#d4af37] font-semibold">ℹ️ Escala de Trabalho Automatizada</span>
          <p className="text-[10px] text-slate-400 font-light">Este barbeiro será registrado automaticamente com a escala padrão de Porto Velho: Segunda a Sábado das 08:00 às 18:00.</p>
        </div>

        <button
          type="submit"
          disabled={carregandoEnvio}
          className="w-full bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black font-bold text-xs py-3.5 rounded-lg tracking-widest transition duration-300 shadow-lg"
        >
          {carregandoEnvio ? "CADASTRANDO..." : "CADASTRAR BARBEIRO"}
        </button>
      </form>
    </section>
  );
}

interface ModalEdicaoProps {
  barbeiroSelecionado: BarberItem;
  nome: string;
  aoAlterarNome: (v: string) => void;
  comissao: string;
  aoAlterarComissao: (v: string) => void;
  urlAvatar: string;
  aoAlterarUrlAvatar: (v: string) => void;
  bio: string;
  aoAlterarBio: (v: string) => void;
  carregandoEnvio: boolean;
  mensagemErro: string | null;
  aoEnviar: (e: React.FormEvent) => void;
  aoFechar: () => void;
}

export function ModalEdicaoBarbeiro({
  barbeiroSelecionado,
  nome,
  aoAlterarNome,
  comissao,
  aoAlterarComissao,
  urlAvatar,
  aoAlterarUrlAvatar,
  bio,
  aoAlterarBio,
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">AJUSTE DE CADASTRO</span>
            <h3 className="text-lg font-semibold text-white tracking-wide mt-1">Editar {barbeiroSelecionado.name}</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Nome do Barbeiro</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Oliveira"
                value={nome}
                onChange={(e) => aoAlterarNome(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Taxa de Comissão (Decimal)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="Ex: 0.50 para 50%"
                value={comissao}
                onChange={(e) => aoAlterarComissao(e.target.value)}
                className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">URL do Avatar / Foto (Opcional)</label>
            <input
              type="text"
              placeholder="Ex: https://imagens.com/carlos.jpg"
              value={urlAvatar}
              onChange={(e) => aoAlterarUrlAvatar(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Biologia / Especialidade</label>
            <textarea
              rows={3}
              placeholder="Ex: Especialista em barba com toalha quente e cortes clássicos e artísticos."
              value={bio}
              onChange={(e) => aoAlterarBio(e.target.value)}
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
              className="flex-1 bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black text-xs font-bold py-3 rounded-lg tracking-widest uppercase transition duration-300 shadow-lg"
            >
              {carregandoEnvio ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
