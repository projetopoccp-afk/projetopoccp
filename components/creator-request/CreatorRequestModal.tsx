"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Send, X } from "lucide-react";

import { supabase } from "@/lib/supabase/client";

type CreatorRequestModalProps = {
  open: boolean;
  email: string;
  onClose: () => void;
};

const categories = [
  "Streamer",
  "YouTuber",
  "VTuber",
  "Gamer",
  "Artista",
  "Editor",
  "Cosplayer",
  "Influencer",
  "Educacional",
  "Podcaster",
];

const platforms = [
  "youtube",
  "twitch",
  "tiktok",
  "kick",
  "instagram",
  "discord",
  "x",
  "website",
];

const aiPrompt = `Create a cinematic fantasy-tech creator portrait for a premium digital collectible card.

Subject:
[describe the creator appearance, outfit, pose and vibe]

Style:
AAA game character portrait, fantasy-tech, cyber minimalism, cinematic lighting, mysterious atmosphere, premium digital identity, collectible card artwork, sharp details, elegant glow, high contrast, realistic but stylized, powerful aura, dark futuristic background, subtle particles, dramatic rim light.

Composition:
vertical portrait, centered character, upper body visible, strong silhouette, space around the subject for card framing, no text, no logos, no watermark, no UI elements.

Mood:
legendary, rare, mysterious, powerful, cinematic, premium.

Color palette:
deep black, cyan glow, violet energy, subtle gold highlights.

Quality:
high detail, clean face, professional character art, ultra sharp, 4k, game splash art quality.`;

export function CreatorRequestModal({
  open,
  email,
  onClose,
}: CreatorRequestModalProps) {
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [platformLinks, setPlatformLinks] = useState<Record<string, string>>({});
  const [verificationPlatform, setVerificationPlatform] = useState("youtube");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [imageSource, setImageSource] = useState("external_url");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const verificationCode = useMemo(() => {
    return `CNX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }, [open]);

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  async function handleSubmit() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const activePlatforms = Object.entries(platformLinks)
      .filter(([, url]) => url.trim().length > 0)
      .map(([platform, url]) => ({
        platform,
        url,
      }));

    const { error } = await supabase.from("creator_requests").insert({
      user_id: user.id,
      nickname,
      username,
      email,
      category: selectedCategories[0] || "Creator",
      categories: selectedCategories,
      main_platform: verificationPlatform,
      main_url: verificationUrl,
      platforms: activePlatforms,
      verification_platform: verificationPlatform,
      verification_url: verificationUrl,
      verification_code: verificationCode,
      card_image_url: cardImageUrl,
      image_source: imageSource,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    setSuccess(true);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4"
        >
          <button className="absolute inset-0" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            className="no-scrollbar relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[32px] border border-white/15 bg-zinc-950 p-8 text-white shadow-[0_0_80px_rgba(0,0,0,0.9)]"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100 w-fit">
              Creator Request
            </div>

            {success ? (
              <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-6">
                <h2 className="text-2xl font-black">Solicitação enviada!</h2>
                <p className="mt-3 text-white/60">
                  Sua solicitação entrou na fila de análise. Agora coloque o
                  código abaixo na bio/descrição da plataforma escolhida:
                </p>
                <div className="mt-5 rounded-2xl bg-black/40 p-4 text-center text-2xl font-black tracking-[0.25em] text-cyan-100">
                  {verificationCode}
                </div>
              </div>
            ) : (
              <>
                <h2 className="mt-6 text-3xl font-black">
                  Solicitar perfil de criador
                </h2>

                <p className="mt-3 text-sm text-white/55">
                  Preencha seus dados, redes e imagem base do card. A aprovação
                  será manual para evitar perfis falsos.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Nickname do criador"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-cyan-300/40"
                  />

                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username único"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-cyan-300/40"
                  />
                </div>

                <h3 className="mt-8 font-bold">Categorias</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        selectedCategories.includes(category)
                          ? "border-cyan-300/40 bg-cyan-300/15 text-cyan-100"
                          : "border-white/10 bg-white/[0.04] text-white/60"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

                <h3 className="mt-8 font-bold">Plataformas e links</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {platforms.map((platform) => (
                    <input
                      key={platform}
                      value={platformLinks[platform] || ""}
                      onChange={(e) =>
                        setPlatformLinks((current) => ({
                          ...current,
                          [platform]: e.target.value,
                        }))
                      }
                      placeholder={`${platform} URL`}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-cyan-300/40"
                    />
                  ))}
                </div>

                <h3 className="mt-8 font-bold">Verificação</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={verificationPlatform}
                    onChange={(e) => setVerificationPlatform(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none"
                  >
                    {platforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>

                  <input
                    value={verificationUrl}
                    onChange={(e) => setVerificationUrl(e.target.value)}
                    placeholder="URL usada para verificação"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-cyan-300/40"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
                    Código de verificação
                  </p>
                  <p className="mt-2 text-xl font-black tracking-[0.25em]">
                    {verificationCode}
                  </p>
                  <p className="mt-2 text-sm text-white/50">
                    Coloque esse código na bio ou descrição da plataforma usada
                    para verificação.
                  </p>
                </div>

                <h3 className="mt-8 font-bold">Imagem do card</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                  <select
                    value={imageSource}
                    onChange={(e) => setImageSource(e.target.value)}
                    className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm outline-none"
                  >
                    <option value="external_url">Link externo</option>
                    <option value="ai_generated">Imagem IA</option>
                    <option value="upload">Upload futuro</option>
                  </select>

                  <input
                    value={cardImageUrl}
                    onChange={(e) => setCardImageUrl(e.target.value)}
                    placeholder="Cole o link da imagem"
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-cyan-300/40"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-purple-300/15 bg-purple-300/[0.04] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-bold">Prompt padrão para imagem IA</h4>
                    <button
                      onClick={() => navigator.clipboard.writeText(aiPrompt)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs"
                    >
                      <Copy size={14} />
                      Copiar
                    </button>
                  </div>

                  <pre className="no-scrollbar mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap text-xs text-white/50">
                    {aiPrompt}
                  </pre>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-50"
                >
                  <Send size={16} />
                  {loading ? "Enviando..." : "Enviar para análise"}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}