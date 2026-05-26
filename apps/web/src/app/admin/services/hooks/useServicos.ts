import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ServiceItem } from "../tipos";

export function useServicos() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [servicos, setServicos] = useState<ServiceItem[]>([]);

  // Estados para criação
  const [exibirFormularioCadastro, setExibirFormularioCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("");
  const [carregandoEnvio, setCarregandoEnvio] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Estados para edição
  const [servicoSelecionadoParaEdicao, setServicoSelecionadoParaEdicao] = useState<ServiceItem | null>(null);
  const [exibirFormularioEdicao, setExibirFormularioEdicao] = useState(false);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [descricaoEdicao, setDescricaoEdicao] = useState("");
  const [precoEdicao, setPrecoEdicao] = useState("");
  const [duracaoEdicao, setDuracaoEdicao] = useState("");
  const [mensagemErroEdicao, setMensagemErroEdicao] = useState<string | null>(null);

  const buscarServicos = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setServicos(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar serviços:", err);
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

        await buscarServicos();
      } catch (err) {
        console.error("Erro na autenticação:", err);
        router.push("/login");
      } finally {
        setCarregando(false);
      }
    };

    verificarAutenticacaoEBuscar();
  }, [router]);

  const aoEnviarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregandoEnvio(true);
    setMensagemErro(null);

    const valorPreco = parseFloat(preco);
    const valorDuracao = parseInt(duracao, 10);

    if (isNaN(valorPreco) || valorPreco <= 0) {
      setMensagemErro("Por favor, insira um preço válido maior que zero.");
      setCarregandoEnvio(false);
      return;
    }

    if (isNaN(valorDuracao) || valorDuracao <= 0) {
      setMensagemErro("Por favor, insira uma duração válida maior que zero.");
      setCarregandoEnvio(false);
      return;
    }

    try {
      // @ts-ignore
      const { error } = await supabase.from("services").insert([{ name: nome, description: descricao || null, price: valorPreco, duration_minutes: valorDuracao, is_active: true } as any]);

      if (error) throw error;

      setNome("");
      setDescricao("");
      setPreco("");
      setDuracao("");
      setExibirFormularioCadastro(false);

      await buscarServicos();
    } catch (err: any) {
      setMensagemErro(err.message || "Erro ao salvar serviço.");
    } finally {
      setCarregandoEnvio(false);
    }
  };

  const aoAlternarAtivo = async (idServico: string, statusAtual: boolean) => {
    try {
      // @ts-ignore
      const { error } = await supabase.from("services").update({ is_active: !statusAtual }).eq("id", idServico);

      if (error) throw error;

      setServicos(prev =>
        prev.map(s => s.id === idServico ? { ...s, is_active: !statusAtual } : s)
      );
    } catch (err: any) {
      alert(`Erro ao atualizar serviço: ${err.message}`);
    }
  };

  const aoAbrirEdicao = (servico: ServiceItem) => {
    setServicoSelecionadoParaEdicao(servico);
    setNomeEdicao(servico.name);
    setDescricaoEdicao(servico.description || "");
    setPrecoEdicao(String(servico.price));
    setDuracaoEdicao(String(servico.duration_minutes));
    setMensagemErroEdicao(null);
    setExibirFormularioEdicao(true);
  };

  const aoEnviarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicoSelecionadoParaEdicao) return;
    setCarregandoEnvio(true);
    setMensagemErroEdicao(null);

    const valorPreco = parseFloat(precoEdicao);
    const valorDuracao = parseInt(duracaoEdicao, 10);

    if (isNaN(valorPreco) || valorPreco <= 0) {
      setMensagemErroEdicao("Por favor, insira um preço válido maior que zero.");
      setCarregandoEnvio(false);
      return;
    }

    if (isNaN(valorDuracao) || valorDuracao <= 0) {
      setMensagemErroEdicao("Por favor, insira uma duração válida maior que zero.");
      setCarregandoEnvio(false);
      return;
    }

    try {
      const { error } = await (supabase.from("services") as any)
        .update({
          name: nomeEdicao,
          description: descricaoEdicao || null,
          price: valorPreco,
          duration_minutes: valorDuracao,
        })
        .eq("id", servicoSelecionadoParaEdicao.id);

      if (error) throw error;

      setExibirFormularioEdicao(false);
      setServicoSelecionadoParaEdicao(null);
      await buscarServicos();
    } catch (err: any) {
      setMensagemErroEdicao(err.message || "Erro ao editar serviço.");
    } finally {
      setCarregandoEnvio(false);
    }
  };

  return {
    carregando,
    servicos,
    exibirFormularioCadastro,
    setExibirFormularioCadastro,
    nome,
    setNome,
    descricao,
    setDescricao,
    preco,
    setPreco,
    duracao,
    setDuracao,
    carregandoEnvio,
    mensagemErro,
    servicoSelecionadoParaEdicao,
    exibirFormularioEdicao,
    setExibirFormularioEdicao,
    nomeEdicao,
    setNomeEdicao,
    descricaoEdicao,
    setDescricaoEdicao,
    precoEdicao,
    setPrecoEdicao,
    duracaoEdicao,
    setDuracaoEdicao,
    mensagemErroEdicao,
    aoEnviarCadastro,
    aoAlternarAtivo,
    aoAbrirEdicao,
    aoEnviarEdicao,
  };
}
