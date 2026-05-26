"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface HeaderProps {
  activePage: "dashboard" | "calendar" | "services" | "barbers" | "clients" | "reports";
}

interface UserProfile {
  name: string;
  email: string | null;
  role: string;
}

export default function Header({ activePage }: HeaderProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("name, email, role")
          .eq("id", session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        } else {
          setProfile({
            name: session.user.user_metadata?.name || "Administrador",
            email: session.user.email || "",
            role: session.user.user_metadata?.role || "admin",
          });
        }
      } catch (err) {
        console.error("Erro ao carregar sessão no Header:", err);
      }
    };

    getSessionAndProfile();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { id: "dashboard", label: "PAINEL", path: "/" },
    { id: "calendar", label: "AGENDA VISUAL", path: "/admin/calendar" },
    { id: "services", label: "SERVIÇOS", path: "/admin/services" },
    { id: "barbers", label: "EQUIPE / BARBEIROS", path: "/admin/barbers" },
    { id: "clients", label: "CLIENTES & CRM", path: "/admin/clients" },
    { id: "reports", label: "RELATÓRIOS / FINANCEIRO", path: "/admin/reports" },
  ];

  return (
    <>
      <header className="border-b border-[#2c2826] bg-[#11100f] sticky top-0 z-50 px-6 sm:px-12 py-5 flex items-center justify-between transition-all duration-300">
        {/* Logo e Info */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full border border-[#d4af37]/30 flex items-center justify-center bg-[#181615] shadow-[0_0_15px_rgba(212,175,55,0.03)] group-hover:border-[#d4af37]/75 transition duration-300">
            <span className="font-display text-lg font-bold text-[#d4af37] group-hover:scale-110 transition duration-300">Q</span>
          </div>
          <div className="flex flex-col">
            <h2 className="font-display text-lg font-light tracking-widest leading-none text-[#f3f4f6] group-hover:text-white transition duration-300">
              SR. QUIN
            </h2>
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#d4af37] font-semibold mt-1">
              BARBEARIA
            </span>
          </div>
        </a>

        {/* Links de Administração no Header - DESKTOP */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-[11px] font-semibold tracking-widest text-[#a1a1aa]">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={item.path}
                className={`relative py-1.5 transition-all duration-300 hover:text-white ${
                  isActive ? "text-[#d4af37]" : "hover:text-[#d4af37]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#d4af37]/80 to-[#d4af37] rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* Info do Usuário & Logout / Hamburger */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-200">{profile?.name}</span>
            <span className="text-[9px] uppercase tracking-wider text-[#d4af37] font-mono font-medium">
              {profile?.role === "admin" ? "Dono / Gerente" : "Colaborador"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="hidden lg:block border border-[#b91c1c]/30 hover:border-[#b91c1c]/80 bg-[#7f1d1d]/10 hover:bg-[#7f1d1d]/20 text-[#f87171] hover:text-white px-4 py-2 rounded-lg text-xs font-medium tracking-wider uppercase transition duration-300"
          >
            Sair
          </button>

          {/* Botão de Menu Hambúrguer - MOBILE/TABLET */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden w-10 h-10 rounded-sm border border-[#2c2826] bg-[#181615] flex items-center justify-center text-[#f3f4f6] hover:text-[#d4af37] hover:border-[#d4af37]/45 transition duration-300"
            aria-label="Abrir Menu"
          >
            {isMenuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Menu Drawer Overlay - MOBILE */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#11100f]/98 flex flex-col justify-between p-8 pt-24 animate-fade-in">
          {/* Elemento decorativo dourado */}
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#d4af37]/2 rounded-full blur-[90px] pointer-events-none" />

          {/* Links de navegação vertical */}
          <nav className="flex flex-col gap-6 text-sm font-semibold tracking-[0.2em] text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37]/40 font-mono mb-2">NAVEGAÇÃO DO TEMPLO</span>
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <a
                  key={item.id}
                  href={item.path}
                  className={`py-3.5 border-b border-[#27272a]/40 transition duration-300 ${
                    isActive ? "text-[#d4af37] border-[#d4af37]/30 font-bold" : "text-[#a1a1aa] hover:text-white"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Info e Logout no Rodapé do Menu */}
          <div className="flex flex-col gap-6 items-center border-t border-[#27272a]/60 pt-6">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold text-slate-100">{profile?.name}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#d4af37] font-mono mt-1">
                {profile?.role === "admin" ? "Dono / Gerente" : "Colaborador"}
              </span>
            </div>

            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="w-full max-w-[240px] border border-[#b91c1c]/40 hover:border-[#b91c1c] bg-[#7f1d1d]/20 text-[#f87171] hover:text-white py-3.5 rounded-lg text-xs font-semibold tracking-widest uppercase transition duration-300"
            >
              ENCERRAR SESSÃO
            </button>
          </div>
        </div>
      )}
    </>
  );
}
