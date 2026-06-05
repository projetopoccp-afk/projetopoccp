"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, ExternalLink, ImagePlus, RefreshCw, Send, Sparkles, WandSparkles, X } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { CardpocModalShell } from "@/components/ui/CardpocModalShell";
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

const cardpocArchetypes = [
  "arcane guardian",
  "cyber rogue",
  "storm duelist",
  "void explorer",
  "celestial ranger",
  "neon summoner",
  "digital hunter",
  "astral tactician",
  "shadow sentinel",
  "tech alchemist",
  "cosmic bard",
  "crystal knight",
  "holographic ranger",
  "rift wanderer",
  "plasma monarch",
  "obsidian mentor",
  "lunar champion",
  "ether engineer",
  "mythic strategist",
  "spectral voyager",
  "runic broadcaster",
  "starlight commander",
  "quantum trickster",
  "aetheric artisan",
  "gravity breaker",
  "radiant archivist",
  "prism blade",
  "nightfall explorer",
  "solar caster",
  "ion pathfinder",
] as const;

const cardpocPalettes = [
  "dark cyan energy with purple accents and subtle gold sparks",
  "deep blue glow with violet haze and silver particles",
  "violet aura with cyan lightning and faint bronze highlights",
  "dark teal light with soft magenta reflections and pearl sparks",
  "electric blue rim light with royal purple shadows",
  "smoky indigo atmosphere with cyan runes and muted gold dust",
  "midnight black background with turquoise plasma and violet lens glow",
  "cosmic navy palette with cyan embers and restrained amber highlights",
  "arcane purple bloom with cold blue edges and tiny silver motes",
  "dark emerald-cyan light with controlled violet flare",
  "obsidian background with blue-white energy veins and soft gold shimmer",
  "neon cyan core light with deep purple fog and subtle chrome highlights",
  "black glass environment with holographic cyan and ultraviolet sparks",
  "blue nebula glow with violet particles and a thin golden aura",
  "teal cyber light with muted magenta reflections and metallic dust",
  "dark sapphire atmosphere with cyan glyphs and gentle purple gradients",
  "moonlit blue shadows with violet energy threads and pale gold specks",
  "cold cyan aura with shadowy violet depth and silver glow",
  "digital turquoise particles with deep plum ambience and warm gold flecks",
  "high contrast black-blue lighting with violet sparks and cinematic cyan haze",
] as const;

const cardpocBackgrounds = [
  "abstract arcane-tech arena",
  "dark cosmic grid",
  "holographic nebula chamber",
  "ancient digital ruins",
  "floating glass shards and subtle energy lines",
  "futuristic streamer sanctum",
  "mystic server core environment",
  "dimensional portal glow behind the subject",
  "cinematic cyber-fantasy void",
  "ethereal card collection vault",
  "neon constellation map",
  "fragmented digital cathedral",
  "shadowy rank arena",
  "premium game splash art backdrop",
  "dark crystalline stage",
  "glowing holographic archive",
  "storm-lit virtual battlefield",
  "arcane observatory with digital particles",
  "abstract creator universe background",
  "minimal dark gradient with energy glyphs",
  "cosmic card altar",
  "futuristic live-stream energy field",
  "dark prism tunnel",
  "subtle mythical technology landscape",
  "neon relic chamber",
] as const;

const cardpocAuras = [
  "controlled powerful aura",
  "subtle floating particles",
  "thin lightning filaments",
  "soft magical smoke",
  "holographic energy rings",
  "small orbiting sparks",
  "crystalline glow fragments",
  "gentle plasma veins",
  "cinematic rim light halo",
  "arcane glyph shimmer",
  "digital dust trails",
  "premium legendary glow",
  "quiet cosmic pressure",
  "faint energy wings made of light",
  "subtle streamer signal waves",
  "mystic card-summoning particles",
  "soft neon mist",
  "floating prism motes",
  "restrained power surge",
  "elegant aura pulse",
] as const;

const cardpocOutfits = [
  "detailed fantasy-tech jacket",
  "premium arcane armor accents",
  "sleek cyber-fantasy cloak",
  "high-end game character outfit",
  "dark layered creator coat",
  "modern tactical fantasy clothing",
  "ornate shoulder details with subtle glow",
  "cinematic adventurer outfit",
  "futuristic collector mantle",
  "mystic streamer champion attire",
  "premium leather and metal textures",
  "light armor details integrated into clothing",
  "dark royal creator robe with tech seams",
  "stylized jacket with subtle holographic trim",
  "battle-ready fantasy-tech wardrobe",
  "elegant digital hero costume",
  "shadow cloak with cyan edge lighting",
  "cosmic explorer clothing",
  "arcane-tech vest and layered fabric",
  "premium esports fantasy outfit",
] as const;

