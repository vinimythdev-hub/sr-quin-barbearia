import React from "react";
import { BarberItem, AppointmentDetail } from "../tipos";
import { formatToRondoniaTime } from "@barbearia/shared";

interface GradeHorariaProps {
  barbeiros: BarberItem[];
  agendamentosAtivos: AppointmentDetail[];
  idBarbeiroMovelAtivo: string | null;
  escalasBarbeiros: any[];
  alturaSlot: number;
  obterPosicaoAgendamento: (startTimeStr: string, endTimeStr: string) => { top: number; height: number };
  obterPosicaoAlmoco: (lunchStart: string, lunchEnd: string) => { top: number; height: number };
}

export function GradeHoraria({
  barbeiros,
  agendamentosAtivos,
  idBarbeiroMovelAtivo,
  escalasBarbeiros,
  alturaSlot,
  obterPosicaoAgendamento,
  obterPosicaoAlmoco,
}: GradeHorariaProps) {
  return (
    <section className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col">
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] flex-1 min-h-[500px]">
        <div
          className="relative select-none flex"
          style={{
            minWidth: "100%",
            width: "max-content",
            height: `${alturaSlot * 10}px` // 10 faixas de horas (das 08h às 18h)
          }}
        >
          {/* COLUNA 0: Marcadores de Horas */}
          <div className="w-16 bg-[#18181b]/50 border-r border-[#27272a] flex-shrink-0 sticky left-0 z-20 flex flex-col">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="border-b border-[#27272a]/30 text-[10px] font-mono text-slate-400 font-semibold flex items-start justify-center pt-2"
                style={{ height: `${alturaSlot}px` }}
              >
                {String(8 + i).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* COLUNAS DE BARBEIROS */}
          <div className="flex-1 flex">
            {barbeiros.map((barbeiro) => {
              const isMovelAtivo = idBarbeiroMovelAtivo === barbeiro.id;
              const agendamentosDoBarbeiro = agendamentosAtivos.filter((a) => a.barbers?.id === barbeiro.id);

              return (
                <div
                  key={barbeiro.id}
                  className={`flex-col relative border-r border-[#27272a] w-72 lg:w-80 flex-shrink-0 ${
                    isMovelAtivo ? "flex" : "hidden lg:flex"
                  }`}
                >
                  {/* Topo da Coluna: Cabeçalho do Barbeiro */}
                  <div className="bg-[#18181b]/35 border-b border-[#27272a] py-3.5 px-4 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md">
                    <span className="text-xs font-bold text-slate-100 uppercase tracking-widest">{barbeiro.name}</span>
                    <span className="text-[10px] font-mono text-[#d4af37]">{agendamentosDoBarbeiro.length} cortes</span>
                  </div>

                  {/* O Grid com as linhas de marcação */}
                  <div className="relative flex-1">
                    {/* Linhas de fundo de meia em meia hora */}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="border-b border-[#27272a]/30 relative flex flex-col justify-end"
                        style={{ height: `${alturaSlot}px` }}
                      >
                        <div className="absolute top-1/2 left-0 w-full border-b border-dashed border-[#27272a]/15 pointer-events-none" />
                      </div>
                    ))}

                    {/* Bloco de Almoço */}
                    {(() => {
                      const escala = escalasBarbeiros.find(s => s.barber_id === barbeiro.id);
                      if (escala?.lunch_start && escala?.lunch_end) {
                        const pos = obterPosicaoAlmoco(escala.lunch_start, escala.lunch_end);
                        return (
                          <div
                            className="absolute left-3 right-3 rounded-lg border border-[#27272a]/50 opacity-30 flex items-center justify-center pointer-events-none"
                            style={{
                              top: `${pos.top + 6}px`,
                              height: `${pos.height - 12}px`,
                              backgroundImage: 'repeating-linear-gradient(45deg, #1c1917, #1c1917 10px, #27272a 10px, #27272a 20px)'
                            }}
                          >
                            <span className="text-[10px] tracking-[0.2em] font-mono text-slate-400 font-bold uppercase select-none">
                              INTERVALO ALMOÇO
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Cartões dos Agendamentos */}
                    {agendamentosDoBarbeiro.map((app) => {
                      const pos = obterPosicaoAgendamento(app.start_time, app.end_time);
                      const startTimeLocal = formatToRondoniaTime(app.start_time).split(", ")[1];

                      return (
                        <div
                          key={app.id}
                          className={`absolute left-3 right-3 rounded-lg border p-3 flex flex-col justify-between overflow-hidden shadow-lg group hover:scale-[1.01] hover:z-10 transition duration-200 cursor-default ${
                            app.status === "completed"
                              ? "bg-green-950/20 border-green-500/40 hover:border-green-400 text-green-300"
                              : app.status === "no_show"
                              ? "bg-orange-950/20 border-orange-500/40 hover:border-orange-400 text-orange-300"
                              : "bg-[#1e1a12] border-[#d4af37]/40 hover:border-[#d4af37] text-amber-200"
                          }`}
                          style={{
                            top: `${pos.top + 6}px`,
                            height: `${pos.height - 12}px`
                          }}
                        >
                          <div className="flex flex-col leading-tight">
                            <span className="text-[10px] font-mono tracking-wider font-semibold opacity-75">
                              {startTimeLocal} ({app.services?.duration_minutes} min)
                            </span>
                            <span className="text-xs font-bold text-white tracking-wide mt-1.5 truncate">
                              {app.profiles?.name}
                            </span>
                            <span className="text-[9px] uppercase tracking-widest font-mono opacity-80 mt-0.5 truncate">
                              {app.services?.name}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-[9px] font-mono pt-1">
                            <span className="font-bold opacity-90">R$ {Number(app.price).toFixed(2)}</span>
                            <span className="uppercase tracking-widest font-bold">
                              {app.status === "completed" && "Concluído"}
                              {app.status === "no_show" && "Falta"}
                              {app.status === "scheduled" && "Agendado"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
