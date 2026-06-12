import type { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, ShieldCheck } from "lucide-react";

import { translate } from "@/lib/i18n/translate";
import { SOCIAL_PLATFORM_OPTIONS } from "../core/creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorClaimModalProps = {
  open: boolean;
  t: TranslateFunction;
  claimSuccess: boolean;
  claimCode: string;
  claimPlatform: string;
  claimUrl: string;
  claimImageUsageConsent: boolean;
  claimSending: boolean;
  onClose: () => void;
  onClaimPlatformChange: (value: string) => void;
  onClaimUrlChange: (value: string) => void;
  onClaimImageUsageConsentChange: (checked: boolean) => void;
  onSubmit: () => void;
};

export function CreatorClaimModal({
  open,
  t,
  claimSuccess,
  claimCode,
  claimPlatform,
  claimUrl,
  claimImageUsageConsent,
  claimSending,
  onClose,
  onClaimPlatformChange,
  onClaimUrlChange,
  onClaimImageUsageConsentChange,
  onSubmit,
}: CreatorClaimModalProps) {
  if (!open) return null;

  return (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl">
    <button
      type="button"
      aria-label={translate(t, "creatorProfileClose", "Fechar")}
      className="absolute inset-0"
      onClick={onClose}
    />

    <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-300/20 bg-[#08050d]/95 p-6 text-white shadow-2xl shadow-yellow-500/10 sm:p-8">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
      >
        {translate(t, "creatorProfileClose", "Fechar")}
      </button>

      {claimSuccess ? (
        <div className="pr-10">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            {translate(t, "creatorPopupClaimSentBadge", "Claim Sent")}
          </p>

          <h3 className="mt-3 text-3xl font-black">
            {translate(
              t,
              "creatorPopupClaimSentTitle",
              "Solicitação enviada",
            )}
          </h3>

          <p className="mt-4 text-sm leading-6 text-white/60">
            {translate(
              t,
              "creatorPopupClaimSentDescription",
              "Agora coloque o código abaixo na bio, descrição ou sobre da plataforma informada. Um administrador irá revisar sua solicitação.",
            )}
          </p>

          <div className="mt-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5 text-center text-2xl font-black tracking-[0.25em] text-cyan-100">
            {claimCode}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08]"
          >
            {translate(t, "creatorProfileClose", "Fechar")}
          </button>
        </div>
      ) : (
        <div className="pr-10">
          <p className="text-sm uppercase tracking-[0.3em] text-yellow-300">
            {translate(
              t,
              "creatorPopupClaimProfileBadge",
              "Claim Profile",
            )}
          </p>

          <h3 className="mt-3 text-3xl font-black">
            {translate(t, "creatorPopupClaimMine", "Este perfil é meu")}
          </h3>

          <p className="mt-4 text-sm leading-6 text-white/60">
            {translate(
              t,
              "creatorPopupClaimDescription",
              "Para provar que este perfil pertence a você, informe uma plataforma oficial e coloque temporariamente o código abaixo na bio/descrição do canal.",
            )}
          </p>

          <div className="mt-6 rounded-3xl border border-yellow-300/15 bg-yellow-300/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-200/70">
              {translate(
                t,
                "creatorPopupClaimCode",
                "Código de verificação",
              )}
            </p>

            <p className="mt-2 text-xl font-black tracking-[0.25em] text-white">
              {claimCode}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[180px_1fr]">
            <select
              value={claimPlatform}
              onChange={(event) => onClaimPlatformChange(event.target.value)}
              className="rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none focus:border-yellow-300/40"
            >
              {SOCIAL_PLATFORM_OPTIONS.filter(
                (platform) => platform.value !== "link",
              ).map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>

            <input
              value={claimUrl}
              onChange={(event) => onClaimUrlChange(event.target.value)}
              placeholder={translate(
                t,
                "creatorPopupClaimUrlPlaceholder",
                "Link do canal ou perfil oficial",
              )}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-yellow-300/40"
            />
          </div>

          <label className="mt-6 flex cursor-pointer gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-4 text-sm leading-relaxed text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]">
            <input
              type="checkbox"
              checked={claimImageUsageConsent}
              onChange={(event) =>
                onClaimImageUsageConsentChange(event.target.checked)
              }
              className="mt-1 h-4 w-4 shrink-0 accent-cyan-300"
            />

            <span>
              <strong className="block text-cyan-100">
                {translate(
                  t,
                  "creatorImageConsentTitle",
                  "Autorização para cartas personalizadas",
                )}
              </strong>
              {translate(
                t,
                "creatorImageConsentDescription",
                "Autorizo o Cardpoc a utilizar minha imagem, nome artístico, identidade pública e conteúdos enviados ou vinculados por mim para criar cartas digitais personalizadas dentro da plataforma.",
              )}
            </span>
          </label>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={claimSending || !claimImageUsageConsent}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-6 py-3 text-sm font-black text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {claimSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {claimSending
                ? translate(t, "creatorPopupSending", "Enviando...")
                : translate(
                    t,
                    "creatorPopupSendClaim",
                    "Enviar reivindicação",
                  )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08]"
            >
              {translate(t, "creatorProfileCancelEdit", "Cancelar")}
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