const cardpocMoods = [
  "legendary, mysterious, premium, powerful",
  "focused, cinematic, confident, collectible",
  "heroic, calm, intense, high-status",
  "enigmatic, sharp, elegant, powerful",
  "mythic, composed, dramatic, premium",
  "commanding, immersive, atmospheric, rare",
  "bold, polished, mystical, cinematic",
  "calm but intimidating, radiant, elite",
  "adventurous, magnetic, iconic, refined",
  "powerful but restrained, mysterious, premium",
] as const;

const imageGenerationTools = [
  {
    name: "ChatGPT",
    url: "https://chatgpt.com",
    description: "creatorRequestModalImageToolChatGPTDescription",
    fallback: "Anexe a foto no chat e cole o prompt gerado.",
  },
  {
    name: "Google Gemini",
    url: "https://gemini.google.com",
    description: "creatorRequestModalImageToolGeminiDescription",
    fallback: "Abra um novo chat, anexe a foto e cole o prompt.",
  },
  {
    name: "Microsoft Copilot",
    url: "https://copilot.microsoft.com",
    description: "creatorRequestModalImageToolCopilotDescription",
    fallback: "Use o chat com imagem anexada e cole o prompt.",
  },
  {
    name: "Leonardo AI",
    url: "https://leonardo.ai",
    description: "creatorRequestModalImageToolLeonardoDescription",
    fallback: "Use como referência para gerar uma versão estilizada.",
  },
] as const;

function pickPromptPart(list: readonly string[], seed: number, salt: number) {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  const index = Math.abs(Math.floor(value)) % list.length;

  return list[index];
}

