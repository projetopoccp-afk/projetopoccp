import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://www.cardpoc.com";
const SITEMAP_PAGE_SIZE = 1000;
const SITEMAP_MAX_CREATORS = 50000;

type CreatorSitemapRow = {
  username: string | null;
  created_at: string | null;
};

function createSupabaseSitemapClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function normalizeCreatorUsername(username: string) {
  return username.trim();
}

function buildCreatorUrl(username: string) {
  return `${SITE_URL}/creator/${encodeURIComponent(username)}`;
}

async function getPublicCreatorsForSitemap(): Promise<CreatorSitemapRow[]> {
  const supabase = createSupabaseSitemapClient();

  if (!supabase) {
    return [];
  }

  const creators: CreatorSitemapRow[] = [];

  for (let from = 0; from < SITEMAP_MAX_CREATORS; from += SITEMAP_PAGE_SIZE) {
    const to = from + SITEMAP_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("creator_profiles")
      .select("username, created_at")
      .eq("is_public", true)
      .not("username", "is", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error || !data || data.length === 0) {
      break;
    }

    creators.push(...data);

    if (data.length < SITEMAP_PAGE_SIZE) {
      break;
    }
  }

  return creators;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const creators = await getPublicCreatorsForSitemap();

  const creatorUrls: MetadataRoute.Sitemap = creators
    .map((creator) => {
      const username = creator.username
        ? normalizeCreatorUsername(creator.username)
        : "";

      if (!username) {
        return null;
      }

      return {
        url: buildCreatorUrl(username),
        lastModified: creator.created_at ? new Date(creator.created_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    })
    .filter((item): item is MetadataRoute.Sitemap[number] => Boolean(item));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    ...creatorUrls,
  ];
}
