import React from "react";
import { BarberStat } from "../tipos";

interface TabelaComissoesProps {
  estatisticasBarbeiros: BarberStat[];
}

export function TabelaComissoes({ estatisticasBarbeiros }: TabelaComissoesProps) {
  return (
    <section className="space-y-4 print-full-width">
      <h3 className="font-display text-lg font-semibold tracking-wide text-white print-text-black">
        Comissão Acumulada por Profissional
      </h3>

      <div className="bg-[#121215] border border-[#27272a]/70 rounded-xl overflow-hidden shadow-xl print-table">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa] font-mono">
              <th className="py-4 px-6">Barbeiro</th>
              <th className="py-4 px-6 text-center">Taxa Comissão</th>
              <th className="py-4 px-6 text-center">Quantidade Cortes</th>
              <th className="py-4 px-6 text-right">Faturamento Gerado</th>
              <th className="py-4 px-6 text-right">Comissão Devida</th>
              <th className="py-4 px-6 text-right">Lucro Loja (Líquido)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]/50 text-sm font-light">
            {estatisticasBarbeiros.map((stat) => {
              const shopProfit = stat.totalRevenue - stat.totalCommission;
              return (
                <tr key={stat.id} className="hover:bg-[#18181b]/20 transition duration-150">
                  <td className="py-4 px-6 font-semibold text-slate-200 print-text-black">
                    {stat.name}
                  </td>
                  <td className="py-4 px-6 text-center font-mono text-slate-300">
                    {(stat.rate * 100).toFixed(0)}%
                  </td>
                  <td className="py-4 px-6 text-center font-mono text-slate-300">
                    {stat.cutsCount} cortes
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-slate-300">
                    R$ {stat.totalRevenue.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-orange-400 font-semibold">
                    R$ {stat.totalCommission.toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right font-mono text-green-400 font-semibold print-text-gold">
                    R$ {shopProfit.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
