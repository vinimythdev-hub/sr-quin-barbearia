import React from "react";

interface FiltroPeriodoProps {
  dataInicial: string;
  aoAlterarDataInicial: (v: string) => void;
  dataFinal: string;
  aoAlterarDataFinal: (v: string) => void;
  aoFiltrar: () => void;
}

export function FiltroPeriodo({
  dataInicial,
  aoAlterarDataInicial,
  dataFinal,
  aoAlterarDataFinal,
  aoFiltrar,
}: FiltroPeriodoProps) {
  return (
    <section className="bg-[#121215] border border-[#27272a] rounded-xl p-6 no-print">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Data Inicial</label>
            <input
              type="date"
              value={dataInicial}
              onChange={(e) => aoAlterarDataInicial(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-2.5 outline-none transition font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Data Final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={(e) => aoAlterarDataFinal(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-2.5 outline-none transition font-mono"
            />
          </div>
        </div>
        <button
          onClick={aoFiltrar}
          className="bg-[#27272a] hover:bg-[#3f3f46] text-white font-bold text-xs py-3 rounded-lg px-8 tracking-widest uppercase transition duration-300 w-full sm:w-auto"
        >
          Aplicar Filtro
        </button>
      </div>
    </section>
  );
}
