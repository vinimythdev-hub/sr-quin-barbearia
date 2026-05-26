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
    <div className="flex min-h-screen items-stretch justify-center bg-[#0a0a0c]">
      
      {/* Coluna Lateral de Destaque Visual (Esquerda - Oculta no Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-tr from-[#0a0a0c] via-[#12110c] to-[#1e1a12] border-r border-[#2b2518]/20 items-center justify-center p-16">
        
        {/* Elemento de Brilho de Fundo Sutil */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#d4af37]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[#d4af37]/3 rounded-full blur-[90px] pointer-events-none" />
        
        {/* Linhas Geométricas de Moldura Art Déco Retrô-Premium */}
        <div className="absolute inset-8 border border-[#d4af37]/10 pointer-events-none rounded-sm" />
        <div className="absolute inset-10 border border-[#d4af37]/5 pointer-events-none rounded-sm" />

        <div className="relative z-10 max-w-md text-center flex flex-col items-center">
          
          {/* Brasão/Emblema de Luxo Minimalista */}
          <div className="w-20 h-20 rounded-full border-2 border-[#d4af37]/40 flex items-center justify-center mb-8 bg-[#0a0a0c] shadow-[0_0_20px_rgba(212,175,55,0.1)]">
            <span className="font-display text-3xl font-extrabold text-[#d4af37] tracking-wider">Q</span>
          </div>

          <h2 className="font-display text-4xl font-light tracking-widest text-[#f3f4f6]">
            SR. QUIN
          </h2>
          <span className="text-xs uppercase tracking-[0.4em] text-[#d4af37] font-semibold mt-1">
            BARBEARIA
          </span>

          <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent my-8" />

          <p className="text-slate-400 font-light leading-relaxed text-sm tracking-wide">
            O templo da elegância masculina e da sofisticação clássica em Rondônia. Gerencie horários, barbeiros e a experiência única de nossos clientes a partir do seu painel administrativo.
          </p>

          <div className="mt-12 flex gap-4 text-xs font-mono tracking-widest text-[#d4af37]/50">
            <span>EST. 2026</span>
            <span>•</span>
            <span>RO / UTC-4</span>
          </div>
        </div>
      </div>

      {/* Coluna Direita (Formulário) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative">
        
        {/* Elemento decorativo de fumaça dourada no fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-[#d4af37]/2 rounded-full blur-[80px] pointer-events-none" />

        <div className="w-full max-w-md z-10">
          
          {/* Logo no topo (Apenas Mobile/Tablet, oculta em Desktop) */}
          <div className="flex flex-col items-center lg:hidden mb-8">
            <div className="w-14 h-14 rounded-full border border-[#d4af37]/30 flex items-center justify-center mb-3 bg-[#0a0a0c]">
              <span className="font-display text-xl font-bold text-[#d4af37]">Q</span>
            </div>
            <h1 className="font-display text-2xl font-light tracking-widest text-[#f3f4f6]">
              SR. QUIN
            </h1>
            <span className="text-[9px] uppercase tracking-[0.4em] text-[#d4af37] font-bold">
              BARBEARIA
            </span>
          </div>

          {/* Card com Glassmorphism e Efeito de Sombra Dourada */}
          <div className="bg-[#121215]/80 backdrop-blur-md border border-[#27272a]/70 rounded-xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_30px_rgba(212,175,55,0.02)]">
            
            {/* Cabeçalho do Card */}
            <div className="text-center mb-8">
              <h3 className="font-display text-2xl font-semibold text-[#f3f4f6] tracking-wide">
                {isSignUp ? "Criar Conta Admin" : "Acesso ao Painel"}
              </h3>
              <p className="text-slate-400 text-xs mt-2 tracking-wide font-light">
                {isSignUp 
                  ? "Cadastre sua credencial de administrador" 
                  : "Insira seus dados para acessar a gerência da barbearia"
                }
              </p>
            </div>

            {/* Mensagem de Feedback (Erro ou Sucesso) */}
            {message && (
              <div 
                className={`mb-6 p-4 rounded-lg text-xs border leading-relaxed flex items-start gap-2 animate-fade-in ${
                  message.type === "success" 
                    ? "bg-[#14532d]/20 border-[#15803d]/40 text-[#4ade80]" 
                    : "bg-[#7f1d1d]/20 border-[#b91c1c]/40 text-[#f87171]"
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
                      className="w-full bg-[#0a0a0c] border border-[#27272a] hover:border-[#3f3f46] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition duration-200 placeholder-[#52525b]"
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
                      className="w-full bg-[#0a0a0c] border border-[#27272a] hover:border-[#3f3f46] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition duration-200 placeholder-[#52525b]"
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
                  className="w-full bg-[#0a0a0c] border border-[#27272a] hover:border-[#3f3f46] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition duration-200 placeholder-[#52525b]"
                />
              </div>

              {/* Campo Senha */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs uppercase tracking-wider text-[#a1a1aa] font-medium">
                    Sua Senha
                  </label>
                  {!isSignUp && (
                    <a href="#" className="text-[10px] text-[#d4af37]/80 hover:text-[#d4af37] hover:underline transition">
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
                  className="w-full bg-[#0a0a0c] border border-[#27272a] hover:border-[#3f3f46] focus:border-[#d4af37]/60 text-sm text-slate-100 rounded-lg px-4 py-3 outline-none transition duration-200 placeholder-[#52525b]"
                />
              </div>

              {/* Botão de Envio com Efeito de Hover Dourado Premium */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d4af37] hover:bg-[#c5a130] disabled:bg-[#d4af37]/40 text-black font-semibold text-sm rounded-lg py-3.5 tracking-wider transition duration-300 mt-2 shadow-[0_4px_20px_rgba(212,175,55,0.25)]"
              >
                {loading ? "Processando..." : isSignUp ? "CADASTRAR ADMIN" : "ENTRAR NO PAINEL"}
              </button>

            </form>



            {/* Rodapé Alternador do Estado do Card */}
            <div className="mt-8 pt-6 border-t border-[#27272a]/50 text-center">
              <span className="text-xs text-slate-400">
                {isSignUp ? "Já possui uma credencial?" : "Nova administração na barbearia?"}{" "}
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage(null);
                  }}
                  className="text-xs font-semibold text-[#d4af37] hover:text-[#c5a130] transition hover:underline focus:outline-none"
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
