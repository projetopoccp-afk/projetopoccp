"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Globe2,
  Loader2,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import { getRarityLabel } from "@/lib/rarity";
import { supabase } from "@/lib/supabase/client";

type CreatorProfilePageProps = {
  username: string;
};

type CreatorCardRow = {
  rarity: string | null;
  rank: string | null;
  aura: string | null;
  evolution_stage: string | null;
  level: number | null;
  power_score: number | null;
};

type CreatorProfileRow = {
  id: string;
  user_id: string | null;
  username: string;
  nickname: string;
  title: string | null;
  faction: string | null;
  category: string | null;
  status: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  description: string | null;
  tags: unknown;
  is_verified: boolean | null;
  created_at: string | null;
  trending_score: number | null;
  creator_cards?: CreatorCardRow[] | CreatorCardRow | null;
};

type SocialLink = {
  platform: string;
  url: string;
};

type AutoClip = {
  id: string;
  title: string;
  platform: string;
  url: string;
  thumbnail_url: string | null;
  description: string | null;
  created_at: string | null;
  view_count: number | null;
};

type CreatorStats = {
  views: number;
  followers: number;
  shares: number;
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  tiktok: "TikTok",
  kick: "Kick",
  instagram: "Instagram",
  discord: "Discord",
  x: "X",
};

function normalizeCreatorTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags !== "string") return [];

  const trimmed = tags.trim();

  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.map((tag) => String(tag).trim()).filter(Boolean);
    }
  } catch {
    // Fallback below for comma-separated values.
  }

  return trimmed
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((tag) => tag.replace(/"/g, "").trim())
    .filter(Boolean);
}

function getCreatorCard(profile: CreatorProfileRow | null): CreatorCardRow | null {
  if (!profile?.creator_cards) return null;

  if (Array.isArray(profile.creator_cards)) {
    return profile.creator_cards[0] || null;
  }

  return profile.creator_cards;
}

function getInitials(name: string) {
  const cleanName = name.trim();

  if (!cleanName) return "CP";

  return cleanName.slice(0, 2).toUpperCase();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function getPlatformLabel(platform: string) {
  const normalizedPlatform = platform.toLowerCase();

  return PLATFORM_LABELS[normalizedPlatform] || platform;
}

function tr(
  t: unknown,
  key: string,
  fallback: string
) {
  return translate(
    t as Parameters<typeof translate>[0],
    key as Parameters<typeof translate>[1],
    fallback
  );
}

export function CreatorProfilePage({ username }: CreatorProfilePageProps) {
  const { t } = useLanguage();

  const [profile, setProfile] = useState<CreatorProfileRow | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [clips, setClips] = useState<AutoClip[]>([]);
  const [stats, setStats] = useState<CreatorStats>({
    views: 0,
    followers: 0,
    shares: 0,
  });
  const [loading, setLoading] = useState(true);

  const decodedUsername = useMemo(() => {
    return decodeURIComponent(username || "").replace("@", "").trim();
  }, [username]);

  useEffect(() => {
    let cancelled = false;

    async function loadCreatorProfile() {
      setLoading(true);

      const { data, error } = await supabase
        .from("creator_profiles")
        .select(
          `
          id,
          user_id,
          username,
          nickname,
          title,
          faction,
          category,
          status,
          avatar_url,
          banner_url,
          bio,
          description,
          tags,
          is_verified,
          created_at,
          trending_score,
          share_count,
          creator_cards (
            rarity,
            rank,
            aura,
            evolution_stage,
            level,
            power_score
          )
        `
        )
        .eq("is_public", true)
        .ilike("username", decodedUsername)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setProfile(null);
        setSocialLinks([]);
        setClips([]);
        setStats({
          views: 0,
          followers: 0,
          shares: 0,
        });
        setLoading(false);
        return;
      }

      const typedProfile = data as CreatorProfileRow & {
        share_count?: number | null;
      };

      setProfile(typedProfile);

      const [
        { data: socialData },
        { data: clipData },
        { count: viewCount },
        { count: followerCount },
      ] = await Promise.all([
        supabase
          .from("creator_social_links")
          .select("platform, url")
          .eq("creator_id", typedProfile.id)
          .order("platform", { ascending: true }),
        supabase
          .from("creator_auto_clips")
          .select(
            "id, title, platform, url, thumbnail_url, description, created_at, view_count"
          )
          .eq("creator_id", typedProfile.id)
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("creator_views")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", typedProfile.id),
        supabase
          .from("creator_followers")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", typedProfile.id),
      ]);

      if (cancelled) return;

      setSocialLinks((socialData || []) as SocialLink[]);
      setClips((clipData || []) as AutoClip[]);
      setStats({
        views: viewCount || 0,
        followers: followerCount || 0,
        shares: typedProfile.share_count || 0,
      });
      setLoading(false);
    }

    if (decodedUsername) {
      loadCreatorProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [decodedUsername]);

  const card = getCreatorCard(profile);
  const nickname =
    profile?.nickname ||
    decodedUsername ||
    tr(t, "creatorProfileFallbackName", "Criador Cardpoc");
  const title =
    profile?.title ||
    tr(t, "creatorProfileDefaultTitle", "Criador de conteúdo");
  const category =
    profile?.category ||
    tr(t, "creatorProfileDefaultCategory", "Criador");
  const faction =
    profile?.faction ||
    tr(t, "creatorProfileDefaultFaction", "Cardpoc");
  const bio =
    profile?.bio ||
    translate(
      t,
      "creatorProfileDefaultBio",
      "Perfil público de criador aprovado no Cardpoc."
    );
  const description =
    profile?.description ||
    translate(
      t,
      "creatorProfileDefaultDescription",
      "Acompanhe cartas colecionáveis, presença digital, redes sociais e momentos em destaque deste criador no Cardpoc."
    );
  const rarity = card?.rarity || "common";
  const tags = normalizeCreatorTags(profile?.tags);
  const ogCardUrl = `/api/og/card/${encodeURIComponent(
    profile?.username || decodedUsername
  )}`;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-4 text-sm text-white/70 shadow-2xl shadow-cyan-500/10">
            <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
            {tr(t, "creatorProfileLoading", "Carregando perfil do criador...")}
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center text-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 p-4 text-cyan-100">
            <Sparkles className="h-7 w-7" />
          </div>

          <h1 className="mt-6 text-3xl font-black tracking-tight md:text-5xl">
            {tr(t, "creatorProfileNotFoundTitle", "Criador não encontrado")}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 md:text-base">
            {translate(
              t,
              "creatorProfileNotFoundDescription",
              "Este perfil ainda não está público ou não existe no Cardpoc."
            )}
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            <ArrowLeft className="h-4 w-4" />
            {tr(t, "creatorProfileBackHome", "Voltar para o Cardpoc")}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.20),transparent_42%)]" />

        {profile.banner_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url(${profile.banner_url})`,
            }}
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/60 via-[#020617]/86 to-[#020617]" />

        <div className="relative mx-auto max-w-7xl px-6 py-8 md:py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-white/65 transition hover:border-cyan-300/30 hover:text-cyan-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {tr(t, "creatorProfileExploreCreators", "Explorar criadores")}
          </Link>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.24em] text-cyan-100">
                  {tr(t, "creatorProfilePublicProfile", "Perfil público")}
                </span>

                {profile.is_verified ? (
                  <span className="inline-flex items-center gap-2 rounded-full border border-yellow-300/25 bg-yellow-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-yellow-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {tr(t, "creatorProfileVerified", "Verificado")}
                  </span>
                ) : null}

                <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-fuchsia-100">
                  {getRarityLabel(rarity)}
                </span>
              </div>

              <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-[-0.06em] text-white md:text-7xl">
                {nickname}
              </h1>

              <p className="mt-4 text-lg font-semibold text-cyan-100/90 md:text-2xl">
                {title}
              </p>

              <p className="mt-3 text-sm font-medium text-white/50 md:text-base">
                @{profile.username}
              </p>

              <p className="mt-7 max-w-3xl text-base leading-8 text-white/68 md:text-lg">
                {bio}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/75">
                  {category}
                </span>

                <span className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-white/75">
                  {faction}
                </span>

                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-2 text-sm font-bold text-cyan-100/85"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 shadow-2xl shadow-cyan-500/10 backdrop-blur">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-300/20 via-fuchsia-400/10 to-black">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={nickname}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-7xl font-black text-cyan-100">
                    {getInitials(nickname)}
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-5">
                  <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-100/80">
                    {tr(t, "creatorProfileCardLabel", "Carta Cardpoc")}
                  </p>
                  <p className="mt-1 text-2xl font-black">{nickname}</p>
                </div>
              </div>

              <a
                href={ogCardUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
              >
                <Star className="h-4 w-4" />
                {tr(t, "creatorProfileViewShareCard", "Ver carta compartilhável")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 md:grid-cols-3">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/40">
            {tr(t, "creatorProfileViews", "Visualizações")}
          </p>
          <p className="mt-3 text-4xl font-black">{formatNumber(stats.views)}</p>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/40">
            {tr(t, "creatorProfileFollowers", "Seguidores")}
          </p>
          <p className="mt-3 text-4xl font-black">{formatNumber(stats.followers)}</p>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-white/40">
            {tr(t, "creatorProfileShares", "Compartilhamentos")}
          </p>
          <p className="mt-3 text-4xl font-black">{formatNumber(stats.shares)}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-14 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-cyan-200" />
              <h2 className="text-2xl font-black tracking-tight">
                {tr(t, "creatorProfileAboutTitle", "Sobre o criador")}
              </h2>
            </div>

            <p className="mt-5 whitespace-pre-line text-base leading-8 text-white/68">
              {description}
            </p>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <PlayCircle className="h-5 w-5 text-fuchsia-200" />
              <h2 className="text-2xl font-black tracking-tight">
                {tr(t, "creatorProfileFeaturedClips", "Clipes em destaque")}
              </h2>
            </div>

            {clips.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {clips.map((clip) => (
                  <a
                    key={clip.id}
                    href={clip.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-[1.4rem] border border-white/10 bg-black/25 transition hover:border-cyan-300/30"
                  >
                    <div className="aspect-video bg-white/[0.04]">
                      {clip.thumbnail_url ? (
                        <img
                          src={clip.thumbnail_url}
                          alt={clip.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-white/30">
                          <PlayCircle className="h-10 w-10" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/60">
                        {getPlatformLabel(clip.platform)}
                      </p>
                      <h3 className="mt-2 line-clamp-2 text-sm font-black leading-6 text-white">
                        {clip.title}
                      </h3>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/50">
                {translate(
                  t,
                  "creatorProfileNoClips",
                  "Este criador ainda não possui clipes públicos em destaque."
                )}
              </p>
            )}
          </article>
        </div>

        <aside className="space-y-6">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <Globe2 className="h-5 w-5 text-cyan-200" />
              <h2 className="text-xl font-black tracking-tight">
                {tr(t, "creatorProfileSocialLinks", "Redes sociais")}
              </h2>
            </div>

            {socialLinks.length > 0 ? (
              <div className="mt-5 space-y-3">
                {socialLinks.map((social) => (
                  <a
                    key={`${social.platform}-${social.url}`}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/75 transition hover:border-cyan-300/30 hover:text-cyan-100"
                  >
                    <span>{getPlatformLabel(social.platform)}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/50">
                {translate(
                  t,
                  "creatorProfileNoSocialLinks",
                  "As redes sociais deste criador ainda não foram adicionadas."
                )}
              </p>
            )}
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-fuchsia-200" />
              <h2 className="text-xl font-black tracking-tight">
                {tr(t, "creatorProfileCardStats", "Carta do criador")}
              </h2>
            </div>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="text-white/45">
                  {tr(t, "creatorProfileCardRarity", "Raridade")}
                </span>
                <strong>{getRarityLabel(rarity)}</strong>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="text-white/45">
                  {tr(t, "creatorProfileCardRank", "Rank")}
                </span>
                <strong>
                  {card?.rank || tr(t, "creatorProfileDefaultRank", "Bronze")}
                </strong>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="text-white/45">
                  {tr(t, "creatorProfileCardLevel", "Nível")}
                </span>
                <strong>{card?.level || 1}</strong>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
                <span className="text-white/45">
                  {tr(t, "creatorProfileCardPower", "Poder")}
                </span>
                <strong>{formatNumber(card?.power_score || 0)}</strong>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}
