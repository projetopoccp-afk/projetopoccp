import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Cardpoc.",
};

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 py-16 text-white">
      <GlowBackground />
      <ParticleBackground />

      <section className="relative z-10 mx-auto max-w-4xl rounded-[32px] border border-cyan-300/15 bg-[#050812]/90 p-6 shadow-[0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
          Cardpoc
        </p>

        <h1 className="mt-4 bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-3xl font-black uppercase tracking-[0.12em] text-transparent sm:text-4xl">
          Privacy Policy
        </h1>

        <p className="mt-4 text-sm leading-7 text-white/60">
          Last updated: June 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-white/65">
          <p>
            Cardpoc is a digital reputation and collectible profile platform for
            content creators. This Privacy Policy explains how we collect, use,
            store and protect information when users access our platform.
          </p>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Information we collect
            </h2>
            <p className="mt-2">
              We may collect account information such as name, email address,
              avatar, login provider, creator profile data, social links,
              collection activity, cards, packs, XP, levels, notifications and
              platform usage data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Connected services
            </h2>
            <p className="mt-2">
              Cardpoc may allow users and creators to connect third-party
              services such as Google, Discord, TikTok, Instagram, Twitch,
              YouTube and other platforms. When a service is connected, we only
              request the permissions needed to provide Cardpoc features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              How we use information
            </h2>
            <p className="mt-2">
              We use information to operate creator profiles, display public
              creator information, calculate platform statistics, manage digital
              cards, support profile claims, improve the platform and keep user
              accounts secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Public creator profiles
            </h2>
            <p className="mt-2">
              Creator profiles may display public information such as nickname,
              username, avatar, category, social links, public statistics and
              other profile details approved or provided through the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Data removal
            </h2>
            <p className="mt-2">
              Users and creators may request removal or correction of their data
              by contacting Cardpoc through the official support channels
              provided on the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Contact
            </h2>
            <p className="mt-2">
              For privacy questions, contact Cardpoc through the official
              website at www.cardpoc.com.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}