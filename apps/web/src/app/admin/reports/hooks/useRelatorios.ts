import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BarberItem, AppointmentDetail, BarberStat } from "../tipos";
import { formatToRondoniaTime } from "@barbearia/shared";

export function useRelatorios() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [barbeiros, setBarbeiros] = useState<BarberItem[]>([]);
  const [agendamentos, setAgendamentos] = useState<AppointmentDetail[]>([]);

  // Filtros de Data
  const [dataInicial, setDataInicial] = useState<string>(() => {
    // Início do mês atual
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    return `${ano}-${mes}-01`;
  });
  const [dataFinal, setDataFinal] = useState<string>(() => {
    // Hoje
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  });

  const buscarDadosFinanceiros = async () => {
    setCarregando(true);
    try {
      // 1. Carregar barbeiros para inicializar a lista de estatísticas
      const { data: dadosBarbeiros, error: erroBarbeiros } = await supabase
        .from("barbers")
        .select("id, name, commission_rate");

      if (erroBarbeiros) throw erroBarbeiros;
      setBarbeiros(dadosBarbeiros || []);

      // 2. Carregar agendamentos concluídos no período
      const inicioLocal = `${dataInicial}T00:00:00`;
      const fimLocal = `${dataFinal}T23:59:59`;
      const inicioISO = new Date(`${inicioLocal}-04:00`).toISOString();
      const fimISO = new Date(`${fimLocal}-04:00`).toISOString();

      const { data: dadosAgendamentos, error: erroAgendamentos } = await supabase
        .from("appointments")
        .select(`
          id,
          start_time,
          price,
          status,
          profiles (name),
          barbers (id, name, commission_rate),
          services (name)
        `)
        .gte("start_time", inicioISO)
        .lte("start_time", fimISO)
        .eq("status", "completed")
        .order("start_time", { ascending: false });

      if (erroAgendamentos) throw erroAgendamentos;
      setAgendamentos((dadosAgendamentos || []) as any);
    } catch (err: any) {
      console.error("Erro ao carregar relatório financeiro:", err);
    } finally {
      setCarregando(false);
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

        await buscarDadosFinanceiros();
      } catch (err) {
        console.error("Erro de autenticação no financeiro:", err);
        router.push("/login");
      }
    };

    verificarAutenticacaoEBuscar();
  }, [router]);

  const aoAplicarFiltro = () => {
    buscarDadosFinanceiros();
  };

  // Agregações por barbeiro
  const mapaEstatisticasBarbeiros: { [id: string]: BarberStat } = {};

  // Inicializa todos os barbeiros
  barbeiros.forEach((b) => {
    mapaEstatisticasBarbeiros[b.id] = {
      id: b.id,
      name: b.name,
      rate: Number(b.commission_rate),
      cutsCount: 0,
      totalRevenue: 0,
      totalCommission: 0
    };
  });

  // Calcula com base nos agendamentos
  agendamentos.forEach((app) => {
    const barberId = app.barbers?.id;
    if (!barberId) return;

    if (!mapaEstatisticasBarbeiros[barberId]) {
      mapaEstatisticasBarbeiros[barberId] = {
        id: barberId,
        name: app.barbers?.name || "Barbeiro Inativo",
        rate: Number(app.barbers?.commission_rate || 0),
        cutsCount: 0,
        totalRevenue: 0,
        totalCommission: 0
      };
    }

    const stat = mapaEstatisticasBarbeiros[barberId];
    stat.cutsCount += 1;
    stat.totalRevenue += Number(app.price);
    stat.totalCommission += Number(app.price) * stat.rate;
  });

  const listaEstatisticasBarbeiros = Object.values(mapaEstatisticasBarbeiros).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Totais Gerais
  const faturamentoBruto = agendamentos.reduce((sum, a) => sum + Number(a.price), 0);
  const totalComissoes = listaEstatisticasBarbeiros.reduce((sum, b) => sum + b.totalCommission, 0);
  const lucroLiquido = faturamentoBruto - totalComissoes;

  // Exportar dados para CSV
  const aoExportarCSV = () => {
    if (agendamentos.length === 0) return;

    // Cabeçalhos do CSV
    const headers = [
      "ID Agendamento",
      "Data/Hora (Rondônia)",
      "Cliente",
      "Barbeiro",
      "Serviço",
      "Valor do Serviço (R$)",
      "Taxa de Comissão Barbeiro (%)",
      "Comissão Paga (R$)",
      "Lucro Líquido Barbearia (R$)"
    ];

    // Linhas correspondentes
    const rows = agendamentos.map((app) => {
      const barberName = app.barbers?.name || "Sem Barbeiro";
      const serviceName = app.services?.name || "Sem Serviço";
      const clientName = app.profiles?.name || "Sem Cliente";
      const dateFormatted = formatToRondoniaTime(app.start_time);
      const price = Number(app.price);
      const rate = Number(app.barbers?.commission_rate || 0);
      const commission = price * rate;
      const profit = price - commission;

      return [
        `"${app.id}"`,
        `"${dateFormatted}"`,
        `"${clientName}"`,
        `"${barberName}"`,
        `"${serviceName}"`,
        price.toFixed(2),
        `"${(rate * 100).toFixed(0)}%"`,
        commission.toFixed(2),
        profit.toFixed(2)
      ];
    });

    // Resumo no final do arquivo CSV
    const summaryRows = [
      [],
      ["RESUMO FINANCEIRO DO PERÍODO"],
      ["Intervalo de Datas", `"${dataInicial} a ${dataFinal}"`],
      ["Faturamento Bruto Total", `"${faturamentoBruto.toFixed(2)}"`],
      ["Total de Comissões Pagas", `"${totalComissoes.toFixed(2)}"`],
      ["Lucro Líquido da Barbearia", `"${lucroLiquido.toFixed(2)}"`],
      ["Total de Cortes Concluídos", agendamentos.length]
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [
        headers.join(","),
        ...rows.map((e) => e.join(",")),
        ...summaryRows.map((e) => e.join(","))
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sr_quin_relatorio_financeiro_${dataInicial}_a_${dataFinal}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Acionar impressão e geração de PDF nativa
  const aoImprimirPDF = () => {
    window.print();
  };

  return {
    carregando,
    barbeiros,
    agendamentos,
    dataInicial,
    setDataInicial,
    dataFinal,
    setDataFinal,
    aoAplicarFiltro,
    listaEstatisticasBarbeiros,
    faturamentoBruto,
    totalComissoes,
    lucroLiquido,
    aoExportarCSV,
    aoImprimirPDF,
  };
}
