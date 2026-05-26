import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ClientItem } from "../tipos";

export function useClientes() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [clientes, setClientes] = useState<ClientItem[]>([]);
  const [consultaPesquisa, setConsultaPesquisa] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<ClientItem | null>(null);

  const buscarClientes = async () => {
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
        .not("name", "is", null)
        .not("phone", "is", null)
        .neq("name", "Convidado")
        .neq("name", "")
        .neq("phone", "")
        .order("name", { ascending: true });

      if (error) throw error;
      setClientes((data || []) as any);
    } catch (err: any) {
      console.error("Erro ao carregar clientes CRM:", err);
    }
  };

  useEffect(() => {
    const verificarAutenticacaoEBuscar = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        await buscarClientes();
      } catch (err) {
        console.error("Erro de autenticação no CRM:", err);
        router.push("/login");
      } finally {
        setCarregando(false);
      }
    };

    verificarAutenticacaoEBuscar();
  }, [router]);

  // Filtragem dos clientes em tempo real (Pesquisa)
  const clientesFiltrados = clientes.filter((c) => {
    const query = consultaPesquisa.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  });

  // Exportar dados de clientes para CSV
  const aoExportarCSV = () => {
    if (clientesFiltrados.length === 0) return;

    // Cabeçalhos em português
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
    const rows = clientesFiltrados.map((cliente) => {
      const totalApp = cliente.appointments.length;
      const completedApp = cliente.appointments.filter((a) => a.status === "completed").length;
      const noShows = cliente.appointments.filter((a) => a.status === "no_show").length;
      const noShowRate = totalApp > 0 ? ((noShows / totalApp) * 100).toFixed(1) : "0.0";
      const totalSpent = cliente.appointments
        .filter((a) => a.status === "completed")
        .reduce((sum, a) => sum + Number(a.price), 0)
        .toFixed(2);

      return [
        `"${cliente.name}"`,
        `"${cliente.email || ""}"`,
        `"${cliente.phone || ""}"`,
        `"${new Date(cliente.created_at).toLocaleDateString("pt-BR")}"`,
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

  return {
    carregando,
    clientes,
    consultaPesquisa,
    setConsultaPesquisa,
    clienteSelecionado,
    setClienteSelecionado,
    clientesFiltrados,
    aoExportarCSV,
  };
}
