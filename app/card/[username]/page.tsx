import type { Metadata } from "next";

import { CardShareContent } from "./CardShareContent";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

const DEFAULT_SITE_URL = "https://www.cardpoc.com";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(
  /\/$/,
  ""
);

const BRAND_NAME = "Cardpoc";

function normalizeUsername(username: string) {
  return decodeURIComponent(username).replace("@", "").trim();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = normalizeUsername(username);
  const encodedUsername = encodeURIComponent(cleanUsername);

  const cardUrl = `${SITE_URL}/card/${encodedUsername}`;
  const imageUrl = `${SITE_URL}/api/og/card/${encodedUsername}`;

  const title = `Carta ${cleanUsername} | ${BRAND_NAME}`;
  const description = `Carta colecionável de ${cleanUsername} no ${BRAND_NAME}.`;

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical: cardUrl,
    },
    openGraph: {
      title,
      description,
      url: cardUrl,
      siteName: BRAND_NAME,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Carta ${cleanUsername} no ${BRAND_NAME}`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CardPage({ params }: PageProps) {
  const { username } = await params;
  const cleanUsername = normalizeUsername(username);

  return <CardShareContent username={cleanUsername} />;
}
