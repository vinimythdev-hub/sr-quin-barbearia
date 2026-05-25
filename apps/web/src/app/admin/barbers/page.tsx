"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Sem next/link para evitar incompatibilidades de tipo React 18/19 no JSX do Monorepo
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

interface BarberItem {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export default function BarbersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barbers, setBarbers] = useState<BarberItem[]>([]);
  
  // Estados para criação de barbeiro
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [commission, setCommission] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados para edição de escala de trabalho
  const [selectedBarberForHours, setSelectedBarberForHours] = useState<BarberItem | null>(null);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [modalHours, setModalHours] = useState<{
    day_of_week: number;
    is_working: boolean;
    start_time: string;
    end_time: string;
    lunch_start: string;
    lunch_end: string;
  }[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Estados para edição cadastral de barbeiro
  const [selectedBarberForEdit, setSelectedBarberForEdit] = useState<BarberItem | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editBarberName, setEditBarberName] = useState("");
  const [editBarberBio, setEditBarberBio] = useState("");
  const [editBarberCommission, setEditBarberCommission] = useState("");
  const [editBarberAvatarUrl, setEditBarberAvatarUrl] = useState("");
  const [editBarberErrorMessage, setEditBarberErrorMessage] = useState<string | null>(null);

  // Buscar barbeiros do Supabase
  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setBarbers(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar barbeiros:", err);
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

        await fetchBarbers();
      } catch (err) {
        console.error("Erro na autenticação:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  // Cadastrar novo barbeiro + expediente padrão automático
  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage(null);

    const commRate = parseFloat(commission);

    if (isNaN(commRate) || commRate < 0 || commRate > 1) {
      setErrorMessage("Por favor, insira uma taxa de comissão válida como decimal entre 0.00 e 1.00 (ex: 0.50 para 50%).");
      setSubmitLoading(false);
      return;
    }

    try {
      // @ts-ignore
      const { data: newBarberData, error: barberError } = await supabase.from("barbers").insert([{ name, bio: bio || null, avatar_url: avatarUrl || null, commission_rate: commRate, is_active: true }]).select().single();
      const newBarber = newBarberData as any;

      if (barberError) throw barberError;

      // 2. Gerar expediente padrão automático na tabela barber_work_hours
      // Cria escala padrão: Segunda (1) a Sábado (6) das 08:00 às 18:00
      const defaultWorkHours = [1, 2, 3, 4, 5, 6].map(day => ({
        barber_id: newBarber.id,
        day_of_week: day,
        start_time: "08:00:00",
        end_time: "18:00:00",
      }));

      // @ts-ignore
      const { error: hoursError } = await supabase.from("barber_work_hours").insert(defaultWorkHours as any);

      if (hoursError) throw hoursError;

      // Limpa os campos e fecha o formulário
      setName("");
      setBio("");
      setCommission("");
      setAvatarUrl("");
      setShowAddForm(false);

      // Recarrega lista
      await fetchBarbers();
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar barbeiro.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Ativar / Desativar barbeiro
  const handleToggleActive = async (barberId: string, currentStatus: boolean) => {
    try {
      // @ts-ignore
      const { error } = await supabase.from("barbers").update({ is_active: !currentStatus }).eq("id", barberId);

      if (error) throw error;
      
      // Atualiza localmente
      setBarbers(prev => 
        prev.map(b => b.id === barberId ? { ...b, is_active: !currentStatus } : b)
      );
    } catch (err: any) {
      alert(`Erro ao atualizar barbeiro: ${err.message}`);
    }
  };

  const handleOpenHoursModal = async (barber: BarberItem) => {
    setSelectedBarberForHours(barber);
    setShowHoursModal(true);
    setModalLoading(true);
    setModalError(null);

    try {
      const { data, error } = await supabase
        .from("barber_work_hours")
        .select("*")
        .eq("barber_id", barber.id);

      if (error) throw error;

      // Inicializa todos os 7 dias (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
      const initialHours = Array.from({ length: 7 }, (_, i) => {
        const dbRecord = (data as any[])?.find((r: any) => r.day_of_week === i);
        return {
          day_of_week: i,
          is_working: !!dbRecord,
          start_time: dbRecord?.start_time ? dbRecord.start_time.substring(0, 5) : "08:00",
          end_time: dbRecord?.end_time ? dbRecord.end_time.substring(0, 5) : "18:00",
          lunch_start: dbRecord?.lunch_start ? dbRecord.lunch_start.substring(0, 5) : "12:00",
          lunch_end: dbRecord?.lunch_end ? dbRecord.lunch_end.substring(0, 5) : "13:00",
        };
      });

      setModalHours(initialHours);
    } catch (err: any) {
      setModalError("Erro ao carregar escala de trabalho.");
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleSaveHours = async () => {
    if (!selectedBarberForHours) return;
    setModalLoading(true);
    setModalError(null);

    // Validação local de horários de almoço
    for (const h of modalHours) {
      if (h.is_working) {
        if (h.lunch_start || h.lunch_end) {
          if (!h.lunch_start || !h.lunch_end) {
            setModalError(`Para dias de expediente ativo, configure o início e fim do almoço.`);
            setModalLoading(false);
            return;
          }
          if (h.lunch_start >= h.lunch_end) {
            setModalError(`O início do almoço deve ser anterior ao fim.`);
            setModalLoading(false);
            return;
          }
          if (h.lunch_start < h.start_time || h.lunch_end > h.end_time) {
            setModalError(`O almoço deve estar dentro do expediente de trabalho (${h.start_time} às ${h.end_time}).`);
            setModalLoading(false);
            return;
          }
        }
      }
    }

    try {
      // 1. Deleta todas as horas de trabalho atuais do barbeiro
      const { error: deleteError } = await supabase
        .from("barber_work_hours")
        .delete()
        .eq("barber_id", selectedBarberForHours.id);

      if (deleteError) throw deleteError;

      // 2. Insere somente as horas dos dias em que ele trabalha
      const hoursToInsert = modalHours
        .filter(h => h.is_working)
        .map(h => ({
          barber_id: selectedBarberForHours.id,
          day_of_week: h.day_of_week,
          start_time: `${h.start_time}:00`,
          end_time: `${h.end_time}:00`,
          lunch_start: h.lunch_start ? `${h.lunch_start}:00` : null,
          lunch_end: h.lunch_end ? `${h.lunch_end}:00` : null,
        }));

      if (hoursToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("barber_work_hours")
          .insert(hoursToInsert as any);

        if (insertError) throw insertError;
      }

      setShowHoursModal(false);
      setSelectedBarberForHours(null);
    } catch (err: any) {
      setModalError(err.message || "Erro ao salvar escala de trabalho.");
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditBarberModal = (barber: BarberItem) => {
    setSelectedBarberForEdit(barber);
    setEditBarberName(barber.name);
    setEditBarberBio(barber.bio || "");
    setEditBarberCommission(String(barber.commission_rate));
    setEditBarberAvatarUrl(barber.avatar_url || "");
    setEditBarberErrorMessage(null);
    setShowEditForm(true);
  };

  const handleEditBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarberForEdit) return;
    setSubmitLoading(true);
    setEditBarberErrorMessage(null);

    const commRate = parseFloat(editBarberCommission);

    if (isNaN(commRate) || commRate < 0 || commRate > 1) {
      setEditBarberErrorMessage("Por favor, insira uma taxa de comissão válida como decimal entre 0.00 e 1.00 (ex: 0.50 para 50%).");
      setSubmitLoading(false);
      return;
    }

    try {
      const { error } = await (supabase.from("barbers") as any)
        .update({
          name: editBarberName,
          bio: editBarberBio || null,
          commission_rate: commRate,
          avatar_url: editBarberAvatarUrl || null,
        })
        .eq("id", selectedBarberForEdit.id);

      if (error) throw error;

      setShowEditForm(false);
      setSelectedBarberForEdit(null);
      await fetchBarbers();
    } catch (err: any) {
      setEditBarberErrorMessage(err.message || "Erro ao editar barbeiro.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">
            Carregando Equipe...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none" />

      {/* Barra de Navegação Premium Responsiva */}
      <Header activePage="barbers" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-10">
        
        {/* Cabeçalho */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Equipe de Elite</span>
            <h1 className="font-display text-3xl font-light text-white">Nossos Barbeiros</h1>
            <p className="text-xs text-slate-400 font-light">Gerencie os profissionais, comissões de serviço e horários de expediente.</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#d4af37] hover:bg-[#c5a130] text-black font-bold text-xs rounded-lg px-6 py-3 tracking-widest transition duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)]"
          >
            {showAddForm ? "CANCELAR" : "NOVO BARBEIRO"}
          </button>
        </section>

        {/* Formulário de Cadastro (Efeito Acordeão) */}
        {showAddForm && (
          <section className="bg-[#121215] border border-[#d4af37]/30 rounded-xl p-8 max-w-2xl mx-auto shadow-2xl animate-fade-in">
            <h3 className="text-lg font-semibold text-white tracking-wide mb-6 text-center">Cadastrar Novo Barbeiro</h3>
            
            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-[#7f1d1d]/20 border border-[#b91c1c]/40 text-[#f87171] text-xs">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleAddBarber} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Nome do Barbeiro</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Oliveira"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Taxa de Comissão (Decimal)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 0.50 para 50%"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">URL do Avatar / Foto (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: https://imagens.com/carlos.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Biologia / Especialidade</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Especialista em barba com toalha quente e cortes clássicos e artísticos."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition resize-none"
                />
              </div>

              <div className="p-4 bg-[#0a0a0c]/50 rounded-lg border border-[#27272a] space-y-1 text-center">
                <span className="text-xs text-[#d4af37] font-semibold">ℹ️ Escala de Trabalho Automatizada</span>
                <p className="text-[10px] text-slate-400 font-light">Este barbeiro será registrado automaticamente com a escala padrão de Porto Velho: Segunda a Sábado das 08:00 às 18:00.</p>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black font-bold text-xs py-3.5 rounded-lg tracking-widest transition duration-300 shadow-lg"
              >
                {submitLoading ? "CADASTRANDO..." : "CADASTRAR BARBEIRO"}
              </button>
            </form>
          </section>
        )}

        {/* Grid de Barbeiros Existentes */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.length === 0 ? (
            <div className="col-span-full bg-[#121215] border border-[#27272a] rounded-xl p-12 text-center text-slate-500 font-light text-sm">
              Nenhum profissional cadastrado. Clique em "Novo Barbeiro" para começar a estruturar sua equipe.
            </div>
          ) : (
            barbers.map((barber) => (
              <div 
                key={barber.id} 
                className={`bg-[#121215] border rounded-xl p-6 space-y-6 flex flex-col justify-between transition duration-300 ${
                  barber.is_active 
                    ? "border-[#27272a] hover:border-[#d4af37]/40" 
                    : "border-[#27272a]/30 opacity-60"
                }`}
              >
                {/* Header do Barbeiro */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-14 h-14 rounded-full border border-[#d4af37]/30 bg-[#0a0a0c] overflow-hidden flex items-center justify-center">
                      {barber.avatar_url ? (
                        <img src={barber.avatar_url} alt={barber.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-xl font-bold text-[#d4af37]">
                          {barber.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-base text-white tracking-wide">{barber.name}</h3>
                      <span className="text-[10px] text-[#d4af37] font-mono tracking-wider font-semibold">
                        Comissão: {(barber.commission_rate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleOpenEditBarberModal(barber)}
                    className="text-slate-400 hover:text-[#d4af37] transition p-1"
                    title="Editar Cadastro"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                </div>

                {/* Biografia */}
                <p className="text-slate-400 text-xs leading-relaxed font-light min-h-[40px]">
                  {barber.bio || "Nenhuma biografia disponível para este barbeiro."}
                </p>

                {/* Status e Escala */}
                <div className="pt-4 border-t border-[#27272a]/50 flex justify-between items-center gap-3">
                  <button
                    onClick={() => handleOpenHoursModal(barber)}
                    className="text-[9px] uppercase tracking-wider text-[#d4af37] font-semibold flex items-center gap-1.5 hover:text-white transition duration-200"
                  >
                    <svg className="w-3.5 h-3.5 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Ver / Editar Escala
                  </button>

                  {/* Toggle de Ativo */}
                  <button
                    onClick={() => handleToggleActive(barber.id, barber.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition duration-200 flex-shrink-0 ${
                      barber.is_active
                        ? "bg-green-500/10 text-green-400 border-green-500/30 hover:border-green-500/80"
                        : "bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500/80"
                    }`}
                  >
                    {barber.is_active ? "ATIVO" : "INATIVO"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>

      </main>

      {/* Modal de Escala de Trabalho (Shifts Editor) */}
      {showHoursModal && selectedBarberForHours && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-[#121215] border border-[#d4af37]/30 rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-[#27272a]/60 pb-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">CONFIGURAÇÃO DE EXPEDIENTE</span>
                <h3 className="text-lg font-semibold text-white tracking-wide mt-1">Escala de {selectedBarberForHours.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowHoursModal(false);
                  setSelectedBarberForHours(null);
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalError && (
              <div className="p-3.5 bg-red-950/20 border border-red-500/35 rounded-lg text-red-400 text-xs">
                ⚠️ {modalError}
              </div>
            )}

            {modalLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <span className="text-[10px] uppercase tracking-widest text-[#d4af37] font-mono">Salvando escala...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 font-light pb-2">
                  Marque os dias de expediente do profissional e configure os horários de início e término de turno.
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {modalHours.map((h) => {
                    const daysPt = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
                    return (
                      <div key={h.day_of_week} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0a0a0c] border border-[#27272a] rounded-lg">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={h.is_working}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setModalHours(prev =>
                                prev.map(item => item.day_of_week === h.day_of_week ? { ...item, is_working: checked } : item)
                              );
                            }}
                            className="w-4 h-4 accent-[#d4af37] rounded border-[#27272a] bg-[#121215]"
                          />
                          <span className={`text-xs font-semibold ${h.is_working ? "text-slate-100" : "text-slate-500"}`}>
                            {daysPt[h.day_of_week]}
                          </span>
                        </label>

                        {h.is_working ? (
                          <div className="flex flex-col gap-2 w-full sm:w-auto">
                            {/* Horário de Expediente */}
                            <div className="flex items-center justify-between sm:justify-end gap-2">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono sm:hidden">Expediente:</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="time"
                                  required
                                  value={h.start_time}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setModalHours(prev =>
                                      prev.map(item => item.day_of_week === h.day_of_week ? { ...item, start_time: val } : item)
                                    );
                                  }}
                                  className="bg-[#121215] border border-[#27272a]/80 focus:border-[#d4af37]/60 text-xs font-mono text-slate-200 rounded px-2 py-1 outline-none w-20"
                                />
                                <span className="text-[10px] text-slate-500 font-mono font-medium">às</span>
                                <input
                                  type="time"
                                  required
                                  value={h.end_time}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setModalHours(prev =>
                                      prev.map(item => item.day_of_week === h.day_of_week ? { ...item, end_time: val } : item)
                                    );
                                  }}
                                  className="bg-[#121215] border border-[#27272a]/80 focus:border-[#d4af37]/60 text-xs font-mono text-slate-200 rounded px-2 py-1 outline-none w-20"
                                />
                              </div>
                            </div>

                            {/* Horário de Almoço */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 border-t border-[#27272a]/40 pt-1.5 sm:border-t-0 sm:pt-0">
                              <span className="text-[10px] text-[#d4af37]/75 uppercase tracking-wider font-mono">Almoço:</span>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="time"
                                  value={h.lunch_start || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setModalHours(prev =>
                                      prev.map(item => item.day_of_week === h.day_of_week ? { ...item, lunch_start: val } : item)
                                    );
                                  }}
                                  className="bg-[#121215] border border-[#27272a]/80 focus:border-[#d4af37]/60 text-xs font-mono text-[#d4af37] rounded px-2 py-1 outline-none w-20"
                                />
                                <span className="text-[10px] text-slate-500 font-mono font-medium">às</span>
                                <input
                                  type="time"
                                  value={h.lunch_end || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setModalHours(prev =>
                                      prev.map(item => item.day_of_week === h.day_of_week ? { ...item, lunch_end: val } : item)
                                    );
                                  }}
                                  className="bg-[#121215] border border-[#27272a]/80 focus:border-[#d4af37]/60 text-xs font-mono text-[#d4af37] rounded px-2 py-1 outline-none w-20"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest font-semibold py-1">Folga</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3 pt-4 border-t border-[#27272a]/60">
                  <button
                    onClick={() => {
                      setShowHoursModal(false);
                      setSelectedBarberForHours(null);
                    }}
                    className="flex-1 bg-transparent hover:bg-[#27272a]/40 border border-[#27272a] text-[#a1a1aa] hover:text-white text-xs font-semibold py-3 rounded-lg tracking-widest uppercase transition duration-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveHours}
                    className="flex-1 bg-[#d4af37] hover:bg-[#c5a130] text-black text-xs font-bold py-3 rounded-lg tracking-widest uppercase transition duration-300 shadow-lg"
                  >
                    Salvar Escala
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Edição de Cadastro do Barbeiro */}
      {showEditForm && selectedBarberForEdit && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-y-auto">
          <div className="bg-[#121215] border border-[#d4af37]/30 rounded-xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex justify-between items-center border-b border-[#27272a]/60 pb-4">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-bold">AJUSTE DE CADASTRO</span>
                <h3 className="text-lg font-semibold text-white tracking-wide mt-1">Editar {selectedBarberForEdit.name}</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setSelectedBarberForEdit(null);
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {editBarberErrorMessage && (
              <div className="p-3.5 bg-red-950/20 border border-red-500/35 rounded-lg text-red-400 text-xs">
                ⚠️ {editBarberErrorMessage}
              </div>
            )}

            <form onSubmit={handleEditBarber} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Nome do Barbeiro</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Oliveira"
                    value={editBarberName}
                    onChange={(e) => setEditBarberName(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Taxa de Comissão (Decimal)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 0.50 para 50%"
                    value={editBarberCommission}
                    onChange={(e) => setEditBarberCommission(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">URL do Avatar / Foto (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: https://imagens.com/carlos.jpg"
                  value={editBarberAvatarUrl}
                  onChange={(e) => setEditBarberAvatarUrl(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Biologia / Especialidade</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Especialista em barba com toalha quente e cortes clássicos e artísticos."
                  value={editBarberBio}
                  onChange={(e) => setEditBarberBio(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-[#27272a]/60">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedBarberForEdit(null);
                  }}
                  className="flex-1 bg-transparent hover:bg-[#27272a]/40 border border-[#27272a] text-[#a1a1aa] hover:text-white text-xs font-semibold py-3 rounded-lg tracking-widest uppercase transition duration-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black text-xs font-bold py-3 rounded-lg tracking-widest uppercase transition duration-300 shadow-lg"
                >
                  {submitLoading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                </button>
              </div>
            </form>
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
