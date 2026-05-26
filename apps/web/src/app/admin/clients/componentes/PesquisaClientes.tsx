import React from "react";

interface PesquisaClientesProps {
  valor: string;
  aoAlterar: (v: string) => void;
}

export function PesquisaClientes({ valor, aoAlterar }: PesquisaClientesProps) {
  return (
    <section className="bg-[#121215]/80 border border-[#27272a] rounded-xl p-4 sm:p-6 flex items-center gap-4">
      <div className="relative flex-1">
        <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Pesquisar cliente por nome, telefone ou e-mail..."
          value={valor}
          onChange={(e) => aoAlterar(e.target.value)}
          className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg pl-12 pr-4 py-3 outline-none transition"
        />
      </div>
    </section>
  );
}
