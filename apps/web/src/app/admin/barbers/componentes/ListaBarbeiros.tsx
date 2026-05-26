import React from "react";
import { BarberItem } from "../tipos";

interface ListaBarbeirosProps {
  barbeiros: BarberItem[];
  aoAlternarAtivo: (id: string, statusAtual: boolean) => void;
  aoEditar: (barbeiro: BarberItem) => void;
  aoAbrirEscala: (barbeiro: BarberItem) => void;
}

export function ListaBarbeiros({
  barbeiros,
  aoAlternarAtivo,
  aoEditar,
  aoAbrirEscala,
}: ListaBarbeirosProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {barbeiros.length === 0 ? (
        <div className="col-span-full bg-[#121215] border border-[#27272a] rounded-xl p-12 text-center text-slate-500 font-light text-sm">
          Nenhum profissional cadastrado. Clique em &quot;Novo Barbeiro&quot; para começar a estruturar sua equipe.
        </div>
      ) : (
        barbeiros.map((barbeiro) => (
          <div
            key={barbeiro.id}
            className={`bg-[#121215] border rounded-xl p-6 space-y-6 flex flex-col justify-between transition duration-300 ${
              barbeiro.is_active
                ? "border-[#27272a] hover:border-[#d4af37]/40"
                : "border-[#27272a]/30 opacity-60"
            }`}
          >
            {/* Header do Barbeiro */}
            <div className="flex justify-between items-start">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-full border border-[#d4af37]/30 bg-[#0a0a0c] overflow-hidden flex items-center justify-center">
                  {barbeiro.avatar_url ? (
                    <img src={barbeiro.avatar_url} alt={barbeiro.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-display text-xl font-bold text-[#d4af37]">
                      {barbeiro.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-base text-white tracking-wide">{barbeiro.name}</h3>
                  <span className="text-[10px] text-[#d4af37] font-mono tracking-wider font-semibold">
                    Comissão: {(barbeiro.commission_rate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <button
                onClick={() => aoEditar(barbeiro)}
                className="text-slate-400 hover:text-[#d4af37] transition p-1"
                title="Editar Cadastro"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>

            {/* Biografia */}
            <p className="text-slate-400 text-xs leading-relaxed font-light min-h-[40px]">
              {barbeiro.bio || "Nenhuma biografia disponível para este barbeiro."}
            </p>

            {/* Status e Escala */}
            <div className="pt-4 border-t border-[#27272a]/50 flex justify-between items-center gap-3">
              <button
                onClick={() => aoAbrirEscala(barbeiro)}
                className="text-[9px] uppercase tracking-wider text-[#d4af37] font-semibold flex items-center gap-1.5 hover:text-white transition duration-200"
              >
                <svg className="w-3.5 h-3.5 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Ver / Editar Escala
              </button>

              {/* Toggle de Ativo */}
              <button
                onClick={() => aoAlternarAtivo(barbeiro.id, barbeiro.is_active)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition duration-200 flex-shrink-0 ${
                  barbeiro.is_active
                    ? "bg-green-500/10 text-green-400 border-green-500/30 hover:border-green-500/80"
                    : "bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500/80"
                }`}
              >
                {barbeiro.is_active ? "ATIVO" : "INATIVO"}
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
