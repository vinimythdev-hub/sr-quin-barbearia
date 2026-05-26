import React from "react";

interface MetricasFinanceirasProps {
  faturamentoBruto: number;
  totalComissoes: number;
  lucroLiquido: number;
  quantidadeCortes: number;
}

export function MetricasFinanceiras({
  faturamentoBruto,
  totalComissoes,
  lucroLiquido,
  quantidadeCortes,
}: MetricasFinanceirasProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {/* Card 1: Faturamento Bruto */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 space-y-4 hover:border-[#d4af37]/20 transition duration-300 print-card-white">
        <div className="flex justify-between items-center no-print">
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Faturamento Bruto</span>
          <svg className="w-5 h-5 text-[#d4af37]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold hidden print:inline">Faturamento Bruto</span>
          <h4 className="text-3xl font-bold text-white font-mono print-text-black mt-1">
            R$ {faturamentoBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <p className="text-[9px] text-green-400 mt-1 print-text-black">
            ✓ {quantidadeCortes} cortes concluídos no total
          </p>
        </div>
      </div>

      {/* Card 2: Total Comissões */}
      <div className="bg-[#121215] border border-[#27272a] rounded-xl p-6 space-y-4 hover:border-[#d4af37]/20 transition duration-300 print-card-white">
        <div className="flex justify-between items-center no-print">
          <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-medium">Repasse Comissões</span>
          <svg className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold hidden print:inline">Repasse Comissões</span>
          <h4 className="text-3xl font-bold text-orange-400 print-text-black mt-1">
            R$ {totalComissoes.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <p className="text-[9px] text-slate-400 mt-1 print-text-black">
            Com base no percentual de cada barbeiro
          </p>
        </div>
      </div>

      {/* Card 3: Lucro Líquido */}
      <div className="bg-[#121215] border border-[#d4af37]/30 rounded-xl p-6 space-y-4 hover:border-[#d4af37]/50 transition duration-300 print-card-white">
        <div className="flex justify-between items-center no-print">
          <span className="text-[10px] uppercase tracking-wider text-[#d4af37] font-semibold">Lucro Líquido Loja</span>
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold hidden print:inline">Lucro Líquido Loja</span>
          <h4 className="text-3xl font-bold text-white print-text-gold mt-1">
            R$ {lucroLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h4>
          <p className="text-[9px] text-green-400 mt-1 print-text-black">
            ✓ Líquido disponível para a administração
          </p>
        </div>
      </div>
    </section>
  );
}
