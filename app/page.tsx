import { CreatorProfilePage } from "@/components/creator/CreatorProfilePage";
import type { Metadata } from "next";

const SITE_NAME = "Cardpoc";
const DEFAULT_SITE_URL = "https://www.cardpoc.com";

function getSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return rawUrl.replace(/\/$/, "");
}

function formatCreatorName(username: string) {
  return decodeURIComponent(username).trim();
}

function getCreatorDescription(username: string) {
  return `Confira o perfil de ${username} no Cardpoc: cartas colecionáveis, raridade, estatísticas, clipes em destaque e presença digital do criador.`;
}

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;

  const username = formatCreatorName(rawUsername);
  const encodedUsername = encodeURIComponent(username);
  const siteUrl = getSiteUrl();

  const profileUrl = `${siteUrl}/creator/${encodedUsername}`;
  const ogImage = `${siteUrl}/api/og/card/${encodedUsername}?v=4`;
  const description = getCreatorDescription(username);

  return {
    title: `${username} | ${SITE_NAME}`,
    description,

    metadataBase: new URL(siteUrl),

    alternates: {
      canonical: profileUrl,
    },

    openGraph: {
      url: profileUrl,
      siteName: SITE_NAME,
      title: `${username} | ${SITE_NAME}`,
      description,
      type: "profile",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${username} no ${SITE_NAME}`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${username} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export default async function CreatorUsernamePage({ params }: PageProps) {
  const { username: rawUsername } = await params;

  const username = formatCreatorName(rawUsername);
  const encodedUsername = encodeURIComponent(username);
  const siteUrl = getSiteUrl();
  const profileUrl = `${siteUrl}/creator/${encodedUsername}`;
  const description = getCreatorDescription(username);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: username,
    url: profileUrl,
    description,
    mainEntityOfPage: profileUrl,
    sameAs: [],
  };

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <CreatorProfilePage username={username} />
    </>
  );
}
