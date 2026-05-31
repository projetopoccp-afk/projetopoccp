import type { Metadata } from "next";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://projetopoccp.vercel.app";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).replace("@", "").trim();

  const cardUrl = `${siteUrl}/card/${cleanUsername}`;
  const imageUrl = `${siteUrl}/api/og/card/${cleanUsername}`;

  return {
    title: `Carta ${cleanUsername} | Creator Nexus`,
    description: `Carta colecionável de ${cleanUsername} no Creator Nexus.`,
    openGraph: {
      title: `Carta ${cleanUsername} | Creator Nexus`,
      description: `Carta colecionável de ${cleanUsername} no Creator Nexus.`,
      url: cardUrl,
      siteName: "Creator Nexus",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Carta ${cleanUsername} no Creator Nexus`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Carta ${cleanUsername} | Creator Nexus`,
      description: `Carta colecionável de ${cleanUsername} no Creator Nexus.`,
      images: [imageUrl],
    },
  };
}

export default async function CardPage({ params }: PageProps) {
  const { username } = await params;
  const cleanUsername = decodeURIComponent(username).replace("@", "").trim();

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
          Creator Nexus
        </p>

        <h1 className="mt-4 text-4xl font-black">
          Carta {cleanUsername}
        </h1>

        <p className="mt-3 text-sm text-white/50">
          Esta carta pode ser compartilhada nas redes sociais.
        </p>
      </div>
    </main>
  );
}