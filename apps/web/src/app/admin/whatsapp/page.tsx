"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";

interface WhatsappSettings {
  id?: string;
  api_url: string;
  instance_name: string;
  api_token: string;
  is_active: boolean;
}

interface LogItem {
  id: string;
  phone: string;
  type: 'confirmation' | 'reminder';
  scheduled_at: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  created_at: string;
}

export default function WhatsappAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<WhatsappSettings>({
    api_url: "",
    instance_name: "",
    api_token: "",
    is_active: true,
  });

  const [logs, setLogs] = useState<LogItem[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | null }>({
    text: "",
    type: null,
  });

  // Estado para teste de envio manual
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste da Barbearia Sr. Quin.");
  const [showTestForm, setShowTestForm] = useState(false);

  // Buscar dados de configurações e logs do Supabase
  const fetchData = async () => {
    try {
      // 1. Configurações de WhatsApp
      const { data: settingsData, error: settingsError } = await supabase
        .from("whatsapp_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (settingsError) throw settingsError;
      if (settingsData) {
        setSettings(settingsData as any);
      }

      // 2. Buscar fila de notificações recentes (últimos 15 registros)
      const { data: logsData, error: logsError } = await supabase
        .from("pending_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);

      if (logsError) throw logsError;
      setLogs((logsData || []) as any);

    } catch (err: any) {
      console.error("Erro ao buscar dados do WhatsApp:", err);
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

        await fetchData();
      } catch (err) {
        console.error("Erro na autenticação:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetch();
  }, [router]);

  // Salvar ou Atualizar configurações
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setStatusMessage({ text: "", type: null });

    try {
      let error;
      if (settings.id) {
        // Atualizar existente
        const { error: err } = await (supabase.from("whatsapp_settings") as any)
          .update({
            api_url: settings.api_url.trim(),
            instance_name: settings.instance_name.trim(),
            api_token: settings.api_token.trim(),
            is_active: settings.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);
        error = err;
      } else {
        // Criar nova
        const { data: newSettings, error: err } = await (supabase.from("whatsapp_settings") as any)
          .insert([
            {
              api_url: settings.api_url.trim(),
              instance_name: settings.instance_name.trim(),
              api_token: settings.api_token.trim(),
              is_active: settings.is_active,
            },
          ])
          .select()
          .single();
        error = err;
        if (newSettings) {
          setSettings(newSettings as any);
        }
      }

      if (error) throw error;
      setStatusMessage({ text: "Configurações salvas com sucesso!", type: "success" });
      await fetchData();
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Erro ao salvar configurações.", type: "error" });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Testar conexão enviando uma mensagem de teste
  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) {
      alert("Por favor, preencha o número de telefone para teste.");
      return;
    }
    setTestLoading(true);
    setStatusMessage({ text: "", type: null });

    try {
      let cleanedPhone = testPhone.replace(/\D/g, "");
      if (!cleanedPhone.startsWith("55") && cleanedPhone.length >= 10 && cleanedPhone.length <= 11) {
        cleanedPhone = "55" + cleanedPhone;
      }

      const response = await fetch(`${settings.api_url}/message/sendText/${settings.instance_name}`, {
        method: "POST",
        headers: {
          apikey: settings.api_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: cleanedPhone,
          options: {
            delay: 1200,
            presence: "composing",
          },
          textMessage: {
            text: testMessage,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API retornou erro ${response.status}: ${errorText}`);
      }

      setStatusMessage({
        text: `Mensagem de teste enviada com sucesso para ${cleanedPhone}! Verifique seu celular.`,
        type: "success",
      });
      setShowTestForm(false);
      setTestPhone("");
      await fetchData();

    } catch (err: any) {
      setStatusMessage({
        text: `Erro ao testar envio: ${err.message}. Verifique a URL, Token e se a Instância está conectada.`,
        type: "error",
      });
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-[#d4af37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#d4af37]/75 font-mono">
            Carregando Canal...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f3f4f6] relative flex flex-col">
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[120px] pointer-events-none" />

      {/* Barra de Navegação */}
      <Header activePage="whatsapp" />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-12 space-y-10">
        
        {/* Cabeçalho */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-bold">Integração Externa</span>
            <h1 className="font-display text-3xl font-light text-white">Configuração do WhatsApp</h1>
            <p className="text-xs text-slate-400 font-light">Conecte o seu número de WhatsApp via Evolution API para enviar confirmações e lembretes automáticos.</p>
          </div>
          {settings.id && settings.api_url && (
            <button
              onClick={() => setShowTestForm(!showTestForm)}
              className="bg-transparent hover:bg-[#d4af37]/5 border border-[#d4af37]/45 hover:border-[#d4af37] text-[#d4af37] font-bold text-xs rounded-lg px-6 py-3 tracking-widest transition duration-300"
            >
              {showTestForm ? "CANCELAR TESTE" : "ENVIAR MENSAGEM DE TESTE"}
            </button>
          )}
        </section>

        {/* Notificações de Status do Formulário */}
        {statusMessage.text && (
          <section className={`p-4 rounded-lg text-xs border ${
            statusMessage.type === "success" 
              ? "bg-green-950/20 border-green-500/35 text-green-400" 
              : "bg-red-950/20 border-red-500/35 text-red-400"
          }`}>
            {statusMessage.type === "success" ? "✓" : "⚠️"} {statusMessage.text}
          </section>
        )}

        {/* Form para Teste de WhatsApp */}
        {showTestForm && (
          <section className="bg-[#121215] border border-[#d4af37]/30 rounded-xl p-8 max-w-xl mx-auto shadow-2xl animate-fade-in space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white tracking-wide text-center">Enviar WhatsApp de Teste</h3>
              <p className="text-[11px] text-slate-400 font-light text-center mt-1">Valide se a credencial inserida consegue disparar mensagens em tempo real.</p>
            </div>
            
            <form onSubmit={handleSendTestMessage} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Celular do Destinatário (com DDD)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (69) 99999-9999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Mensagem</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Digite a mensagem..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={testLoading}
                className="w-full bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black font-bold text-xs py-3.5 rounded-lg tracking-widest transition duration-300 shadow-lg uppercase"
              >
                {testLoading ? "Disparando..." : "Enviar Teste"}
              </button>
            </form>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Card de Configurações Credenciais (Larga) */}
          <div className="lg:col-span-2 bg-[#121215] border border-[#27272a]/70 rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold tracking-wide text-white border-b border-[#27272a] pb-4">
              Credenciais da Evolution API
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">URL base da API (Sem barra no final)</label>
                <input
                  type="url"
                  required
                  placeholder="Ex: https://api.barbeariasucess.com"
                  value={settings.api_url}
                  onChange={(e) => setSettings({ ...settings, api_url: e.target.value })}
                  className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">Nome da Instância</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: srquin_barbearia"
                    value={settings.instance_name}
                    onChange={(e) => setSettings({ ...settings, instance_name: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">API Token (apikey)</label>
                  <input
                    type="password"
                    required
                    placeholder="Sua chave apikey da Evolution API"
                    value={settings.api_token}
                    onChange={(e) => setSettings({ ...settings, api_token: e.target.value })}
                    className="w-full bg-[#0a0a0c] border border-[#27272a] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={settings.is_active}
                  onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[#d4af37] bg-[#0a0a0c] border-[#27272a]"
                />
                <label htmlFor="is_active" className="text-xs uppercase tracking-wider text-slate-300 font-medium cursor-pointer">
                  Canal do WhatsApp Ativo (Enviar Notificações)
                </label>
              </div>

              <div className="pt-4 border-t border-[#27272a]/55">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black font-bold text-xs rounded-lg px-6 py-3.5 tracking-widest transition duration-300 shadow-lg uppercase"
                >
                  {submitLoading ? "Salvando..." : "Salvar Configurações"}
                </button>
              </div>
            </form>
          </div>

          {/* Dicas e Status (Estreita) */}
          <div className="bg-[#121215] border border-[#27272a]/70 rounded-xl p-6 sm:p-8 space-y-6 shadow-xl">
            <h3 className="font-display text-lg font-semibold tracking-wide text-white border-b border-[#27272a] pb-4">
              Status da Conexão
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#0a0a0c] border border-[#27272a] rounded-lg p-4">
                <span className="text-xs text-[#a1a1aa]">Estado do Canal:</span>
                <span className={`text-[10px] font-bold font-mono px-2 py-1 rounded ${
                  settings.is_active && settings.id
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                  {settings.is_active && settings.id ? "ATIVO" : "INATIVO"}
                </span>
              </div>

              <div className="space-y-2 text-xs font-light text-slate-400 leading-relaxed">
                <p className="font-semibold text-slate-200">ℹ️ Como Funciona:</p>
                <p>1. Ao cadastrar um novo agendamento, o banco de dados do Supabase enfileira duas notificações automaticamente: a confirmação e o lembrete.</p>
                <p>2. Lembretes agendados para a parte da **manhã** (antes das 12:00) serão enviados no **dia anterior às 18:00**.</p>
                <p>3. Lembretes para a parte da **tarde/noite** serão enviados no **mesmo dia às 08:00**.</p>
                <p>4. Certifique-se de configurar uma tarefa cron em sua hospedagem ou no Supabase para chamar periodicamente a rota `/api/cron/process-notifications` para despachar as mensagens pendentes.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Logs e Fila de Notificações */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-display text-xl font-semibold tracking-wide text-white">
              Monitoramento da Fila de Notificações
            </h3>
            <button 
              onClick={fetchData}
              className="text-xs border border-[#27272a] hover:border-[#d4af37]/45 text-[#a1a1aa] hover:text-white px-3 py-1.5 rounded-lg transition duration-200"
            >
              Recarregar Logs
            </button>
          </div>

          <div className="bg-[#121215] border border-[#27272a]/70 rounded-xl overflow-hidden shadow-xl">
            {logs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-light text-sm">
                Nenhum registro de notificação gerado até o momento.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27272a] bg-[#18181b]/40 text-[10px] uppercase tracking-[0.15em] text-[#a1a1aa] font-mono">
                      <th className="py-4 px-6">Data de Criação</th>
                      <th className="py-4 px-6">Agendado Para</th>
                      <th className="py-4 px-6">Destinatário</th>
                      <th className="py-4 px-6">Tipo</th>
                      <th className="py-4 px-6">Mensagem</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]/50 text-sm font-light">
                    {logs.map((log) => {
                      const createdDate = new Date(log.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
                      const scheduledDate = new Date(log.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

                      return (
                        <tr key={log.id} className="hover:bg-[#18181b]/20 transition duration-150">
                          <td className="py-4 px-6 font-mono text-slate-400 text-xs">
                            {createdDate}
                          </td>
                          <td className="py-4 px-6 font-mono text-[#d4af37] text-xs">
                            {scheduledDate}
                          </td>
                          <td className="py-4 px-6">
                            <span className="font-mono text-slate-300">{log.phone}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[10px] uppercase font-mono bg-[#0a0a0c] border border-[#27272a] px-2 py-1 rounded text-slate-300">
                              {log.type === 'confirmation' ? 'Confirmação' : 'Lembrete'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-slate-400 text-xs max-w-sm truncate" title={log.message}>
                            {log.message}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1 items-start">
                              <span 
                                className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-mono tracking-wider font-semibold ${
                                  log.status === 'sent'
                                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                    : log.status === 'failed'
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                    : "bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20"
                                }`}
                              >
                                {log.status === 'sent' && "Enviado"}
                                {log.status === 'failed' && "Falhou"}
                                {log.status === 'pending' && "Pendente"}
                              </span>
                              {log.error_message && (
                                <span className="text-[9px] text-red-400 font-mono leading-none max-w-xs truncate" title={log.error_message}>
                                  Erro: {log.error_message}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

      </main>

      {/* Rodapé */}
      <footer className="border-t border-[#27272a]/30 py-6 text-center text-[10px] text-slate-600 font-mono uppercase tracking-widest mt-auto">
        © 2026 Sr. Quin Barbearia • Desenvolvido com Vercel & Supabase
      </footer>
    </div>
  );
}