function buildCardpocPrompt(seed: number) {
  const archetype = pickPromptPart(cardpocArchetypes, seed, 1);
  const palette = pickPromptPart(cardpocPalettes, seed, 2);
  const background = pickPromptPart(cardpocBackgrounds, seed, 3);
  const aura = pickPromptPart(cardpocAuras, seed, 4);
  const outfit = pickPromptPart(cardpocOutfits, seed, 5);
  const mood = pickPromptPart(cardpocMoods, seed, 6);

  return `Transform the uploaded photo into a premium digital collectible card portrait.

IMPORTANT:
Preserve the identity, face, hairstyle, facial features and overall appearance of the person in the original image.

Do not create a different character.
Do not change ethnicity, gender, age or facial structure.

CARDPOC VISUAL DNA:
AAA game character portrait, fantasy-tech aesthetic, cinematic lighting, premium collectible card artwork, realistic but stylized, high-end game splash art quality.
The image must feel like part of the Cardpoc collectible creator universe.

STYLE VARIATION:
Archetype: ${archetype}.
Wardrobe direction: ${outfit}.
Background direction: ${background}.
Aura/effects: ${aura}.
Mood: ${mood}.
Color palette: ${palette}.

COMPOSITION:
Vertical portrait.
Aspect ratio 2:3.
Recommended resolution 1024x1536.
Upper body visible.
Subject centered.
Clean background.
Space around the character for future card framing.

CONSISTENCY RULES:
Keep the tone premium, cinematic, fantasy-tech and collectible.
Do not make it cute, cartoonish, childish, comic, anime, chibi, horror, grotesque or overly dark.
Do not create a mascot or a different fictional character.
The person must remain recognizable as themselves.

RESTRICTIONS:
No text.
No logos.
No watermark.
No card frame.
No border.
No UI elements.

Keep the person recognizable while enhancing them into a collectible card hero version of themselves.`;
}

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
  const [promptSeed, setPromptSeed] = useState(() => Date.now());
  const [imageToolsOpen, setImageToolsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imageUsageConsent, setImageUsageConsent] = useState(false);

  const verificationCode = useMemo(() => {
    return `CDP-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }, [open]);

  const aiPrompt = useMemo(() => buildCardpocPrompt(promptSeed), [promptSeed]);

  function handleGeneratePromptVariation() {
    setPromptSeed(Date.now() + Math.floor(Math.random() * 1000000));
    setPromptCopied(false);
  }

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

    if (!imageUsageConsent) {
      setLoading(false);
      alert(
        translate(
          t,
          "creatorImageConsentRequired",
          "Para enviar a solicitação, você precisa autorizar o uso da sua imagem para criação das cartas personalizadas."
        )
      );
      return;
    }

    const consentAcceptedAt = new Date().toISOString();

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
      image_usage_consent: true,
      image_usage_consent_at: consentAcceptedAt,
      image_usage_consent_version: "v1.0",
      image_usage_consent_source: "creator_request",
      image_usage_consent_text:
        "Autorizo o Cardpoc a utilizar minha imagem, nome artístico, identidade pública e conteúdos enviados ou vinculados por mim para criar cartas digitais personalizadas dentro da plataforma.",
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
        <CardpocModalShell
          onClose={onClose}
          className="max-w-3xl"
          contentClassName="no-scrollbar overflow-y-auto p-8 text-white"
          zIndexClassName="z-[90]"
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
                        type="button"
                        onClick={handleGeneratePromptVariation}
                        className="inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-2 text-xs text-purple-100 transition hover:bg-purple-300/20"
                      >
                        <RefreshCw size={14} />
                        {translate(
                          t,
                          "creatorRequestModalGenerateVariation",
                          "Gerar variação"
                        )}
                      </button>

                      <button
                        type="button"
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
                            {translate(t, "creatorRequestModalCopy", "Copiar prompt")}
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setImageToolsOpen(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs text-cyan-100 transition hover:bg-cyan-300/20"
                      >
                        <WandSparkles size={14} />
                        {translate(
                          t,
                          "creatorRequestModalGenerateImage",
                          "Gerar imagem"
                        )}
                      </button>
                    </div>
                  </div>

                  <pre className="no-scrollbar mt-3 max-h-44 overflow-y-auto whitespace-pre-wrap text-xs text-white/50">
                    {aiPrompt}
                  </pre>

                  <AnimatePresence>
                    {imageToolsOpen && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4"
                      >
                        <button
                          type="button"
                          className="absolute inset-0"
                          onClick={() => setImageToolsOpen(false)}
                        />

                        <motion.div
                          initial={{ opacity: 0, scale: 0.94, y: 18 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.94, y: 18 }}
                          className="relative w-full max-w-xl overflow-hidden rounded-[28px] border border-white/15 bg-zinc-950 text-white shadow-[0_0_80px_rgba(0,0,0,0.85)]"
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.16),transparent_34%)]" />

                          <button
                            type="button"
                            onClick={() => setImageToolsOpen(false)}
                            className="absolute right-4 top-4 z-10 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:border-rose-300/30 hover:bg-rose-400/10 hover:text-white"
                          >
                            <X size={18} />
                          </button>

                          <div className="relative p-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
                              <Sparkles size={14} />
                              {translate(
                                t,
                                "creatorRequestModalImageToolBadge",
                                "Imagem"
                              )}
                            </div>

                            <h4 className="mt-4 text-2xl font-black">
                              {translate(
                                t,
                                "creatorRequestModalImageToolTitle",
                                "Escolha onde gerar"
                              )}
                            </h4>

                            <p className="mt-2 text-sm leading-relaxed text-white/55">
                              {translate(
                                t,
                                "creatorRequestModalImageToolDescription",
                                "Este botão não gera a imagem automaticamente. Primeiro anexe uma foto sua na ferramenta escolhida, depois cole o prompt gerado pelo Cardpoc."
                              )}
                            </p>

                            <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm text-amber-100/85">
                              {translate(
                                t,
                                "creatorRequestModalImageToolReminder",
                                "Importante: o prompt só funciona corretamente se uma imagem da pessoa for anexada junto na conversa."
                              )}
                            </div>

                            <div className="mt-5 grid gap-3">
                              {imageGenerationTools.map((tool) => (
                                <a
                                  key={tool.name}
                                  href={tool.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.07]"
                                >
                                  <div>
                                    <p className="font-black">{tool.name}</p>
                                    <p className="mt-1 text-xs text-white/45">
                                      {translate(
                                        t,
                                        tool.description,
                                        tool.fallback
                                      )}
                                    </p>
                                  </div>

                                  <ExternalLink
                                    size={18}
                                    className="shrink-0 text-white/45 transition group-hover:text-cyan-100"
                                  />
                                </a>
                              ))}
                            </div>

                            <button
                              type="button"
                              onClick={handleCopyPrompt}
                              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-black transition hover:bg-white/[0.08]"
                            >
                              {promptCopied ? <Check size={16} /> : <Copy size={16} />}
                              {promptCopied
                                ? translate(t, "creatorRequestModalCopied", "Copiado!")
                                : translate(
                                    t,
                                    "creatorRequestModalCopyBeforeOpening",
                                    "Copiar prompt antes de abrir"
                                  )}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-sm leading-relaxed text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]">
                  <input
                    type="checkbox"
                    checked={imageUsageConsent}
                    onChange={(event) => setImageUsageConsent(event.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 accent-cyan-300"
                  />

                  <span>
                    <strong className="block text-cyan-100">
                      {translate(
                        t,
                        "creatorImageConsentTitle",
                        "Autorização de uso de imagem"
                      )}
                    </strong>

                    <span className="mt-1 block text-white/55">
                      {translate(
                        t,
                        "creatorImageConsentDescription",
                        "Autorizo o Cardpoc a utilizar minha imagem, nome artístico, identidade pública e conteúdos enviados ou vinculados por mim para criar cartas digitais personalizadas dentro da plataforma."
                      )}
                    </span>
                  </span>
                </label>

                <button
                  onClick={handleSubmit}
                  disabled={
                    loading ||
                    uploading ||
                    !nickname ||
                    !username ||
                    !verificationUrl ||
                    !cardImageUrl ||
                    !imageUsageConsent
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
        </CardpocModalShell>
      )}
    </AnimatePresence>
  );
}