"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Sem next/link para evitar incompatibilidades de tipo React 18/19 no JSX do Monorepo
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export default function ServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  
  // Estados para criação de serviço
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Buscar serviços do Supabase
  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar serviços:", err);
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

        await fetchServices();
      } catch (err) {
        console.error("Erro na autenticação:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  // Cadastrar novo serviço
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage(null);

    const priceNum = parseFloat(price);
    const durationNum = parseInt(duration, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage("Por favor, insira um preço válido maior que zero.");
      setSubmitLoading(false);
      return;
    }

    if (isNaN(durationNum) || durationNum <= 0) {
      setErrorMessage("Por favor, insira uma duração válida maior que zero.");
      setSubmitLoading(false);
      return;
    }

    try {
      // @ts-ignore
      const { error } = await supabase.from("services").insert([{ name, description: description || null, price: priceNum, duration_minutes: durationNum, is_active: true } as any]);

      if (error) throw error;

      // Limpa os campos e fecha o formulário
      setName("");
      setDescription("");
      setPrice("");
      setDuration("");
      setShowAddForm(false);

      // Recarrega lista
      await fetchServices();
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar serviço.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Ativar / Desativar serviço
  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    try {
      // @ts-ignore
      const { error } = await supabase.from("services").update({ is_active: !currentStatus }).eq("id", serviceId);

      if (error) throw error;
      
      // Atualiza localmente
      setServices(prev => 
        prev.map(s => s.id === serviceId ? { ...s, is_active: !currentStatus } : s)
      );
    } catch (err: any) {
      alert(`Erro ao atualizar serviço: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">
            Carregando Catálogo...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none" />

      {/* Barra de Navegação Premium Responsiva */}
      <Header activePage="services" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-10">
        
        {/* Cabeçalho */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Gerenciamento</span>
            <h1 className="font-display text-3xl font-light text-white">Catálogo de Serviços</h1>
            <p className="text-xs text-slate-400 font-light">Crie e configure todos os cortes, tratamentos e serviços oferecidos.</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#d4af37] hover:bg-[#c5a130] text-black font-bold text-xs rounded-lg px-6 py-3 tracking-widest transition duration-300 shadow-[0_4px_20px_rgba(212,175,55,0.2)]"
          >
            {showAddForm ? "CANCELAR" : "NOVO SERVIÇO"}
          </button>
        </section>

        {/* Formulário de Cadastro (Efeito Acordeão) */}
        {showAddForm && (
          <section className="bg-[#121215] border border-[#d4af37]/30 rounded-xl p-8 max-w-2xl mx-auto shadow-2xl animate-fade-in">
            <h3 className="text-lg font-semibold text-white tracking-wide mb-6 text-center">Cadastrar Novo Serviço</h3>
            
            {errorMessage && (
              <div className="mb-6 p-4 rounded-lg bg-[#7f1d1d]/20 border border-[#b91c1c]/40 text-[#f87171] text-xs">
                ⚠️ {errorMessage}
              </div>
            )}

            <form onSubmit={handleAddService} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê + Barba Completa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 50.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Duração (Minutos)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 45"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Descrição (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Lavagem com shampoo premium, corte com acabamento navalhado e aplicação de pomada finalizadora modeladora."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="w-full bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black font-bold text-xs py-3.5 rounded-lg tracking-widest transition duration-300 shadow-lg"
              >
                {submitLoading ? "CADASTRANDO..." : "CADASTRAR SERVIÇO"}
              </button>
            </form>
          </section>
        )}

        {/* Grid de Serviços Existentes */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.length === 0 ? (
            <div className="col-span-full bg-[#121215] border border-[#27272a] rounded-xl p-12 text-center text-slate-500 font-light text-sm">
              Nenhum serviço cadastrado no catálogo. Clique em "Novo Serviço" para começar.
            </div>
          ) : (
            services.map((service) => (
              <div 
                key={service.id} 
                className={`bg-[#121215] border rounded-xl p-6 space-y-6 flex flex-col justify-between transition duration-300 ${
                  service.is_active 
                    ? "border-[#27272a] hover:border-[#d4af37]/40" 
                    : "border-[#27272a]/30 opacity-60"
                }`}
              >
                {/* Nome e Duração */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-semibold text-lg text-white tracking-wide">{service.name}</h3>
                    <span className="text-xs font-mono bg-[#0a0a0c] border border-[#27272a] px-2.5 py-1 rounded-md text-[#d4af37]">
                      {service.duration_minutes} min
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed font-light">
                    {service.description || "Nenhuma descrição fornecida para este serviço."}
                  </p>
                </div>

                {/* Preço e Status */}
                <div className="pt-4 border-t border-[#27272a]/50 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">Preço</span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5">
                      R$ {Number(service.price).toFixed(2)}
                    </span>
                  </div>

                  {/* Toggle de Ativo */}
                  <button
                    onClick={() => handleToggleActive(service.id, service.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase border transition duration-200 ${
                      service.is_active
                        ? "bg-green-500/10 text-green-400 border-green-500/30 hover:border-green-500/80"
                        : "bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-500/80"
                    }`}
                  >
                    {service.is_active ? "ATIVO" : "INATIVO"}
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
