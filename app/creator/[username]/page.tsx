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

  const ogImage = `${process.env.NEXT_PUBLIC_SITE_URL}/api/og/card/${username}`;

  return {
    title: `${username} | Creator Nexus`,
    description: `Confira o perfil de ${username} no Creator Nexus.`,
    openGraph: {
      title: `${username} | Creator Nexus`,
      description: `Confira o perfil de ${username} no Creator Nexus.`,
      images: [ogImage],
      type: "profile",
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