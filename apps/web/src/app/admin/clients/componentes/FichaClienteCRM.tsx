import React from "react";
import { ClientItem } from "../tipos";
import { formatToRondoniaTime } from "@barbearia/shared";

interface FichaClienteCRMProps {
  cliente: ClientItem;
  aoFechar: () => void;
}

export function FichaClienteCRM({ cliente, aoFechar }: FichaClienteCRMProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fade-in">
      <div className="bg-[#121215] border-l border-[#d4af37]/30 w-full max-w-lg h-full flex flex-col justify-between shadow-2xl relative animate-slide-left p-6 sm:p-8">
        {/* Header Drawer */}
        <div className="flex justify-between items-start border-b border-[#27272a]/60 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">DADOS DE FIDELIDADE</span>
            <h2 className="text-xl font-bold text-white tracking-wide">{cliente.name}</h2>
            <div className="flex flex-col text-slate-400 text-xs font-mono pt-1">
              <span>Tel: {cliente.phone || "Sem telefone"}</span>
              <span>E-mail: {cliente.email || "Sem e-mail"}</span>
              <span>Membro desde: {new Date(cliente.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
          <button
            onClick={aoFechar}
            className="text-slate-400 hover:text-white p-1 border border-[#27272a] rounded-lg bg-[#0a0a0c]"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo / Estatísticas */}
        <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {/* Cards Grid de CRM */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-[#a1a1aa]">Total Investido</span>
              <div className="text-lg font-bold font-mono text-[#d4af37]">
                R${" "}
                {cliente.appointments
                  .filter((a) => a.status === "completed")
                  .reduce((sum, a) => sum + Number(a.price), 0)
                  .toFixed(2)}
              </div>
            </div>
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-[#a1a1aa]">Visitas Concluídas</span>
              <div className="text-lg font-bold font-mono text-white">
                {cliente.appointments.filter((a) => a.status === "completed").length} cortes
              </div>
            </div>
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-[#a1a1aa]">Total Faltas (No-show)</span>
              <div className="text-lg font-bold font-mono text-orange-400">
                {cliente.appointments.filter((a) => a.status === "no_show").length} faltas
              </div>
            </div>
            <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-1">
              <span className="text-[9px] uppercase tracking-wider text-[#a1a1aa]">Taxa de Absenteísmo</span>
              <div className="text-lg font-bold font-mono text-red-400">
                {(cliente.appointments.length > 0
                  ? (cliente.appointments.filter((a) => a.status === "no_show").length /
                      cliente.appointments.length) *
                    100
                  : 0
                ).toFixed(0)}
                %
              </div>
            </div>
          </div>

          {/* Lista de Histórico */}
          <div className="space-y-4">
            <h4 className="text-xs uppercase tracking-widest text-[#a1a1aa] font-mono font-semibold">Histórico de Visitas</h4>
            
            {cliente.appointments.length === 0 ? (
              <div className="text-center text-slate-500 font-light py-8 text-xs bg-[#0a0a0c] border border-[#27272a] rounded-xl">
                Nenhum agendamento registrado na base.
              </div>
            ) : (
              <div className="space-y-3">
                {cliente.appointments
                  .slice()
                  .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                  .map((app) => {
                    const dateFormatted = formatToRondoniaTime(app.start_time).split(", ")[0];
                    const timeFormatted = formatToRondoniaTime(app.start_time).split(", ")[1];

                    return (
                      <div key={app.id} className="flex justify-between items-center p-3 bg-[#0a0a0c] border border-[#27272a] rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-white">{dateFormatted}</span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{timeFormatted} • R$ {Number(app.price).toFixed(2)}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider font-semibold ${
                            app.status === "completed"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : app.status === "cancelled"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : app.status === "no_show"
                              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                              : "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20"
                          }`}
                        >
                          {app.status === "completed" && "Concluído"}
                          {app.status === "cancelled" && "Cancelado"}
                          {app.status === "no_show" && "Falta"}
                          {app.status === "scheduled" && "Agendado"}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Drawer */}
        <div className="border-t border-[#27272a]/60 pt-6">
          <button
            onClick={aoFechar}
            className="w-full bg-[#d4af37] hover:bg-[#c5a130] text-black font-bold text-xs py-3.5 rounded-lg tracking-widest uppercase transition duration-300 shadow-lg"
          >
            FECHAR FICHA
          </button>
        </div>
      </div>
    </div>
  );
}
