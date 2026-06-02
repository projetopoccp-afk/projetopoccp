"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ExternalLink, ImagePlus, Send, X } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { supabase } from "@/lib/supabase/client";

type CreatorRequestModalProps = {
  open: boolean;
  email: string;
  onClose: () => void;
};

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

const aiPrompt = `Transform the uploaded photo into a premium digital collectible card portrait.

IMPORTANT:
Preserve the identity, face, hairstyle, facial features and overall appearance of the person in the original image.

Do not create a different character.
Do not change ethnicity, gender, age or facial structure.

STYLE:
AAA game character portrait, fantasy-tech aesthetic, cinematic lighting, premium collectible card artwork, detailed clothing, powerful aura, subtle energy effects, realistic but stylized, high-end game splash art quality.

COMPOSITION:
Vertical portrait.
Aspect ratio 2:3.
Recommended resolution 1024x1536.
Upper body visible.
Subject centered.
Clean background.
Space around the character for future card framing.

MOOD:
Legendary, mysterious, premium, powerful.

COLORS:
Dark background, cyan energy, purple accents, subtle gold highlights.

RESTRICTIONS:
No text.
No logos.
No watermark.
No card frame.
No border.
No UI elements.

Keep the person recognizable while enhancing them into a collectible card hero version of themselves.`;

