"use client";

import { useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";

import { LoginModal } from "@/components/auth/LoginModal";
import { CreatorSearch } from "@/components/home/CreatorSearch";
import { ensureProfile } from "@/lib/auth/ensure-profile";
import { supabase } from "@/lib/supabase/client";

type SiteHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

type AuthUser = {
  name: string;
  email: string;
};

export function SiteHeader({ search, onSearchChange }: SiteHeaderProps) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUser(null);
        return;
      }

      await ensureProfile(user);

      setUser({
        name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "Creator",
        email: user.email || "",
      });
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/50 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:h-20 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6 md:py-0">
          <div className="flex items-center justify-between gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.9)]" />

              <h1 className="text-sm font-black uppercase tracking-[0.25em] text-white sm:text-lg sm:tracking-[0.3em]">
                Creator Nexus
              </h1>
            </a>

            {user ? (
              <div className="flex items-center gap-2 md:hidden">
                <a
                  href="/account"
                  className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:bg-cyan-300/20"
                >
                  Conta
                </a>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-red-300/30 hover:bg-red-300/10"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06] md:hidden"
              >
                <User size={16} />
                Entrar
              </button>
            )}
          </div>

          <div className="w-full md:max-w-md">
            <CreatorSearch value={search} onChange={onSearchChange} />
          </div>

          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <a href="/account" className="text-right">
                <p className="text-sm font-semibold text-white transition hover:text-cyan-200">
                  {user.name}
                </p>

                <p className="text-xs text-white/40">
                  {user.email}
                </p>
              </a>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:border-red-300/30 hover:bg-red-300/10"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white transition hover:border-white/20 hover:bg-white/[0.06] md:flex"
            >
              <User size={18} />
              Entrar
            </button>
          )}
        </div>
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}