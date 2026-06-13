import type { RefObject } from "react";
import { ChevronDown, Loader2, Plus, Sparkles } from "lucide-react";

import { CREATOR_POPUP_IMAGE_EFFECT_STYLES } from "@/components/creator/CreatorPopupImageEffects";
import {
  getEditSocialLinkRows,
  translateExisting,
} from "../core/creator-profile-shared";
import type { CreatorProfileEditDraft, SocialLink } from "../core/creator-profile-shared";


const SOCIAL_PLATFORM_OPTIONS = [
  { value: "twitch", label: "Twitch" },
  { value: "kick", label: "Kick" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X / Twitter" },
  { value: "tiktok", label: "TikTok" },
  { value: "discord", label: "Discord" },
  { value: "site", label: "Site" },
];

type CreatorEditProfileModalProps = {
  open: boolean;
  editDraft: CreatorProfileEditDraft | null;
  isSavingProfile: boolean;
  profileSaveError: string | null;
  popupEffectDropdownOpen: boolean;
  popupEffectDropdownRef: RefObject<HTMLDivElement | null>;
  t: unknown;
  onClose: () => void;
  onSave: () => void;
  onDraftChange: (field: keyof CreatorProfileEditDraft, value: string) => void;
  onSocialLinkChange: (
    index: number,
    field: keyof SocialLink,
    value: string,
  ) => void;
  onAddSocialLink: () => void;
  onRemoveSocialLink: (index: number) => void;
  onToggleEffectDropdown: () => void;
  onCloseEffectDropdown: () => void;
};

export function CreatorEditProfileModal({
  open,
  editDraft,
  isSavingProfile,
  profileSaveError,
  popupEffectDropdownOpen,
  popupEffectDropdownRef,
  t,
  onClose,
  onSave,
  onDraftChange,
  onSocialLinkChange,
  onAddSocialLink,
  onRemoveSocialLink,
  onToggleEffectDropdown,
  onCloseEffectDropdown,
}: CreatorEditProfileModalProps) {
  if (!open || !editDraft) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label={translateExisting(
          t,
          "creatorProfileEditCloseAria",
          "Fechar edição de perfil",
        )}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      <section className="relative z-10 flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#05070d]/95 shadow-2xl shadow-cyan-500/20 backdrop-blur-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200/70">
              {translateExisting(
                t,
                "creatorProfileCreatorPanelButton",
                "Painel do Criador",
              )}
            </p>
            <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
              {translateExisting(t, "creatorProfileEditProfile", "Editar perfil")}
            </h2>
            <p className="mt-1 text-sm leading-6 text-white/55">
              {translateExisting(
                t,
                "creatorProfileEditPublicInfoDescription",
                "Atualize somente as informações públicas que aparecem no Cardpoc.",
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSavingProfile}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xl font-black text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 [scrollbar-width:none] [-ms-overflow-style:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                {translateExisting(
                  t,
                  "creatorProfileEditNickname",
                  "Nome público",
                )}
              </span>
              <input
                value={editDraft.nickname}
                onChange={(event) => onDraftChange("nickname", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
                placeholder={translateExisting(
                  t,
                  "creatorProfileEditNicknamePlaceholder",
                  "Nome do criador",
                )}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                {translateExisting(t, "creatorProfileEditTitle", "Título")}
              </span>
              <input
                value={editDraft.title}
                onChange={(event) => onDraftChange("title", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
                placeholder={translateExisting(
                  t,
                  "creatorProfileEditTitlePlaceholder",
                  "Streamer, criador, guild leader...",
                )}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                {translateExisting(t, "creatorProfileEditCategory", "Categoria")}
              </span>
              <input
                value={editDraft.category}
                onChange={(event) => onDraftChange("category", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
                placeholder={translateExisting(
                  t,
                  "creatorProfileEditCategoryPlaceholder",
                  "Black Desert, MMORPG, Lives...",
                )}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                {translateExisting(
                  t,
                  "creatorProfileEditAvatarUrl",
                  "Avatar URL",
                )}
              </span>
              <input
                value={editDraft.avatarUrl}
                onChange={(event) => onDraftChange("avatarUrl", event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.85fr]">
            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                {translateExisting(t, "creatorProfileEditBio", "Bio curta")}
              </span>
              <textarea
                value={editDraft.bio}
                onChange={(event) => onDraftChange("bio", event.target.value)}
                rows={4}
                className="min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
                placeholder={translateExisting(
                  t,
                  "creatorProfileEditBioPlaceholder",
                  "Resumo curto para o topo do perfil.",
                )}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
                {translateExisting(t, "creatorProfileEditTags", "Tags")}
              </span>
              <textarea
                value={editDraft.tagsText}
                onChange={(event) => onDraftChange("tagsText", event.target.value)}
                rows={4}
                className="min-h-[120px] w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
                placeholder={translateExisting(
                  t,
                  "creatorProfileEditTagsPlaceholder",
                  "Streamer, MMORPG, Black Desert",
                )}
              />
              <p className="text-xs text-white/40">
                {translateExisting(
                  t,
                  "creatorProfileEditTagsHelp",
                  "Separe as tags por vírgula.",
                )}
              </p>
            </label>
          </div>

          <label className="mt-4 block space-y-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/45">
              {translateExisting(
                t,
                "creatorProfileEditDescription",
                "Descrição completa",
              )}
            </span>
            <textarea
              value={editDraft.description}
              onChange={(event) => onDraftChange("description", event.target.value)}
              rows={5}
              className="min-h-[150px] w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-medium leading-6 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
              placeholder={translateExisting(
                t,
                "creatorProfileEditDescriptionPlaceholder",
                "Conte mais sobre o criador, comunidade, conteúdo e objetivos.",
              )}
            />
          </label>

          <div ref={popupEffectDropdownRef} className="relative mt-5">
            <button
              type="button"
              onClick={onToggleEffectDropdown}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-left text-xs font-black uppercase tracking-[0.18em] text-cyan-100 shadow-lg shadow-cyan-500/10 transition hover:border-cyan-300/45 hover:bg-cyan-300/15"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {translateExisting(
                  t,
                  "creatorProfileEditPresentationEffects",
                  "Efeitos de apresentação",
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition ${
                  popupEffectDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {popupEffectDropdownOpen ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-3 max-h-[280px] overflow-y-auto rounded-[1.5rem] border border-cyan-300/20 bg-[#05070d]/98 p-2 shadow-2xl shadow-cyan-500/20 backdrop-blur-xl [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {CREATOR_POPUP_IMAGE_EFFECT_STYLES.map((effectStyle) => {
                  const isSelected =
                    (editDraft.popupAnimationStyle || "none") ===
                    effectStyle.value;

                  return (
                    <button
                      key={effectStyle.value}
                      type="button"
                      onClick={() => {
                        onDraftChange("popupAnimationStyle", effectStyle.value);
                        onCloseEffectDropdown();
                      }}
                      className={`w-full rounded-[1rem] border px-3 py-2.5 text-left transition ${
                        isSelected
                          ? "border-cyan-300/55 bg-cyan-300/15 shadow-lg shadow-cyan-500/10"
                          : "border-white/10 bg-white/[0.03] hover:border-cyan-300/30 hover:bg-cyan-300/[0.07]"
                      }`}
                    >
                      <span className="block text-xs font-black uppercase tracking-[0.18em] text-white/85">
                        {translateExisting(t, effectStyle.labelKey, effectStyle.fallback)}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-white/45">
                        {translateExisting(
                          t,
                          effectStyle.descriptionKey,
                          effectStyle.descriptionFallback,
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-white">
                  {translateExisting(
                    t,
                    "creatorProfileSocialLinks",
                    "Redes sociais",
                  )}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/45">
                  {translateExisting(
                    t,
                    "creatorProfileEditSocialLinksDescription",
                    "Adicione links públicos que aparecem no perfil.",
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onAddSocialLink}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/20"
              >
                <Plus className="h-3.5 w-3.5" />
                {translateExisting(
                  t,
                  "creatorProfileEditAddSocialLinkShort",
                  "Adicionar",
                )}
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {getEditSocialLinkRows(editDraft.socialLinksText).map(
                (social, index) => (
                  <div
                    key={`social-link-${index}`}
                    className="grid gap-2 rounded-2xl border border-white/10 bg-black/25 p-3 sm:grid-cols-[160px_minmax(0,1fr)_auto]"
                  >
                    <select
                      value={social.platform}
                      onChange={(event) =>
                        onSocialLinkChange(index, "platform", event.target.value)
                      }
                      className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-300/50"
                    >
                      {!SOCIAL_PLATFORM_OPTIONS.some(
                        (option) => option.value === social.platform,
                      ) && social.platform ? (
                        <option value={social.platform}>{social.platform}</option>
                      ) : null}
                      <option value="">
                        {translateExisting(
                          t,
                          "creatorProfileEditSelectSocialNetwork",
                          "Selecione a rede",
                        )}
                      </option>
                      {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      value={social.url}
                      onChange={(event) =>
                        onSocialLinkChange(index, "url", event.target.value)
                      }
                      className="rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyan-300/50"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={() => onRemoveSocialLink(index)}
                      className="inline-flex items-center justify-center rounded-xl border border-red-300/20 bg-red-300/10 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-red-100 transition hover:bg-red-300/20"
                    >
                      {translateExisting(
                        t,
                        "creatorProfileEditRemoveSocialLinkShort",
                        "Remover",
                      )}
                    </button>
                  </div>
                ),
              )}
            </div>
          </div>

          {profileSaveError ? (
            <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 px-4 py-3 text-sm font-bold text-red-100">
              {profileSaveError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSavingProfile}
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {translateExisting(t, "creatorProfileCancelEdit", "Cancelar")}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSavingProfile}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-5 py-3 text-sm font-black text-cyan-50 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {translateExisting(
              t,
              "creatorProfileSaveChanges",
              "Salvar alterações",
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
