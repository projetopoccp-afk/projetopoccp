import HomePage from "@/app/page";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://projetopoccp.vercel.app";

  const profileUrl = `${siteUrl}/creator/${username}`;

  const ogImage = `${siteUrl}/api/og/card/${username}?v=3`;

  return {
    title: `${username} | Creator Nexus`,
    description: `Confira o perfil de ${username} no Creator Nexus.`,

    metadataBase: new URL(siteUrl),

    alternates: {
      canonical: profileUrl,
    },

    openGraph: {
      url: profileUrl,
      title: `${username} | Creator Nexus`,
      description: `Confira o perfil de ${username} no Creator Nexus.`,
      type: "profile",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${username} Creator Nexus Card`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: `${username} | Creator Nexus`,
      description: `Confira o perfil de ${username} no Creator Nexus.`,
      images: [ogImage],
    },
  };
}

export default function CreatorUsernamePage() {
  return <HomePage />;
}