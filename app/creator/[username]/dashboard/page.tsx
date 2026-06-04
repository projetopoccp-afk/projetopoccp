import { CreatorProfilePage } from "@/components/creator/CreatorProfilePage";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{
    username: string;
  }>;
};

function formatCreatorName(username: string) {
  return decodeURIComponent(username).trim();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username: rawUsername } = await params;
  const username = formatCreatorName(rawUsername);

  return {
    title: `Editar ${username} | Cardpoc`,
    description: `Painel de edição do perfil de ${username} no Cardpoc.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CreatorDashboardPage({ params }: PageProps) {
  const { username: rawUsername } = await params;
  const username = formatCreatorName(rawUsername);

  return <CreatorProfilePage username={username} startInEditMode />;
}
