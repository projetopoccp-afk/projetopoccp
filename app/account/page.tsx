"use client";

import { useEffect, useState } from "react";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type Profile = {
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/";
        return;
      }

      setEmail(user.email || "");

      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, avatar_url, is_admin")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }

    loadAccount();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        Carregando conta...
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_35%)]" />

      <section className="relative z-10 mx-auto max-w-3xl">
        <a href="/" className="text-sm text-cyan-200 hover:text-cyan-100">
          ← Voltar para home
        </a>

        <div className="mt-8 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="text-white/40" size={42} />
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                Minha Conta
              </p>

              <h1 className="mt-2 text-3xl font-black">
                {profile?.display_name || "Creator"}
              </h1>

              <p className="mt-1 text-white/45">{email}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/60">
                  @{profile?.username || "sem_username"}
                </span>

                {profile?.is_admin && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-1 text-sm text-yellow-100">
                    <ShieldCheck size={14} />
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
              <h2 className="font-bold">Solicitar perfil de criador</h2>

              <p className="mt-2 text-sm text-white/55">
                Envie seus dados, redes sociais e prova de posse do canal para
                entrar na fila de aprovação.
              </p>

              <button className="mt-5 rounded-full bg-cyan-300 px-5 py-2 text-sm font-bold text-black transition hover:scale-105">
                Começar solicitação
              </button>
            </div>

            <div className="rounded-3xl border border-purple-300/15 bg-purple-300/[0.04] p-5">
              <h2 className="font-bold">Coleção de criadores</h2>

              <p className="mt-2 text-sm text-white/55">
                Em breve você poderá seguir, favoritar e colecionar cards de
                creators.
              </p>

              <button className="mt-5 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm text-white/60">
                Em breve
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm text-red-100 transition hover:bg-red-300/20"
          >
            <LogOut size={18} />
            Sair da conta
          </button>
        </div>
      </section>
    </main>
  );
}