import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SiteHeader } from "@/components/layout/SiteHeader";

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
    default: "Cardpoc",
    template: "%s | Cardpoc",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

  description:
    "Descubra, acompanhe e colecione criadores de conteúdo através de cartas digitais, rankings, reputação, conquistas e métricas exclusivas.",

  keywords: [
    "Cardpoc",
    "criadores de conteúdo",
    "streamers",
    "youtubers",
    "cartas digitais",
    "colecionáveis",
    "ranking de criadores",
    "creator economy",
    "gaming",
    "twitch",
    "youtube",
    "kick",
  ],

  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://www.cardpoc.com",
    siteName: "Cardpoc",
    title: "Cardpoc",
    description:
      "Descubra, acompanhe e colecione criadores de conteúdo através de cartas digitais, rankings e reputação.",
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
    title: "Cardpoc",
    description:
      "Descubra, acompanhe e colecione criadores de conteúdo através de cartas digitais.",
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
        </LanguageProvider>
      </body>
    </html>
  );
}
