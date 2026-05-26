import React from "react";
import { AppointmentDetail } from "../tipos";
import { formatToRondoniaTime } from "@barbearia/shared";

interface TabelaComprovantesProps {
  agendamentos: AppointmentDetail[];
}

export function TabelaComprovantes({ agendamentos }: TabelaComprovantesProps) {
  return (
    <section className="space-y-4 print-full-width">
      <h3 className="font-display text-lg font-semibold tracking-wide text-white print-text-black">
        Comprovantes e Histórico Consolidado
      </h3>

      <div className="bg-[#121215] border border-[#27272a]/70 rounded-xl overflow-hidden shadow-xl print-table">
        {agendamentos.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-light text-sm">
            Nenhum agendamento concluído encontrado no período.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa] font-mono">
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6">Cliente</th>
                  <th className="py-4 px-6">Barbeiro</th>
                  <th className="py-4 px-6">Serviço</th>
                  <th className="py-4 px-6 text-right">Valor Pago</th>
                  <th className="py-4 px-6 text-right">Comissão</th>
                  <th className="py-4 px-6 text-right">Lucro Loja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/50 text-sm font-light">
                {agendamentos.map((app) => {
                  const dateLocal = formatToRondoniaTime(app.start_time).split(", ")[0];
                  const hourLocal = formatToRondoniaTime(app.start_time).split(", ")[1];
                  const price = Number(app.price);
                  const rate = Number(app.barbers?.commission_rate || 0);
                  const commission = price * rate;
                  const profit = price - commission;

                  return (
                    <tr key={app.id} className="hover:bg-[#18181b]/20 transition duration-150">
                      <td className="py-4 px-6 font-mono text-slate-300">
                        <div className="flex flex-col">
                          <span>{dateLocal}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">{hourLocal}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-200 font-medium">
                        {app.profiles?.name || "Sem Cliente"}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {app.barbers?.name || "Inativo"}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {app.services?.name}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-200">
                        R$ {price.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-orange-400">
                        <div className="flex flex-col">
                          <span>R$ {commission.toFixed(2)}</span>
                          <span className="text-[9px] text-slate-500">({(rate * 100).toFixed(0)}%)</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-green-400 print-text-gold">
                        R$ {profit.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
