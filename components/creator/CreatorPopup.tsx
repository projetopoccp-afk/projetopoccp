"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { Creator } from "@/types/creator";

type CreatorPopupProps = {
  creator: Creator | null;
  onClose: () => void;
};

const statusLabel = {
  online: "Online",
  offline: "Offline",
  live: "Live now",
  trending: "Trending",
  event: "In event",
};

export function CreatorPopup({ creator, onClose }: CreatorPopupProps) {
  const [copied, setCopied] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const isOwner = Boolean(
    creator?.ownerId && currentUserId && creator.ownerId === currentUserId
  );

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setCurrentUserId(user?.id || null);
    }

    loadUser();
  }, []);

  useEffect(() => {
    setEditMode(false);
  }, [creator?.id]);

  async function handleShare() {
    if (!creator) return;

    const shareText = `Confira o creator ${creator.nickname} no Creator Nexus ✦`;

    await navigator.clipboard.writeText(shareText);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <AnimatePresence>
      {creator && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <button
            onClick={onClose}
            className="absolute inset-0"
            aria-label="Fechar popup"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative grid h-[88vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/15 bg-zinc-950 shadow-[0_0_80px_rgba(0,0,0,0.9)] md:grid-cols-[360px_1fr]"
          >
            <div className="relative hidden overflow-hidden bg-black md:block">
              <motion.img
                src={creator.avatarUrl}
                alt={creator.nickname}
                initial={{ scale: 1.08, x: 0, y: 0 }}
                animate={{
                  scale: [1.08, 1.14, 1.1, 1.08],
                  x: [0, -10, 8, 0],
                  y: [0, -8, 6, 0],
                }}
                transition={{
                  duration: 14,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 h-full w-full object-cover object-center opacity-80"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

              <div className="absolute left-5 top-5 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-yellow-100 backdrop-blur">
                {creator.rarity}
              </div>

              <div className="absolute right-5 top-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs text-cyan-100 backdrop-blur">
                Lv. {creator.level}
              </div>

              <div className="absolute bottom-6 left-6 right-6">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-xs text-emerald-100 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
                  {statusLabel[creator.status]}
                </div>

                <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
                  {creator.category}
                </p>

                <h2 className="mt-2 text-4xl font-black text-white">
                  {creator.nickname}
                </h2>

                <p className="mt-1 text-sm font-semibold text-cyan-100">
                  {creator.title}
                </p>

                <p className="mt-2 text-sm text-white/60">
                  @{creator.username}
                </p>

                <div className="mt-5 flex gap-3">
                  <button className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-black transition hover:scale-105">
                    Seguir
                  </button>

                  <button
                    onClick={handleShare}
                    className="rounded-full border border-white/15 bg-white/[0.05] px-5 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                  >
                    {copied ? "Copiado!" : "Compartilhar"}
                  </button>
                </div>
              </div>
            </div>

            <div className="relative h-full overflow-hidden text-white">
              <div className="absolute right-5 top-5 z-20 flex gap-2">
                {isOwner && (
                  <button
                    onClick={() => setEditMode((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100 hover:bg-cyan-300/20"
                  >
                    <Pencil size={14} />
                    {editMode ? "Visualizar" : "Editar"}
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
                >
                  Fechar
                </button>
              </div>

              <div
                className="no-scrollbar h-full overflow-y-auto p-6 pr-10 md:p-8 md:pr-12"
                style={{
                  width: "calc(100% - 18px)",
                  marginRight: "18px",
                }}
              >
                {editMode ? (
                  <div className="pr-16">
                    <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                      Edit Mode
                    </p>

                    <h3 className="mt-3 text-3xl font-bold">
                      Edição do perfil
                    </h3>

                    <p className="mt-4 text-white/60">
                      Esta área já está preparada para edição. No próximo passo
                      vamos adicionar os campos para editar nickname, title,
                      bio, descrição, imagem e links.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="pr-16">
                      <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                        Creator Profile
                      </p>

                      <h3 className="mt-3 text-3xl font-bold leading-tight">
                        {creator.bio}
                      </h3>

                      <p className="mt-3 text-sm font-semibold text-cyan-100">
                        {creator.title}
                      </p>

                      <p className="mt-4 text-white/65">
                        {creator.description}
                      </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <InfoCard label="Power Score" value={creator.powerScore.toLocaleString("pt-BR")} color="text-cyan-200" />
                      <InfoCard label="Collected by" value={creator.collectedBy.toLocaleString("pt-BR")} color="text-purple-200" />
                      <InfoCard label="Status" value={statusLabel[creator.status]} color="text-emerald-200" />
                    </div>

                    <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
                        Evolution Stage
                      </p>

                      <p className="mt-2 font-bold text-white">
                        {creator.evolutionStage}
                      </p>
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <InfoCard label="Rank" value={creator.rank} color="text-yellow-200" />
                      <InfoCard label="Level" value={String(creator.level)} color="text-cyan-200" />
                      <InfoCard label="Aura" value={creator.aura} color="text-purple-200" />
                    </div>

                    <div className="mt-8">
                      <h4 className="font-bold">Estatísticas</h4>

                      <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                        <InfoCard label="Seguidores" value={creator.followers.toLocaleString("pt-BR")} />
                        <InfoCard label="Likes" value={creator.likes.toLocaleString("pt-BR")} />
                        <InfoCard label="Views" value={creator.views.toLocaleString("pt-BR")} />
                      </div>
                    </div>

                    <div className="mt-8">
                      <h4 className="font-bold">Signature Traits</h4>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {creator.traits.map((trait) => (
                          <div
                            key={`${trait.label}-${trait.value}`}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                          >
                            <p className="text-xs text-white/40">
                              {trait.label}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-white">
                              {trait.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 rounded-2xl border border-purple-300/15 bg-purple-300/[0.04] p-4">
                      <p className="text-xs uppercase tracking-[0.25em] text-purple-200">
                        Featured Moment
                      </p>

                      <h4 className="mt-3 font-bold text-white">
                        {creator.featuredMoment.title}
                      </h4>

                      <p className="mt-2 text-sm text-white/55">
                        {creator.featuredMoment.description}
                      </p>
                    </div>

                    <div className="mt-8">
                      <h4 className="font-bold">Tags</h4>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {creator.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8">
                      <h4 className="font-bold">Achievements</h4>

                      <div className="mt-3 space-y-3">
                        {creator.achievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                          >
                            <p className="font-semibold text-white">
                              {achievement.title}
                            </p>

                            <p className="mt-1 text-sm text-white/50">
                              {achievement.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 pb-10">
                      <h4 className="font-bold">Social Links</h4>

                      <div className="mt-3 flex flex-wrap gap-3">
                        {creator.socials.map((social) => (
                          <a
                            key={social.platform}
                            href={social.url}
                            target="_blank"
                            className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100 transition hover:scale-105 hover:bg-cyan-300/20"
                          >
                            {social.platform}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InfoCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-white/40">{label}</p>
      <p className={`mt-1 font-bold ${color}`}>{value}</p>
    </div>
  );
}