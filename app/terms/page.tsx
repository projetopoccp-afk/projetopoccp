import { GlowBackground } from "@/components/effects/GlowBackground";
import { ParticleBackground } from "@/components/effects/ParticleBackground";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Cardpoc.",
};

export default function TermsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black px-6 py-16 text-white">
      <GlowBackground />
      <ParticleBackground />

      <section className="relative z-10 mx-auto max-w-4xl rounded-[32px] border border-cyan-300/15 bg-[#050812]/90 p-6 shadow-[0_0_60px_rgba(34,211,238,0.12)] backdrop-blur-xl sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-200">
          Cardpoc
        </p>

        <h1 className="mt-4 bg-gradient-to-r from-white via-cyan-100 to-purple-200 bg-clip-text text-3xl font-black uppercase tracking-[0.12em] text-transparent sm:text-4xl">
          Terms of Service
        </h1>

        <p className="mt-4 text-sm leading-7 text-white/60">
          Last updated: June 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-7 text-white/65">
          <p>
            These Terms of Service govern the use of Cardpoc, a digital
            reputation and collectible profile platform for content creators.
            By using Cardpoc, you agree to these terms.
          </p>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Platform purpose
            </h2>
            <p className="mt-2">
              Cardpoc allows users to discover creators, view public creator
              profiles, collect digital cards, open packs, follow creator
              activity and interact with gamified reputation features.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Creator profiles
            </h2>
            <p className="mt-2">
              Creator profiles may be created, edited, approved, rejected,
              claimed or removed according to Cardpoc moderation rules. A
              creator may request ownership of an unclaimed profile through the
              available claim process.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              User accounts
            </h2>
            <p className="mt-2">
              Users are responsible for keeping their accounts secure and for
              using the platform in a lawful and respectful way. Cardpoc may
              restrict access if an account is used to abuse, exploit or harm
              the platform or other users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Digital cards and rewards
            </h2>
            <p className="mt-2">
              Digital cards, packs, XP, levels, achievements and other gamified
              features are part of the Cardpoc experience. They do not represent
              financial assets, investment products or guaranteed monetary
              value.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Third-party platforms
            </h2>
            <p className="mt-2">
              Cardpoc may display links, statistics or information from external
              platforms such as TikTok, Instagram, Twitch, YouTube, Kick and
              Discord. These services are governed by their own terms and
              policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Changes to these terms
            </h2>
            <p className="mt-2">
              Cardpoc may update these Terms of Service as the platform evolves.
              Continued use of the platform after changes means you accept the
              updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-black uppercase tracking-[0.12em] text-white">
              Contact
            </h2>
            <p className="mt-2">
              For questions about these terms, contact Cardpoc through the
              official website at www.cardpoc.com.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}