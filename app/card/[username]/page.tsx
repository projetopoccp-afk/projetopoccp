import type { Metadata } from "next";

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

const cardPageText = {
  eyebrow: "card.share.eyebrow",
  titlePrefix: "card.share.titlePrefix",
  description: "card.share.description",
} as const;

const cardPageFallback = {
  [cardPageText.eyebrow]: BRAND_NAME,
  [cardPageText.titlePrefix]: "Carta",
  [cardPageText.description]:
    "Esta carta pode ser compartilhada nas redes sociais.",
} as const;

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="text-center">
        <p
          className="text-xs uppercase tracking-[0.35em] text-cyan-200"
          data-i18n-key={cardPageText.eyebrow}
        >
          {cardPageFallback[cardPageText.eyebrow]}
        </p>

        <h1 className="mt-4 text-4xl font-black">
          <span data-i18n-key={cardPageText.titlePrefix}>
            {cardPageFallback[cardPageText.titlePrefix]}
          </span>{" "}
          {cleanUsername}
        </h1>

        <p
          className="mt-3 text-sm text-white/50"
          data-i18n-key={cardPageText.description}
        >
          {cardPageFallback[cardPageText.description]}
        </p>
      </div>
    </main>
  );
}