export function CreatorRequestModal({
  open,
  email,
  onClose,
}: CreatorRequestModalProps) {
  const { t } = useLanguage();

  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [verificationPlatform, setVerificationPlatform] = useState("youtube");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [cardImageUrl, setCardImageUrl] = useState("");
  const [imageSource, setImageSource] = useState<"external_url" | "upload">(
    "external_url"
  );
  const [promptCopied, setPromptCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const verificationCode = useMemo(() => {
    return `CNX-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }, [open]);

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(aiPrompt);

    setPromptCopied(true);

    setTimeout(() => {
      setPromptCopied(false);
    }, 2000);
  }

  async function handleUpload(file: File) {
    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUploading(false);
      return;
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("creator-requests")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setUploading(false);
      alert(error.message);
      return;
    }

    const { data } = supabase.storage
      .from("creator-requests")
      .getPublicUrl(fileName);

    setCardImageUrl(data.publicUrl);
    setImageSource("upload");
    setUploading(false);
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

    const { error } = await supabase.from("creator_requests").insert({
      user_id: user.id,
      nickname,
      username,
      email,
      category: "Creator",
      categories: [],
      main_platform: verificationPlatform,
      main_url: verificationUrl,
      platforms: [
        {
          platform: verificationPlatform,
          url: verificationUrl,
        },
      ],
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

            <div className="w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-100">
              {translate(t, "creatorRequestModalBadge", "Creator Request")}
            </div>

            {success ? (
              <div className="mt-8 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-6">
                <h2 className="text-2xl font-black">{translate(t, "creatorRequestModalSuccessTitle", "Solicitação enviada!")}</h2>

                <p className="mt-3 text-white/60">
                  {translate(
                    t,
                    "creatorRequestModalSuccessDescription",
                    "Sua solicitação entrou na fila de análise. Agora coloque o código abaixo na bio/descrição da plataforma escolhida:"
                  )}
                </p>

                <div className="mt-5 rounded-2xl bg-black/40 p-4 text-center text-2xl font-black tracking-[0.25em] text-cyan-100">
                  {verificationCode}
                </div>
              </div>
            ) : (
              <>
                <h2 className="mt-6 text-3xl font-black">
                  {translate(t, "creatorRequestModalTitle", "Solicitar perfil de criador")}
                </h2>

                <p className="mt-3 text-sm text-white/55">
                  {translate(
                    t,
                    "creatorRequestModalDescription",
                    "Preencha o básico para entrar na fila de aprovação. Após ser aprovado, você poderá completar categorias, redes, estatísticas e momentos em destaque."
                  )}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={translate(t, "creatorRequestModalNicknamePlaceholder", "Nickname do criador")}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-cyan-300/40"
                  />

                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={translate(t, "creatorRequestModalUsernamePlaceholder", "Username único")}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 outline-none focus:border-cyan-300/40"
                  />
                </div>

                <h3 className="mt-8 font-bold">{translate(t, "creatorRequestModalVerificationTitle", "Verificação do criador")}</h3>

                <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
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
                    placeholder={translate(t, "creatorRequestModalVerificationUrlPlaceholder", "Link do canal ou perfil principal")}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-cyan-300/40"
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-cyan-200">
                    {translate(t, "creatorRequestModalVerificationCodeLabel", "Código de verificação")}
                  </p>

                  <p className="mt-2 text-xl font-black tracking-[0.25em]">
                    {verificationCode}
                  </p>

                  <p className="mt-2 text-sm text-white/50">
                    {translate(
                    t,
                    "creatorRequestModalVerificationCodeDescription",
                    "Coloque esse código temporariamente na bio, descrição ou sobre da plataforma usada para verificação."
                  )}
                  </p>
                </div>

                <h3 className="mt-8 font-bold">{translate(t, "creatorRequestModalCardImageTitle", "Imagem do card")}</h3>

                <p className="mt-2 text-sm text-white/45">
                  {translate(
                    t,
                    "creatorRequestModalCardImageDescription",
                    "Use uma imagem vertical em proporção 2:3. Recomendado: 1024x1536. Não use texto, logo, moldura ou watermark."
                  )}
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={cardImageUrl}
                    onChange={(e) => {
                      setCardImageUrl(e.target.value);
                      setImageSource("external_url");
                    }}
                    placeholder={translate(t, "creatorRequestModalImageUrlPlaceholder", "Cole o link da imagem")}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none focus:border-cyan-300/40"
                  />

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:bg-white/[0.08]">
                    <ImagePlus size={18} />
                    {uploading
                      ? translate(t, "creatorRequestModalUploading", "Enviando...")
                      : translate(t, "creatorRequestModalUploadImage", "Enviar imagem")}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (file) {
                          handleUpload(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {cardImageUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                    <img
                      src={cardImageUrl}
                      alt={translate(t, "creatorRequestModalImagePreviewAlt", "Prévia da imagem do card")}
                      className="max-h-72 w-full object-cover"
                    />
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-purple-300/15 bg-purple-300/[0.04] p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-bold">
                        {translate(t, "creatorRequestModalPromptTitle", "Prompt para transformar sua foto")}
                      </h4>
                      <p className="mt-1 text-xs text-white/45">
                        {translate(
                          t,
                          "creatorRequestModalPromptDescription",
                          "Envie uma foto sua no ChatGPT e cole este prompt para adaptar a imagem ao estilo do card."
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleCopyPrompt}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs transition hover:bg-white/[0.08]"
                      >
                        {promptCopied ? (
                          <>
                            <Check size={14} />
                            {translate(t, "creatorRequestModalCopied", "Copiado!")}
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            {translate(t, "creatorRequestModalCopy", "Copiar")}
                          </>
                        )}
                      </button>

                      <a
                        href="https://chatgpt.com"
                        target="_blank"
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/20"
                      >
                        <ExternalLink size={14} />
                        {translate(t, "creatorRequestModalOpenChatGPT", "Abrir ChatGPT")}
                      </a>
                    </div>
                  </div>

                  <pre className="no-scrollbar mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap text-xs text-white/50">
                    {aiPrompt}
                  </pre>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    uploading ||
                    !nickname ||
                    !username ||
                    !verificationUrl ||
                    !cardImageUrl
                  }
                  className="mt-8 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={16} />
                  {loading
                    ? translate(t, "creatorRequestModalSubmitting", "Enviando...")
                    : translate(t, "creatorRequestModalSubmit", "Enviar para análise")}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}