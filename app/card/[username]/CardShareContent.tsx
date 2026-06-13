"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";

const BRAND_NAME = "Cardpoc";

export function CardShareContent({ username }: { username: string }) {
  const { t } = useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200">
          {BRAND_NAME}
        </p>

        <h1 className="mt-4 text-4xl font-black">
          {translate(t, "card", "Carta")} {username}
        </h1>

        <p className="mt-3 text-sm text-white/50">
          {translate(
            t,
            "cardShareDescription",
            "Esta carta pode ser compartilhada nas redes sociais.",
          )}
        </p>
      </div>
    </main>
  );
}
