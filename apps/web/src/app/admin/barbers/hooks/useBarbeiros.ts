import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BarberItem, WorkHourModalItem } from "../tipos";

export function useBarbeiros() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [barbeiros, setBarbeiros] = useState<BarberItem[]>([]);

  // Estados para criação
  const [exibirFormularioCadastro, setExibirFormularioCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [bio, setBio] = useState("");
  const [comissao, setComissao] = useState("");
  const [urlAvatar, setUrlAvatar] = useState("");
  const [carregandoEnvio, setCarregandoEnvio] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Estados para escala de trabalho
  const [barbeiroSelecionadoParaEscala, setBarbeiroSelecionadoParaEscala] = useState<BarberItem | null>(null);
  const [exibirModalEscala, setExibirModalEscala] = useState(false);
  const [escalaModal, setEscalaModal] = useState<WorkHourModalItem[]>([]);
  const [carregandoModal, setCarregandoModal] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Estados para edição cadastral
  const [barbeiroSelecionadoParaEdicao, setBarbeiroSelecionadoParaEdicao] = useState<BarberItem | null>(null);
  const [exibirFormularioEdicao, setExibirFormularioEdicao] = useState(false);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [bioEdicao, setBioEdicao] = useState("");
  const [comissaoEdicao, setComissaoEdicao] = useState("");
  const [urlAvatarEdicao, setUrlAvatarEdicao] = useState("");
  const [mensagemErroEdicao, setMensagemErroEdicao] = useState<string | null>(null);

  const buscarBarbeiros = async () => {
    try {
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setBarbeiros(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar barbeiros:", err);
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

        await buscarBarbeiros();
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

    const taxaComissao = parseFloat(comissao);

    if (isNaN(taxaComissao) || taxaComissao < 0 || taxaComissao > 1) {
      setMensagemErro("Por favor, insira uma taxa de comissão válida como decimal entre 0.00 e 1.00 (ex: 0.50 para 50%).");
      setCarregandoEnvio(false);
      return;
    }

    try {
      // @ts-ignore
      const { data: novoBarbeiroData, error: erroBarbeiro } = await supabase.from("barbers").insert([{ name: nome, bio: bio || null, avatar_url: urlAvatar || null, commission_rate: taxaComissao, is_active: true }]).select().single();
      const novoBarbeiro = novoBarbeiroData as any;

      if (erroBarbeiro) throw erroBarbeiro;

      // Gerar expediente padrão automático: Segunda (1) a Sábado (6) das 08:00 às 18:00
      const expedientePadrao = [1, 2, 3, 4, 5, 6].map(dia => ({
        barber_id: novoBarbeiro.id,
        day_of_week: dia,
        start_time: "08:00:00",
        end_time: "18:00:00",
      }));

      // @ts-ignore
      const { error: erroHoras } = await supabase.from("barber_work_hours").insert(expedientePadrao as any);

      if (erroHoras) throw erroHoras;

      setNome("");
      setBio("");
      setComissao("");
      setUrlAvatar("");
      setExibirFormularioCadastro(false);

      await buscarBarbeiros();
    } catch (err: any) {
      setMensagemErro(err.message || "Erro ao salvar barbeiro.");
    } finally {
      setCarregandoEnvio(false);
    }
  };

  const aoAlternarAtivo = async (idBarbeiro: string, statusAtual: boolean) => {
    try {
      // @ts-ignore
      const { error } = await supabase.from("barbers").update({ is_active: !statusAtual }).eq("id", idBarbeiro);

      if (error) throw error;

      setBarbeiros(prev =>
        prev.map(b => b.id === idBarbeiro ? { ...b, is_active: !statusAtual } : b)
      );
    } catch (err: any) {
      alert(`Erro ao atualizar barbeiro: ${err.message}`);
    }
  };

  const aoAbrirEscala = async (barbeiro: BarberItem) => {
    setBarbeiroSelecionadoParaEscala(barbeiro);
    setExibirModalEscala(true);
    setCarregandoModal(true);
    setErroModal(null);

    try {
      const { data, error } = await supabase
        .from("barber_work_hours")
        .select("*")
        .eq("barber_id", barbeiro.id);

      if (error) throw error;

      // Inicializa os 7 dias (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
      const escalaInicial = Array.from({ length: 7 }, (_, i) => {
        const registroDb = (data as any[])?.find((r: any) => r.day_of_week === i);
        return {
          day_of_week: i,
          is_working: !!registroDb,
          start_time: registroDb?.start_time ? registroDb.start_time.substring(0, 5) : "08:00",
          end_time: registroDb?.end_time ? registroDb.end_time.substring(0, 5) : "18:00",
          lunch_start: registroDb?.lunch_start ? registroDb.lunch_start.substring(0, 5) : "12:00",
          lunch_end: registroDb?.lunch_end ? registroDb.lunch_end.substring(0, 5) : "13:00",
        };
      });

      setEscalaModal(escalaInicial);
    } catch (err: any) {
      setErroModal("Erro ao carregar escala de trabalho.");
      console.error(err);
    } finally {
      setCarregandoModal(false);
    }
  };

  const aoSalvarEscala = async () => {
    if (!barbeiroSelecionadoParaEscala) return;
    setCarregandoModal(true);
    setErroModal(null);

    // Validação local de horários de almoço
    for (const h of escalaModal) {
      if (h.is_working) {
        if (h.lunch_start || h.lunch_end) {
          if (!h.lunch_start || !h.lunch_end) {
            setErroModal(`Para dias de expediente ativo, configure o início e fim do almoço.`);
            setCarregandoModal(false);
            return;
          }
          if (h.lunch_start >= h.lunch_end) {
            setErroModal(`O início do almoço deve ser anterior ao fim.`);
            setCarregandoModal(false);
            return;
          }
          if (h.lunch_start < h.start_time || h.lunch_end > h.end_time) {
            setErroModal(`O almoço deve estar dentro do expediente de trabalho (${h.start_time} às ${h.end_time}).`);
            setCarregandoModal(false);
            return;
          }
        }
      }
    }

    try {
      const { error: erroDelecao } = await supabase
        .from("barber_work_hours")
        .delete()
        .eq("barber_id", barbeiroSelecionadoParaEscala.id);

      if (erroDelecao) throw erroDelecao;

      const expedientesParaInserir = escalaModal
        .filter(h => h.is_working)
        .map(h => ({
          barber_id: barbeiroSelecionadoParaEscala.id,
          day_of_week: h.day_of_week,
          start_time: `${h.start_time}:00`,
          end_time: `${h.end_time}:00`,
          lunch_start: h.lunch_start ? `${h.lunch_start}:00` : null,
          lunch_end: h.lunch_end ? `${h.lunch_end}:00` : null,
        }));

      if (expedientesParaInserir.length > 0) {
        const { error: erroInsercao } = await supabase
          .from("barber_work_hours")
          .insert(expedientesParaInserir as any);

        if (erroInsercao) throw erroInsercao;
      }

      setExibirModalEscala(false);
      setBarbeiroSelecionadoParaEscala(null);
    } catch (err: any) {
      setErroModal(err.message || "Erro ao salvar escala de trabalho.");
      console.error(err);
    } finally {
      setCarregandoModal(false);
    }
  };

  const aoAbrirEdicao = (barbeiro: BarberItem) => {
    setBarbeiroSelecionadoParaEdicao(barbeiro);
    setNomeEdicao(barbeiro.name);
    setBioEdicao(barbeiro.bio || "");
    setComissaoEdicao(String(barbeiro.commission_rate));
    setUrlAvatarEdicao(barbeiro.avatar_url || "");
    setMensagemErroEdicao(null);
    setExibirFormularioEdicao(true);
  };

  const aoEnviarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barbeiroSelecionadoParaEdicao) return;
    setCarregandoEnvio(true);
    setMensagemErroEdicao(null);

    const taxaComissao = parseFloat(comissaoEdicao);

    if (isNaN(taxaComissao) || taxaComissao < 0 || taxaComissao > 1) {
      setMensagemErroEdicao("Por favor, insira uma taxa de comissão válida como decimal entre 0.00 e 1.00 (ex: 0.50 para 50%).");
      setCarregandoEnvio(false);
      return;
    }

    try {
      const { error } = await (supabase.from("barbers") as any)
        .update({
          name: nomeEdicao,
          bio: bioEdicao || null,
          commission_rate: taxaComissao,
          avatar_url: urlAvatarEdicao || null,
        })
        .eq("id", barbeiroSelecionadoParaEdicao.id);

      if (error) throw error;

      setExibirFormularioEdicao(false);
      setBarbeiroSelecionadoParaEdicao(null);
      await buscarBarbeiros();
    } catch (err: any) {
      setMensagemErroEdicao(err.message || "Erro ao editar barbeiro.");
    } finally {
      setCarregandoEnvio(false);
    }
  };

  return {
    carregando,
    barbeiros,
    exibirFormularioCadastro,
    setExibirFormularioCadastro,
    nome,
    setNome,
    bio,
    setBio,
    comissao,
    setComissao,
    urlAvatar,
    setUrlAvatar,
    carregandoEnvio,
    mensagemErro,
    barbeiroSelecionadoParaEscala,
    setBarbeiroSelecionadoParaEscala,
    exibirModalEscala,
    setExibirModalEscala,
    escalaModal,
    setEscalaModal,
    carregandoModal,
    erroModal,
    barbeiroSelecionadoParaEdicao,
    setBarbeiroSelecionadoParaEdicao,
    exibirFormularioEdicao,
    setExibirFormularioEdicao,
    nomeEdicao,
    setNomeEdicao,
    bioEdicao,
    setBioEdicao,
    comissaoEdicao,
    setComissaoEdicao,
    urlAvatarEdicao,
    setUrlAvatarEdicao,
    mensagemErroEdicao,
    aoEnviarCadastro,
    aoAlternarAtivo,
    aoAbrirEscala,
    aoSalvarEscala,
    aoAbrirEdicao,
    aoEnviarEdicao,
  };
}
