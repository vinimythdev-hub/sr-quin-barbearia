"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import { formatToRondoniaTime } from "@barbearia/shared";

interface AppointmentItem {
  id: string;
  price: number;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  start_time: string;
}

interface ClientItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  appointments: AppointmentItem[];
}

export default function ClientsCRMPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);

  // Buscar clientes e seus respectivos históricos de agendamentos
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          appointments (
            id,
            price,
            status,
            start_time
          )
        `)
        .eq("role", "client")
        .order("name", { ascending: true });

      if (error) throw error;
      setClients((data || []) as any);
    } catch (err: any) {
      console.error("Erro ao carregar clientes CRM:", err);
    }
  };

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        await fetchClients();
      } catch (err) {
        console.error("Erro de autenticação no CRM:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  // Exportar dados de clientes para CSV
  const handleExportCSV = () => {
    if (clients.length === 0) return;

    // Cabeçalhos
    const headers = [
      "Nome",
      "Email",
      "Telefone",
      "Data de Cadastro",
      "Total Agendamentos",
      "Cortes Concluídos",
      "No-shows (Faltas)",
      "Taxa de Falta (%)",
      "Faturamento Total (R$)"
    ];

    // Linhas
    const rows = filteredClients.map((client) => {
      const totalApp = client.appointments.length;
      const completedApp = client.appointments.filter((a) => a.status === "completed").length;
      const noShows = client.appointments.filter((a) => a.status === "no_show").length;
      const noShowRate = totalApp > 0 ? ((noShows / totalApp) * 100).toFixed(1) : "0.0";
      const totalSpent = client.appointments
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + Number(a.price), 0)
        .toFixed(2);

      return [
        `"${client.name}"`,
        `"${client.email || ""}"`,
        `"${client.phone || ""}"`,
        `"${new Date(client.created_at).toLocaleDateString("pt-BR")}"`,
        totalApp,
        completedApp,
        noShows,
        `"${noShowRate}%"`,
        `"R$ ${totalSpent}"`
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sr_quin_crm_clientes_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtragem dos clientes em tempo real (Search Query)
  const filteredClients = clients.filter((c) => {
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">
            Carregando CRM...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none" />

      {/* Cabeçalho */}
      <Header activePage="clients" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-8">
        {/* Topo / Título */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Base de Dados</span>
            <h1 className="font-display text-3xl font-light text-white">Central de Clientes & CRM</h1>
            <p className="text-xs text-slate-400 font-light">Estatísticas de fidelidade, histórico de visitas e controle de faltas.</p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredClients.length === 0}
            className="w-full md:w-auto bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/20 disabled:text-black/55 text-black font-bold text-xs rounded-lg px-6 py-3 tracking-widest transition duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.15)] flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            EXPORTAR CSV
          </button>
        </section>

        {/* Barra de Pesquisa */}
        <section className="bg-[#121215]/80 border border-[#27272a] rounded-xl p-4 sm:p-6 flex items-center gap-4">
          <div className="relative flex-1">
            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar cliente por nome, telefone ou e-mail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg pl-12 pr-4 py-3 outline-none transition"
            />
          </div>
        </section>

        {/* Tabela / Grid Responsivo */}
        <section className="bg-[#121215] border border-[#27272a]/70 rounded-xl overflow-hidden shadow-xl">
          {filteredClients.length === 0 ? (
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
                  {filteredClients.map((client) => {
                    const totalApp = client.appointments.length;
                    const completedApp = client.appointments.filter((a) => a.status === "completed").length;
                    const noShows = client.appointments.filter((a) => a.status === "no_show").length;
                    const noShowRate = totalApp > 0 ? (noShows / totalApp) * 100 : 0;
                    const totalSpent = client.appointments
                      .filter((a) => a.status === "completed")
                      .reduce((sum, a) => sum + Number(a.price), 0);

                    return (
                      <tr key={client.id} className="hover:bg-[#18181b]/20 transition duration-150">
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-100">{client.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 sm:hidden">
                              {client.phone || "Sem telefone"}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 hidden sm:table-cell">
                          <div className="flex flex-col">
                            <span className="text-slate-300 font-mono">{client.phone || "Sem telefone"}</span>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5">{client.email || "Sem e-mail"}</span>
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
                            onClick={() => setSelectedClient(client)}
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
      </main>

      {/* Drawer / Sidebar Lateral de CRM do Cliente */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end animate-fade-in">
          <div className="bg-[#121215] border-l border-[#d4af37]/30 w-full max-w-lg h-full flex flex-col justify-between shadow-2xl relative animate-slide-left p-6 sm:p-8">
            {/* Header Drawer */}
            <div className="flex justify-between items-start border-b border-[#27272a]/60 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">DADOS DE FIDELIDADE</span>
                <h2 className="text-xl font-bold text-white tracking-wide">{selectedClient.name}</h2>
                <div className="flex flex-col text-slate-400 text-xs font-mono pt-1">
                  <span>Tel: {selectedClient.phone || "Sem telefone"}</span>
                  <span>E-mail: {selectedClient.email || "Sem e-mail"}</span>
                  <span>Membro desde: {new Date(selectedClient.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
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
                    {selectedClient.appointments
                      .filter((a) => a.status === "completed")
                      .reduce((sum, a) => sum + Number(a.price), 0)
                      .toFixed(2)}
                  </div>
                </div>
                <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#a1a1aa]">Visitas Concluídas</span>
                  <div className="text-lg font-bold font-mono text-white">
                    {selectedClient.appointments.filter((a) => a.status === "completed").length} cortes
                  </div>
                </div>
                <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#a1a1aa]">Total Faltas (No-show)</span>
                  <div className="text-lg font-bold font-mono text-orange-400">
                    {selectedClient.appointments.filter((a) => a.status === "no_show").length} faltas
                  </div>
                </div>
                <div className="bg-[#0a0a0c] border border-[#27272a] rounded-xl p-4 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider text-[#a1a1aa]">Taxa de Absenteísmo</span>
                  <div className="text-lg font-bold font-mono text-red-400">
                    {(selectedClient.appointments.length > 0
                      ? (selectedClient.appointments.filter((a) => a.status === "no_show").length /
                          selectedClient.appointments.length) *
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
                
                {selectedClient.appointments.length === 0 ? (
                  <div className="text-center text-slate-500 font-light py-8 text-xs bg-[#0a0a0c] border border-[#27272a] rounded-xl">
                    Nenhum agendamento registrado na base.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedClient.appointments
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
                onClick={() => setSelectedClient(null)}
                className="w-full bg-[#d4af37] hover:bg-[#c5a130] text-black font-bold text-xs py-3.5 rounded-lg tracking-widest uppercase transition duration-300 shadow-lg"
              >
                FECHAR FICHA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <footer className="border-t border-[#27272a]/30 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>
    </div>
  );
}
