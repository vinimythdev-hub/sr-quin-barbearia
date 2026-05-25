"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Sem next/link para evitar incompatibilidades de tipo React 18/19 no JSX do Monorepo
import { supabase } from "@/lib/supabase";

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

      {/* Barra de Navegação */}
      <header className="border-b border-[#27272a]/50 bg-[#121215]/50 backdrop-blur-md sticky top-0 z-50 px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-[#0a0a0c]">
            <span className="font-display text-lg font-bold text-[#d4af37]">Q</span>
          </div>
          <div className="flex flex-col">
            <h2 className="font-display text-lg font-light tracking-widest leading-none text-[#f3f4f6]">
              SR. QUIN
            </h2>
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#d4af37] font-semibold mt-1">
              BARBEARIA
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest text-[#a1a1aa]">
          <a href="/" className="hover:text-[#d4af37] transition duration-200">
            PAINEL PRINCIPAL
          </a>
          <a href="/admin/services" className="hover:text-[#d4af37] transition duration-200">
            CATÁLOGO DE SERVIÇOS
          </a>
          <a href="/admin/barbers" className="text-[#d4af37] font-bold">
            EQUIPE / BARBEIROS
          </a>
        </nav>

        <div>
          <a 
            href="/"
            className="border border-[#d4af37]/40 hover:border-[#d4af37] bg-transparent text-[#d4af37] px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition duration-300"
          >
            VOLTAR
          </a>
        </div>
      </header>

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

                {/* Biografia */}
                <p className="text-slate-400 text-xs leading-relaxed font-light min-h-[40px]">
                  {barber.bio || "Nenhuma biografia disponível para este barbeiro."}
                </p>

                {/* Status e Escala */}
                <div className="pt-4 border-t border-[#27272a]/50 flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-wider text-[#a1a1aa] font-mono">
                    Escala: Seg a Sáb (08h - 18h)
                  </span>

                  {/* Toggle de Ativo */}
                  <button
                    onClick={() => handleToggleActive(barber.id, barber.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition duration-200 ${
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

      {/* Rodapé */}
      <footer className="border-t border-[#27272a]/30 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>
    </div>
  );
}
