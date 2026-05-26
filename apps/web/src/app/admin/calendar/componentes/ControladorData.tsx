import React from "react";

interface ControladorDataProps {
  dataSelecionada: string;
  aoAlterarData: (v: string) => void;
  aoDiaAnterior: () => void;
  aoProximoDia: () => void;
}

export function ControladorData({
  dataSelecionada,
  aoAlterarData,
  aoDiaAnterior,
  aoProximoDia,
}: ControladorDataProps) {
  return (
    <div className="flex items-center gap-2 bg-[#121215] border border-[#27272a] rounded-lg p-1.5 w-full sm:w-auto justify-between">
      <button
        onClick={aoDiaAnterior}
        className="text-[#a1a1aa] hover:text-white p-2 hover:bg-[#0a0a0c] rounded-md transition duration-150"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <input
        type="date"
        value={dataSelecionada}
        onChange={(e) => aoAlterarData(e.target.value)}
        className="bg-transparent text-center font-mono font-bold text-sm text-[#d4af37] outline-none cursor-pointer focus:text-white transition w-36"
      />
      <button
        onClick={aoProximoDia}
        className="text-[#a1a1aa] hover:text-white p-2 hover:bg-[#0a0a0c] rounded-md transition duration-150"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
