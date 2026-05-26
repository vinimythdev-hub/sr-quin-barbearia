import React from "react";
import { BarberItem, WorkHourModalItem } from "../tipos";

interface ModalEscalaProps {
  barbeiroSelecionado: BarberItem;
  escala: WorkHourModalItem[];
  aoAlterarEscala: React.Dispatch<React.SetStateAction<WorkHourModalItem[]>>;
  carregando: boolean;
  erro: string | null;
  aoSalvar: () => void;
  aoFechar: () => void;
}

export function ModalEscala({
  barbeiroSelecionado,
  escala,
  aoAlterarEscala,
  carregando,
  erro,
  aoSalvar,
  aoFechar,
}: ModalEscalaProps) {
  const diasSemanaPt = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-[#121215] border border-[#d4af37]/30 rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-[#27272a]/60 pb-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">CONFIGURAÇÃO DE EXPEDIENTE</span>
            <h3 className="text-lg font-semibold text-white tracking-wide mt-1">Escala de {barbeiroSelecionado.name}</h3>
          </div>
          <button onClick={aoFechar} className="text-slate-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {erro && (
          <div className="p-3.5 bg-red-950/20 border border-red-500/35 rounded-lg text-red-400 text-xs">
            ⚠️ {erro}
          </div>
        )}

        {carregando ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-mono">Salvando escala...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-slate-400 font-light pb-2">
              Marque os dias de expediente do profissional e configure os horários de início e término de turno.
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {escala.map((h) => (
                <div key={h.day_of_week} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0a0a0c] border border-[#27272a] rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={h.is_working}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        aoAlterarEscala(prev =>
                          prev.map(item => item.day_of_week === h.day_of_week ? { ...item, is_working: checked } : item)
                        );
                      }}
                      className="w-4 h-4 accent-[#d4af37] rounded border-[#27272a] bg-[#121215]"
                    />
                    <span className={`text-xs font-semibold ${h.is_working ? "text-slate-100" : "text-slate-500"}`}>
                      {diasSemanaPt[h.day_of_week]}
                    </span>
                  </label>

                  {h.is_working ? (
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      {/* Horário de Expediente */}
                      <div className="flex items-center justify-between sm:justify-end gap-2">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono sm:hidden">Expediente:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            required
                            value={h.start_time}
                            onChange={(e) => {
                              const val = e.target.value;
                              aoAlterarEscala(prev =>
                                prev.map(item => item.day_of_week === h.day_of_week ? { ...item, start_time: val } : item)
                              );
                            }}
                            className="bg-[#121215] border border-[#27272a]/80 focus:border-[#d4af37]/60 text-xs font-mono text-slate-200 rounded px-2 py-1 outline-none w-20"
                          />
                          <span className="text-[10px] text-slate-500 font-mono font-medium">às</span>
                          <input
                            type="time"
                            required
                            value={h.end_time}
                            onChange={(e) => {
                              const val = e.target.value;
                              aoAlterarEscala(prev =>
                                prev.map(item => item.day_of_week === h.day_of_week ? { ...item, end_time: val } : item)
                              );
                            }}
                            className="bg-[#121215] border border-[#27272a]/80 focus:border-[#d4af37]/60 text-xs font-mono text-slate-200 rounded px-2 py-1 outline-none w-20"
                          />
                        </div>
                      </div>

                      {/* Horário de Almoço */}
                      <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-[#27272a]/40 pt-1.5 sm:border-t-0 sm:pt-0">
                        <span className="text-[10px] text-[#d4af37]/75 uppercase tracking-wider font-mono">Almoço:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            value={h.lunch_start || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              aoAlterarEscala(prev =>
                                prev.map(item => item.day_of_week === h.day_of_week ? { ...item, lunch_start: val } : item)
                              );
                            }}
                            className="bg-[#121215] border border-[#27272a]/80 focus:border-[#d4af37]/60 text-xs font-mono text-[#d4af37] rounded px-2 py-1 outline-none w-20"
                          />
                          <span className="text-[10px] text-slate-500 font-mono font-medium">às</span>
                          <input
                            type="time"
                            value={h.lunch_end || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              aoAlterarEscala(prev =>
                                prev.map(item => item.day_of_week === h.day_of_week ? { ...item, lunch_end: val } : item)
                              );
                            }}
                            className="bg-[#121215] border border-[#27272a]/80 focus:border-[#d4af37]/60 text-xs font-mono text-[#d4af37] rounded px-2 py-1 outline-none w-20"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest font-semibold py-1">Folga</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-[#27272a]/60">
              <button
                onClick={aoFechar}
                className="flex-1 bg-transparent hover:bg-[#27272a]/40 border border-[#27272a] text-[#a1a1aa] hover:text-white text-xs font-semibold py-3 rounded-lg tracking-widest uppercase transition duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={aoSalvar}
                className="flex-1 bg-[#d4af37] hover:bg-[#c5a130] text-black text-xs font-bold py-3 rounded-lg tracking-widest uppercase transition duration-300 shadow-lg"
              >
                Salvar Escala
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
