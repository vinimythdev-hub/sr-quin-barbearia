import React from "react";
import { BarberItem, AppointmentDetail } from "../tipos";

interface FiltroBarbeiroMobileProps {
  barbeiros: BarberItem[];
  idBarbeiroMovelAtivo: string | null;
  aoSelecionarBarbeiro: (id: string) => void;
  agendamentosAtivos: AppointmentDetail[];
}

export function FiltroBarbeiroMobile({
  barbeiros,
  idBarbeiroMovelAtivo,
  aoSelecionarBarbeiro,
  agendamentosAtivos,
}: FiltroBarbeiroMobileProps) {
  return (
    <section className="lg:hidden flex items-center gap-3 overflow-x-auto pb-4 scrollbar-thin">
      {barbeiros.map((barbeiro) => {
        const isAtivo = idBarbeiroMovelAtivo === barbeiro.id;
        const agendamentosDoBarbeiro = agendamentosAtivos.filter((a) => a.barbers?.id === barbeiro.id);

        return (
          <button
            key={barbeiro.id}
            onClick={() => aoSelecionarBarbeiro(barbeiro.id)}
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex-shrink-0 ${
              isAtivo
                ? "bg-[#d4af37] text-black border-[#d4af37]"
                : "bg-[#121215] text-[#a1a1aa] border-[#27272a] hover:border-[#d4af37]/35"
            }`}
          >
            <div className="w-6 h-6 rounded-full border border-black/10 overflow-hidden flex items-center justify-center bg-black/20">
              {barbeiro.avatar_url ? (
                <img src={barbeiro.avatar_url} alt={barbeiro.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-mono text-[9px] font-bold">
                  {barbeiro.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span>{barbeiro.name.split(" ")[0]}</span>
            <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] ${isAtivo ? "bg-black/25 text-black" : "bg-[#0a0a0c] text-slate-400"}`}>
              {agendamentosDoBarbeiro.length}
            </span>
          </button>
        );
      })}
    </section>
  );
}
