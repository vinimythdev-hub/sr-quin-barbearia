import React from "react";
import { ClientItem } from "../tipos";

interface TabelaClientesProps {
  clientes: ClientItem[];
  aoSelecionarCliente: (cliente: ClientItem) => void;
}

export function TabelaClientes({ clientes, aoSelecionarCliente }: TabelaClientesProps) {
  return (
    <section className="bg-[#121215] border border-[#27272a]/70 rounded-xl overflow-hidden shadow-xl">
      {clientes.length === 0 ? (
        <div className="p-16 text-center text-slate-500 font-light text-sm">
          Nenhum cliente correspondente encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa] font-mono">
                <th className="py-4 px-6">Cliente</th>
                <th className="py-4 px-6 hidden sm:table-cell">Contato</th>
                <th className="py-4 px-6 text-center">Visitas</th>
                <th className="py-4 px-6 text-center">Faltas</th>
                <th className="py-4 px-6 text-center">Taxa de Falta</th>
                <th className="py-4 px-6 text-right">Total Gasto</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]/50 text-sm font-light">
              {clientes.map((cliente) => {
                const totalApp = cliente.appointments.length;
                const completedApp = cliente.appointments.filter((a) => a.status === "completed").length;
                const noShows = cliente.appointments.filter((a) => a.status === "no_show").length;
                const noShowRate = totalApp > 0 ? (noShows / totalApp) * 100 : 0;
                const totalSpent = cliente.appointments
                  .filter((a) => a.status === "completed")
                  .reduce((sum, a) => sum + Number(a.price), 0);

                return (
                  <tr key={cliente.id} className="hover:bg-[#18181b]/20 transition duration-150">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-100">{cliente.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 sm:hidden">
                          {cliente.phone || "Sem telefone"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-mono">{cliente.phone || "Sem telefone"}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{cliente.email || "Sem e-mail"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-slate-200">
                      {completedApp}
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-orange-400">
                      {noShows}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-xs font-semibold ${
                          noShowRate >= 30
                            ? "bg-red-500/10 text-red-400 border border-red-500/20"
                            : noShowRate > 0
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-green-500/10 text-green-400 border border-green-500/20"
                        }`}
                      >
                        {noShowRate.toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right font-mono text-[#d4af37] font-semibold">
                      R$ {totalSpent.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => aoSelecionarCliente(cliente)}
                        className="bg-[#27272a] hover:bg-[#d4af37] text-slate-300 hover:text-black font-semibold text-xs rounded-lg px-3 py-1.5 transition duration-200"
                      >
                        FICHA CRM
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
