import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AdminFloatingButton } from "@/components/admin/AdminFloatingButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.cardpoc.com"),

  title: {
    default:
      "Cardpoc | Colecione Criadores, Streamers, Cartas Digitais e Rankings",
    template: "%s | Cardpoc",
  },

  description:
    "Colecione criadores de conteúdo, streamers e influenciadores através de cartas digitais. Descubra rankings, estatísticas, drops ao vivo, packs colecionáveis e acompanhe Twitch, Kick e YouTube em um só lugar.",

  keywords: [
    "Cardpoc",
    "criadores de conteúdo",
    "criadores digitais",
    "influenciadores",
    "streamers",
    "ranking de streamers",
    "youtubers",
    "cartas digitais",
    "colecionáveis",
    "packs colecionáveis",
    "drops ao vivo",
    "ranking de criadores",
    "estatísticas de criadores",
    "creator economy",
    "gaming",
    "twitch",
    "twitch streamer",
    "youtube",
    "youtube creator",
    "kick",
    "kick streamer",
  ],

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.cardpoc.com",
    siteName: "Cardpoc",
    title:
      "Cardpoc | Colecione Criadores, Streamers, Cartas Digitais e Rankings",
    description:
      "Colecione criadores de conteúdo, streamers e influenciadores através de cartas digitais. Descubra rankings, estatísticas, drops ao vivo, packs colecionáveis e acompanhe Twitch, Kick e YouTube em um só lugar.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Cardpoc",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Cardpoc | Colecione Criadores, Streamers, Cartas Digitais e Rankings",
    description:
      "Colecione criadores de conteúdo, streamers e influenciadores através de cartas digitais, rankings, drops e packs colecionáveis.",
    images: ["/og-image.jpg"],
  },

  alternates: {
    canonical: "https://www.cardpoc.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <SiteHeader />
          {children}
          <AdminFloatingButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
