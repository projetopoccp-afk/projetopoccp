import type { RefObject } from "react";
import type { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, Share2, ShieldCheck, UserCheck, UserPlus } from "lucide-react";

import { translate } from "@/lib/i18n/translate";
import { CreatorSocialDropdown } from "../sections/CreatorSocialDropdown";
import type {
  CreatorProfileEditDraft,
  LiveStatusMap,
  SocialLink,
  VisibleYoutubeChannel,
} from "../core/creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorProfileHeroActionsProps = {
  t: TranslateFunction;
  isEditing: boolean;
  editDraft: CreatorProfileEditDraft | null;
  visibleTags: string[];
  followLoading: boolean;
  isFollowing: boolean;
  profileLinkCopied: boolean;
  isProfileClaimable: boolean;
  socialLinksDropdownRef: RefObject<HTMLDivElement | null>;
  socialLinksOpen: boolean;
  socialDropdownItems: SocialLink[];
  liveStatus: LiveStatusMap;
  visibleYoutubeChannels: VisibleYoutubeChannel[];
  youtubeExternalReach: number;
  onFollow: () => void | Promise<void>;
  onCopyProfileLink: () => void | Promise<void>;
  onOpenClaimModal: () => void;
  onToggleSocialLinks: () => void;
  onCloseSocialLinks: () => void;
  onOpenYoutubeChannels: () => void;
  onEditDraftChange: (field: keyof CreatorProfileEditDraft, value: string) => void;
};

export function CreatorProfileHeroActions({
  t,
  isEditing,
  editDraft,
  visibleTags,
  followLoading,
  isFollowing,
  profileLinkCopied,
  isProfileClaimable,
  socialLinksDropdownRef,
  socialLinksOpen,
  socialDropdownItems,
  liveStatus,
  visibleYoutubeChannels,
  youtubeExternalReach,
  onFollow,
  onCopyProfileLink,
  onOpenClaimModal,
  onToggleSocialLinks,
  onCloseSocialLinks,
  onOpenYoutubeChannels,
  onEditDraftChange,
}: CreatorProfileHeroActionsProps) {
  return (
    <>
      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onFollow}
          disabled={followLoading}
          className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {followLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isFollowing ? (
            <UserCheck className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isFollowing
            ? translate(t, "creatorPopupFollowing", "Seguindo")
            : translate(t, "creatorPopupFollow", "Seguir")}
        </button>

        <button
          type="button"
          onClick={onCopyProfileLink}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/70 transition hover:border-cyan-300/25 hover:text-cyan-100"
        >
          <Share2 className="h-4 w-4" />
          {profileLinkCopied
            ? translate(t, "creatorProfileProfileLinkCopied", "Link copiado")
            : translate(t, "creatorProfileCopyProfileLink", "Copiar link do perfil")}
        </button>

        {!isEditing && isProfileClaimable ? (
          <button
            type="button"
            onClick={onOpenClaimModal}
            className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-5 py-3 text-sm font-black text-yellow-100 transition hover:bg-yellow-300/20"
          >
            <ShieldCheck className="h-4 w-4" />
            {translate(t, "creatorPopupClaimProfileBadge", "Reivindicar Perfil")}
          </button>
        ) : null}

        <CreatorSocialDropdown
          t={t}
          dropdownRef={socialLinksDropdownRef}
          open={socialLinksOpen}
          items={socialDropdownItems}
          liveStatus={liveStatus}
          visibleYoutubeChannels={visibleYoutubeChannels}
          youtubeExternalReach={youtubeExternalReach}
          onToggle={onToggleSocialLinks}
          onClose={onCloseSocialLinks}
          onOpenYoutubeChannels={onOpenYoutubeChannels}
        />
      </div>

      {isEditing && editDraft ? (
        <div className="mt-4 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100/70">
              {translate(t, "creatorProfileEditTags", "Tags")}
            </span>
            <input
              value={editDraft.tagsText}
              onChange={(event) => onEditDraftChange("tagsText", event.target.value)}
              placeholder={translate(
                t,
                "creatorProfileEditTagsPlaceholder",
                "Streamer, MMORPG, Black Desert",
              )}
              className="mt-2 w-full rounded-[1.2rem] border border-cyan-300/20 bg-black/35 px-4 py-3 text-sm font-semibold text-cyan-100 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
            />
          </label>
        </div>
      ) : visibleTags.length > 0 ? (
        <div className="mt-7 flex flex-wrap gap-3">
          {visibleTags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-2 text-sm font-bold text-cyan-100/85 backdrop-blur"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
