import React from "react";
import { ServiceItem } from "../tipos";

interface ListaServicosProps {
  servicos: ServiceItem[];
  aoAlternarAtivo: (id: string, statusAtual: boolean) => void;
  aoEditar: (servico: ServiceItem) => void;
}

export function ListaServicos({
  servicos,
  aoAlternarAtivo,
  aoEditar,
}: ListaServicosProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {servicos.length === 0 ? (
        <div className="col-span-full bg-[#121215] border border-[#27272a] rounded-xl p-12 text-center text-slate-500 font-light text-sm">
          Nenhum serviço cadastrado no catálogo. Clique em &quot;Novo Serviço&quot; para começar.
        </div>
      ) : (
        servicos.map((servico) => (
          <div
            key={servico.id}
            className={`bg-[#121215] border rounded-xl p-6 space-y-6 flex flex-col justify-between transition duration-300 ${
              servico.is_active
                ? "border-[#27272a] hover:border-[#d4af37]/40"
                : "border-[#27272a]/30 opacity-60"
            }`}
          >
            {/* Nome e Duração */}
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-4">
                <h3 className="font-semibold text-lg text-white tracking-wide">{servico.name}</h3>
                <span className="text-xs font-mono bg-[#0a0a0c] border border-[#27272a] px-2.5 py-1 rounded-md text-[#d4af37]">
                  {servico.duration_minutes} min
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed font-light">
                {servico.description || "Nenhuma descrição fornecida para este serviço."}
              </p>
            </div>

            {/* Preço e Status */}
            <div className="pt-4 border-t border-[#27272a]/50 flex justify-between items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">Preço</span>
                <span className="text-xl font-bold font-mono text-white mt-0.5">
                  R$ {Number(servico.price).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão de Editar Serviço */}
                <button
                  onClick={() => aoEditar(servico)}
                  className="p-1.5 rounded-lg border border-[#27272a] hover:border-[#d4af37] bg-[#0a0a0c] text-[#a1a1aa] hover:text-[#d4af37] transition duration-200 flex-shrink-0"
                  title="Editar Serviço"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {/* Toggle de Ativo */}
                <button
                  onClick={() => aoAlternarAtivo(servico.id, servico.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition duration-200 flex-shrink-0 ${
                    servico.is_active
                      ? "bg-green-500/10 text-green-400 border-green-500/30 hover:border-green-500/80"
                      : "bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500/80"
                  }`}
                >
                  {servico.is_active ? "ATIVO" : "INATIVO"}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </section>
  );
}
