"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  
  // Estados do formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  // Controle de interface
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Redireciona se o usuário já estiver logado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        // Fluxo de Cadastro (Admin)
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name: name || "Administrador",
              phone: phone || "",
              role: "admin", // Importante: Garante a criação como administrador via Trigger
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          setMessage({
            type: "success",
            text: "Cadastro realizado com sucesso! Sua conta de administrador está pronta para uso.",
          });
          // Limpa campos adicionais e muda para login
          setName("");
          setPhone("");
          setTimeout(() => setIsSignUp(false), 2000);
        }
      } else {
        // Fluxo de Login
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage({
          type: "success",
          text: "Login efetuado com sucesso! Redirecionando...",
        });
        
        setTimeout(() => {
          router.push("/");
        }, 1200);
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Ocorreu um erro inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-brand-charcoal">
      
      {/* Coluna Lateral de Destaque Visual (Esquerda - Oculta no Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-brand-charcoal border-r-2 border-brand-clay items-center justify-center p-16">
        
        {/* Linhas Geométricas de Moldura Bauhaus Retrô-Premium */}
        <div className="absolute inset-8 border-[1.5px] border-brand-clay/35 pointer-events-none rounded-[4px]" />
        <div className="absolute inset-10 border border-brand-clay/20 pointer-events-none rounded-[4px]" />
 
        <div className="relative z-10 max-w-md text-center flex flex-col items-center">
          
          {/* Brasão/Emblema de Luxo Minimalista com Sombra Rígida Ouro */}
          <div className="w-20 h-20 rounded-full border-2 border-brand-gold flex items-center justify-center mb-8 bg-brand-carbon shadow-retro-gold-sm">
            <span className="font-display text-3xl font-extrabold text-brand-gold tracking-wider">Q</span>
          </div>
 
          <h2 className="font-display text-4xl font-light tracking-widest text-slate-100">
            SR. QUIN
          </h2>
          <span className="text-xs uppercase tracking-[0.4em] text-brand-gold font-semibold mt-1">
            BARBEARIA
          </span>
 
          <div className="w-16 h-[1.5px] bg-brand-clay my-8" />
 
          <p className="text-slate-400 font-light leading-relaxed text-sm tracking-wide">
            O templo da elegância masculina e da sofisticação clássica em Rondônia. Gerencie horários, barbeiros e a experiência única de nossos clientes a partir do seu painel administrativo.
          </p>
 
          <div className="mt-12 flex gap-4 text-xs font-mono tracking-widest text-brand-gold/50">
            <span>EST. 2026</span>
            <span>•</span>
            <span>RO / UTC-4</span>
          </div>
        </div>
      </div>
 
      {/* Coluna Direita (Formulário) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative">
        
        <div className="w-full max-w-md z-10">
          
          {/* Logo no topo (Apenas Mobile/Tablet, oculta em Desktop) */}
          <div className="flex flex-col items-center lg:hidden mb-8">
            <div className="w-14 h-14 rounded-full border-2 border-brand-gold flex items-center justify-center mb-3 bg-brand-carbon shadow-retro-gold-sm">
              <span className="font-display text-xl font-bold text-brand-gold">Q</span>
            </div>
            <h1 className="font-display text-2xl font-light tracking-widest text-slate-100">
              SR. QUIN
            </h1>
            <span className="text-[9px] uppercase tracking-[0.4em] text-brand-gold font-bold">
              BARBEARIA
            </span>
          </div>
 
          {/* Card com Estilo Modernismo Tátil e Sombra Deslocada */}
          <div className="panel-tactile p-8 sm:p-10 bg-brand-carbon">
            
            {/* Cabeçalho do Card */}
            <div className="text-center mb-8">
              <h3 className="font-display text-2xl font-semibold text-slate-100 tracking-wide">
                {isSignUp ? "Criar Conta Admin" : "Acesso ao Painel"}
              </h3>
              <p className="text-slate-400 text-xs mt-2 tracking-wide font-light">
                {isSignUp 
                  ? "Cadastre sua credencial de administrador" 
                  : "Insira seus dados para acessar a gerência da barbearia"
                }
              </p>
            </div>
 
            {/* Mensagem de Feedback (Erro ou Sucesso) com visual Tátil */}
            {message && (
              <div 
                className={`mb-6 p-4 border-[1.5px] rounded-[4px] text-xs leading-relaxed flex items-start gap-2 shadow-retro-sm ${
                  message.type === "success" 
                    ? "bg-green-950/20 border-green-500/40 text-green-400" 
                    : "bg-red-950/20 border-brand-tijolo/40 text-brand-tijolo"
                }`}
              >
                <span>{message.type === "success" ? "✓" : "⚠️"}</span>
                <p>{message.text}</p>
              </div>
            )}
 
            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {isSignUp && (
                <>
                  {/* Campo Nome (Apenas Cadastro) */}
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-brand-charcoal border-[1.5px] border-brand-clay hover:border-brand-copper focus:border-brand-gold text-sm text-slate-100 rounded-[4px] px-4 py-3 outline-none transition duration-150 placeholder-[#52525b]"
                    />
                  </div>
 
                  {/* Campo Celular (Apenas Cadastro) */}
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">
                      Celular / Contato
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: (69) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-brand-charcoal border-[1.5px] border-brand-clay hover:border-brand-copper focus:border-brand-gold text-sm text-slate-100 rounded-[4px] px-4 py-3 outline-none transition duration-150 placeholder-[#52525b]"
                    />
                  </div>
                </>
              )}
 
              {/* Campo E-mail */}
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">
                  Endereço de E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@srquin.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-charcoal border-[1.5px] border-brand-clay hover:border-brand-copper focus:border-brand-gold text-sm text-slate-100 rounded-[4px] px-4 py-3 outline-none transition duration-150 placeholder-[#52525b]"
                />
              </div>
 
              {/* Campo Senha */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">
                    Sua Senha
                  </label>
                  {!isSignUp && (
                    <a href="#" className="text-[10px] text-brand-gold hover:text-brand-copper hover:underline transition">
                      Esqueceu a senha?
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-charcoal border-[1.5px] border-brand-clay hover:border-brand-copper focus:border-brand-gold text-sm text-slate-100 rounded-[4px] px-4 py-3 outline-none transition duration-150 placeholder-[#52525b]"
                />
              </div>
 
              {/* Botão de Envio com Micro-animação Tátil */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-tactile-gold py-3.5 tracking-wider mt-4"
              >
                {loading ? "Processando..." : isSignUp ? "CADASTRAR ADMIN" : "ENTRAR NO PAINEL"}
              </button>
 
            </form>
 
            {/* Rodapé Alternador do Estado do Card */}
            <div className="mt-8 pt-6 border-t border-brand-clay text-center">
              <span className="text-xs text-slate-400">
                {isSignUp ? "Já possui uma credencial?" : "Nova administração na barbearia?"}{" "}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage(null);
                  }}
                  className="text-xs font-semibold text-brand-gold hover:text-brand-copper transition hover:underline focus:outline-none"
                >
                  {isSignUp ? "Fazer Login" : "Criar conta administrativa"}
                </button>
              </span>
            </div>
 
          </div>
 
          <div className="mt-8 text-center text-[10px] text-slate-500 font-mono tracking-widest uppercase">
            © 2026 Sr. Quin Barbearia • Todos os direitos reservados
          </div>
 
        </div>
      </div>
 
    </div>
  );
}
