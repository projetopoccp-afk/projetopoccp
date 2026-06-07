"use client";

export type CreatorPopupImageEffectStyle =
  | "none"
  | "cyber"
  | "emerald"
  | "gold"
  | "silver"
  | "storm"
  | "runes"
  | "solar"
  | "prism"
  | "void"
  | "aurora"
  | "matrix";

export const CREATOR_POPUP_IMAGE_EFFECT_STYLES: Array<{
  value: CreatorPopupImageEffectStyle;
  labelKey: string;
  fallback: string;
  descriptionKey: string;
  descriptionFallback: string;
}> = [
  {
    value: "none",
    labelKey: "creatorPopupImageEffectNone",
    fallback: "Sem animação",
    descriptionKey: "creatorPopupImageEffectNoneDescription",
    descriptionFallback: "Imagem limpa, sem efeito extra.",
  },
  {
    value: "cyber",
    labelKey: "creatorPopupImageEffectCyber",
    fallback: "Cyber cyan",
    descriptionKey: "creatorPopupImageEffectCyberDescription",
    descriptionFallback: "Circuitos cyan, linhas digitais e pulsos tecnológicos.",
  },
  {
    value: "emerald",
    labelKey: "creatorPopupImageEffectEmerald",
    fallback: "Esmeralda arcano",
    descriptionKey: "creatorPopupImageEffectEmeraldDescription",
    descriptionFallback: "Runas esmeralda, névoa arcana e energia mística.",
  },
  {
    value: "gold",
    labelKey: "creatorPopupImageEffectGold",
    fallback: "Dourado celestial",
    descriptionKey: "creatorPopupImageEffectGoldDescription",
    descriptionFallback: "Poeira dourada, brilho nobre e aura celestial.",
  },
  {
    value: "silver",
    labelKey: "creatorPopupImageEffectSilver",
    fallback: "Prata clean",
    descriptionKey: "creatorPopupImageEffectSilverDescription",
    descriptionFallback: "Reflexos prateados discretos e acabamento limpo.",
  },
  {
    value: "storm",
    labelKey: "creatorPopupImageEffectStorm",
    fallback: "Tempestade elétrica",
    descriptionKey: "creatorPopupImageEffectStormDescription",
    descriptionFallback: "Raios sutis por toda a imagem e faíscas em movimento.",
  },
  {
    value: "runes",
    labelKey: "creatorPopupImageEffectRunes",
    fallback: "Runas vivas",
    descriptionKey: "creatorPopupImageEffectRunesDescription",
    descriptionFallback: "Símbolos arcanos flutuando lentamente pela imagem.",
  },
  {
    value: "solar",
    labelKey: "creatorPopupImageEffectSolar",
    fallback: "Rios de sol",
    descriptionKey: "creatorPopupImageEffectSolarDescription",
    descriptionFallback: "Fluxos solares dourados atravessando a imagem.",
  },
  {
    value: "prism",
    labelKey: "creatorPopupImageEffectPrism",
    fallback: "Prisma holográfico",
    descriptionKey: "creatorPopupImageEffectPrismDescription",
    descriptionFallback: "Divisões brilhantes, reflexos prismáticos e brilho premium.",
  },
  {
    value: "void",
    labelKey: "creatorPopupImageEffectVoid",
    fallback: "Vazio astral",
    descriptionKey: "creatorPopupImageEffectVoidDescription",
    descriptionFallback: "Partículas roxas, profundidade cósmica e energia sombria.",
  },
  {
    value: "aurora",
    labelKey: "creatorPopupImageEffectAurora",
    fallback: "Aurora viva",
    descriptionKey: "creatorPopupImageEffectAuroraDescription",
    descriptionFallback: "Ondas de aurora suaves preenchendo toda a imagem.",
  },
  {
    value: "matrix",
    labelKey: "creatorPopupImageEffectMatrix",
    fallback: "Chuva de dados",
    descriptionKey: "creatorPopupImageEffectMatrixDescription",
    descriptionFallback: "Dados digitais descendo sobre a imagem com brilho sutil.",
  },
];

type CreatorPopupImageEffectsProps = {
  style?: string | null;
};

const particleItems = Array.from({ length: 18 }, (_, index) => index);
const runeItems = ["✦", "◇", "✧", "△", "✹", "◆", "✶", "⬡"];
const dataColumns = Array.from({ length: 10 }, (_, index) => index);
const lightningItems = Array.from({ length: 7 }, (_, index) => index);

function normalizePopupImageEffectStyle(
  style?: string | null,
): CreatorPopupImageEffectStyle {
  const normalized = String(style || "none").toLowerCase();

  return CREATOR_POPUP_IMAGE_EFFECT_STYLES.some(
    (effectStyle) => effectStyle.value === normalized,
  )
    ? (normalized as CreatorPopupImageEffectStyle)
    : "none";
}

export function CreatorPopupImageEffects({
  style,
}: CreatorPopupImageEffectsProps) {
  const currentStyle = normalizePopupImageEffectStyle(style);

  if (currentStyle === "none") return null;

  return (
    <div
      className={`creator-popup-image-effects creator-popup-image-effects-${currentStyle}`}
      aria-hidden="true"
    >
      <div className="creator-popup-effect-wash" />
      <div className="creator-popup-effect-grid" />
      <div className="creator-popup-effect-ribbons" />
      <div className="creator-popup-effect-scan" />

      {currentStyle === "storm" || currentStyle === "cyber" ? (
        <div className="creator-popup-effect-lightnings">
          {lightningItems.map((item) => (
            <span key={`lightning-${item}`} />
          ))}
        </div>
      ) : null}

      {currentStyle === "emerald" || currentStyle === "runes" ? (
        <div className="creator-popup-effect-runes">
          {runeItems.map((rune, index) => (
            <span key={`${rune}-${index}`}>{rune}</span>
          ))}
        </div>
      ) : null}

      {currentStyle === "matrix" ? (
        <div className="creator-popup-effect-matrix">
          {dataColumns.map((column) => (
            <span key={`data-column-${column}`}>0101 1100 0110 1001</span>
          ))}
        </div>
      ) : null}

      <div className="creator-popup-effect-particles">
        {particleItems.map((item) => (
          <span key={`popup-particle-${item}`} />
        ))}
      </div>

      <style jsx>{`
        .creator-popup-image-effects {
          --popup-effect-primary: rgba(34, 211, 238, 0.55);
          --popup-effect-secondary: rgba(14, 165, 233, 0.34);
          --popup-effect-accent: rgba(255, 255, 255, 0.34);
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 2;
          overflow: hidden;
          mix-blend-mode: screen;
          opacity: 0.9;
          transform: translateZ(0);
        }

        .creator-popup-image-effects-emerald,
        .creator-popup-image-effects-runes {
          --popup-effect-primary: rgba(52, 211, 153, 0.58);
          --popup-effect-secondary: rgba(16, 185, 129, 0.34);
          --popup-effect-accent: rgba(187, 247, 208, 0.36);
        }

        .creator-popup-image-effects-gold,
        .creator-popup-image-effects-solar {
          --popup-effect-primary: rgba(253, 224, 71, 0.58);
          --popup-effect-secondary: rgba(245, 158, 11, 0.36);
          --popup-effect-accent: rgba(254, 243, 199, 0.44);
        }

        .creator-popup-image-effects-silver {
          --popup-effect-primary: rgba(226, 232, 240, 0.5);
          --popup-effect-secondary: rgba(148, 163, 184, 0.3);
          --popup-effect-accent: rgba(255, 255, 255, 0.34);
          opacity: 0.68;
        }

        .creator-popup-image-effects-storm {
          --popup-effect-primary: rgba(125, 211, 252, 0.64);
          --popup-effect-secondary: rgba(56, 189, 248, 0.38);
          --popup-effect-accent: rgba(224, 242, 254, 0.46);
        }

        .creator-popup-image-effects-prism {
          --popup-effect-primary: rgba(34, 211, 238, 0.44);
          --popup-effect-secondary: rgba(217, 70, 239, 0.34);
          --popup-effect-accent: rgba(253, 224, 71, 0.3);
        }

        .creator-popup-image-effects-void {
          --popup-effect-primary: rgba(168, 85, 247, 0.5);
          --popup-effect-secondary: rgba(59, 7, 100, 0.38);
          --popup-effect-accent: rgba(244, 114, 182, 0.34);
        }

        .creator-popup-image-effects-aurora {
          --popup-effect-primary: rgba(45, 212, 191, 0.48);
          --popup-effect-secondary: rgba(192, 132, 252, 0.34);
          --popup-effect-accent: rgba(134, 239, 172, 0.34);
        }

        .creator-popup-image-effects-matrix {
          --popup-effect-primary: rgba(74, 222, 128, 0.46);
          --popup-effect-secondary: rgba(22, 163, 74, 0.3);
          --popup-effect-accent: rgba(187, 247, 208, 0.32);
        }

        .creator-popup-effect-wash,
        .creator-popup-effect-grid,
        .creator-popup-effect-ribbons,
        .creator-popup-effect-scan,
        .creator-popup-effect-particles,
        .creator-popup-effect-lightnings,
        .creator-popup-effect-runes,
        .creator-popup-effect-matrix {
          position: absolute;
          inset: 0;
        }

        .creator-popup-effect-wash {
          background:
            radial-gradient(circle at 22% 18%, var(--popup-effect-primary), transparent 26%),
            radial-gradient(circle at 82% 24%, var(--popup-effect-secondary), transparent 30%),
            radial-gradient(circle at 52% 82%, var(--popup-effect-primary), transparent 34%);
          opacity: 0.36;
          animation: creatorPopupEffectBreath 6.8s ease-in-out infinite;
        }

        .creator-popup-image-effects-solar .creator-popup-effect-wash,
        .creator-popup-image-effects-gold .creator-popup-effect-wash {
          background:
            radial-gradient(circle at 28% 18%, rgba(254, 240, 138, 0.52), transparent 24%),
            radial-gradient(circle at 88% 8%, rgba(245, 158, 11, 0.45), transparent 30%),
            linear-gradient(120deg, transparent 18%, rgba(253, 224, 71, 0.2), transparent 54%);
        }

        .creator-popup-effect-grid {
          background-image:
            linear-gradient(90deg, var(--popup-effect-primary) 1px, transparent 1px),
            linear-gradient(0deg, var(--popup-effect-secondary) 1px, transparent 1px);
          background-size: 54px 54px;
          opacity: 0.1;
          animation: creatorPopupGridDrift 11s linear infinite;
        }

        .creator-popup-image-effects-cyber .creator-popup-effect-grid,
        .creator-popup-image-effects-matrix .creator-popup-effect-grid {
          opacity: 0.18;
          background-size: 34px 34px;
        }

        .creator-popup-image-effects-silver .creator-popup-effect-grid,
        .creator-popup-image-effects-gold .creator-popup-effect-grid {
          opacity: 0.06;
        }

        .creator-popup-effect-ribbons {
          background:
            linear-gradient(112deg, transparent 4%, var(--popup-effect-primary) 14%, transparent 26%),
            linear-gradient(68deg, transparent 20%, var(--popup-effect-secondary) 36%, transparent 52%),
            linear-gradient(138deg, transparent 48%, var(--popup-effect-accent) 60%, transparent 74%);
          opacity: 0.18;
          transform: translateX(-18%);
          animation: creatorPopupRibbons 9s ease-in-out infinite;
        }

        .creator-popup-image-effects-prism .creator-popup-effect-ribbons {
          background:
            linear-gradient(114deg, transparent 3%, rgba(34, 211, 238, 0.22) 16%, transparent 29%),
            linear-gradient(72deg, transparent 18%, rgba(217, 70, 239, 0.2) 34%, transparent 50%),
            linear-gradient(136deg, transparent 46%, rgba(253, 224, 71, 0.18) 60%, transparent 74%);
          opacity: 0.34;
        }

        .creator-popup-image-effects-solar .creator-popup-effect-ribbons {
          background:
            linear-gradient(118deg, transparent 8%, rgba(253, 224, 71, 0.28) 18%, transparent 32%),
            linear-gradient(102deg, transparent 42%, rgba(245, 158, 11, 0.26) 56%, transparent 70%);
          opacity: 0.34;
          animation-duration: 7s;
        }

        .creator-popup-effect-scan {
          background: linear-gradient(
            180deg,
            transparent 0%,
            transparent 42%,
            var(--popup-effect-accent) 50%,
            transparent 58%,
            transparent 100%
          );
          opacity: 0.14;
          transform: translateY(-72%);
          animation: creatorPopupScan 7.5s ease-in-out infinite;
        }

        .creator-popup-image-effects-silver .creator-popup-effect-scan {
          opacity: 0.08;
        }

        .creator-popup-effect-particles span {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          background: var(--popup-effect-accent);
          box-shadow: 0 0 12px var(--popup-effect-primary);
          opacity: 0;
          animation: creatorPopupParticleFloat 6.4s ease-in-out infinite;
        }

        .creator-popup-effect-particles span:nth-child(1) { left: 7%; top: 14%; animation-delay: -0.4s; }
        .creator-popup-effect-particles span:nth-child(2) { left: 18%; top: 68%; animation-delay: -2.1s; }
        .creator-popup-effect-particles span:nth-child(3) { left: 31%; top: 28%; animation-delay: -1.3s; }
        .creator-popup-effect-particles span:nth-child(4) { left: 44%; top: 78%; animation-delay: -3.2s; }
        .creator-popup-effect-particles span:nth-child(5) { left: 56%; top: 18%; animation-delay: -1.8s; }
        .creator-popup-effect-particles span:nth-child(6) { left: 66%; top: 54%; animation-delay: -4.4s; }
        .creator-popup-effect-particles span:nth-child(7) { left: 78%; top: 34%; animation-delay: -2.7s; }
        .creator-popup-effect-particles span:nth-child(8) { left: 90%; top: 72%; animation-delay: -0.9s; }
        .creator-popup-effect-particles span:nth-child(9) { left: 12%; top: 44%; animation-delay: -5.1s; }
        .creator-popup-effect-particles span:nth-child(10) { left: 25%; top: 88%; animation-delay: -3.8s; }
        .creator-popup-effect-particles span:nth-child(11) { left: 39%; top: 8%; animation-delay: -2.4s; }
        .creator-popup-effect-particles span:nth-child(12) { left: 51%; top: 48%; animation-delay: -4.9s; }
        .creator-popup-effect-particles span:nth-child(13) { left: 62%; top: 86%; animation-delay: -1.6s; }
        .creator-popup-effect-particles span:nth-child(14) { left: 73%; top: 12%; animation-delay: -3.5s; }
        .creator-popup-effect-particles span:nth-child(15) { left: 84%; top: 48%; animation-delay: -5.6s; }
        .creator-popup-effect-particles span:nth-child(16) { left: 94%; top: 24%; animation-delay: -2.9s; }
        .creator-popup-effect-particles span:nth-child(17) { left: 4%; top: 82%; animation-delay: -4.1s; }
        .creator-popup-effect-particles span:nth-child(18) { left: 48%; top: 62%; animation-delay: -0.6s; }

        .creator-popup-effect-lightnings span {
          position: absolute;
          width: 2px;
          height: 112px;
          background: linear-gradient(180deg, transparent, var(--popup-effect-accent), var(--popup-effect-primary), transparent);
          clip-path: polygon(44% 0, 78% 18%, 55% 18%, 86% 45%, 62% 45%, 92% 100%, 32% 56%, 56% 56%, 18% 26%, 42% 26%);
          filter: drop-shadow(0 0 7px var(--popup-effect-primary));
          opacity: 0;
          animation: creatorPopupLightning 3.8s steps(1, end) infinite;
        }

        .creator-popup-effect-lightnings span:nth-child(1) { left: 12%; top: 8%; transform: rotate(10deg); animation-delay: -0.7s; }
        .creator-popup-effect-lightnings span:nth-child(2) { left: 32%; top: 36%; transform: rotate(-13deg) scale(0.82); animation-delay: -2.4s; }
        .creator-popup-effect-lightnings span:nth-child(3) { left: 52%; top: 10%; transform: rotate(16deg) scale(0.75); animation-delay: -1.2s; }
        .creator-popup-effect-lightnings span:nth-child(4) { left: 72%; top: 46%; transform: rotate(-8deg) scale(0.92); animation-delay: -3.1s; }
        .creator-popup-effect-lightnings span:nth-child(5) { left: 84%; top: 18%; transform: rotate(13deg) scale(0.72); animation-delay: -1.9s; }
        .creator-popup-effect-lightnings span:nth-child(6) { left: 20%; top: 70%; transform: rotate(-18deg) scale(0.64); animation-delay: -3.7s; }
        .creator-popup-effect-lightnings span:nth-child(7) { left: 62%; top: 72%; transform: rotate(12deg) scale(0.68); animation-delay: -2.8s; }

        .creator-popup-effect-runes span {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 42px;
          border: 1px solid var(--popup-effect-primary);
          border-radius: 999px;
          color: var(--popup-effect-accent);
          font-size: 18px;
          text-shadow: 0 0 14px var(--popup-effect-primary);
          opacity: 0.26;
          animation: creatorPopupRuneOrbit 9s ease-in-out infinite;
        }

        .creator-popup-effect-runes span:nth-child(1) { left: 9%; top: 20%; animation-delay: -0.4s; }
        .creator-popup-effect-runes span:nth-child(2) { left: 78%; top: 18%; animation-delay: -2.2s; }
        .creator-popup-effect-runes span:nth-child(3) { left: 24%; top: 62%; animation-delay: -1.1s; }
        .creator-popup-effect-runes span:nth-child(4) { left: 64%; top: 70%; animation-delay: -3.4s; }
        .creator-popup-effect-runes span:nth-child(5) { left: 47%; top: 36%; animation-delay: -4.5s; }
        .creator-popup-effect-runes span:nth-child(6) { left: 6%; top: 78%; animation-delay: -5.8s; }
        .creator-popup-effect-runes span:nth-child(7) { left: 86%; top: 56%; animation-delay: -6.7s; }
        .creator-popup-effect-runes span:nth-child(8) { left: 38%; top: 8%; animation-delay: -7.5s; }

        .creator-popup-effect-matrix {
          display: flex;
          justify-content: space-around;
          gap: 10px;
          opacity: 0.24;
          overflow: hidden;
        }

        .creator-popup-effect-matrix span {
          width: 14px;
          color: var(--popup-effect-primary);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 10px;
          line-height: 1.1;
          text-shadow: 0 0 12px var(--popup-effect-primary);
          writing-mode: vertical-rl;
          transform: translateY(-100%);
          animation: creatorPopupDataRain 7s linear infinite;
        }

        .creator-popup-effect-matrix span:nth-child(odd) { animation-duration: 8.4s; }
        .creator-popup-effect-matrix span:nth-child(3n) { animation-delay: -3.3s; }
        .creator-popup-effect-matrix span:nth-child(4n) { animation-delay: -5.1s; }

        @keyframes creatorPopupEffectBreath {
          0%, 100% { opacity: 0.22; transform: scale(1); }
          50% { opacity: 0.46; transform: scale(1.08); }
        }

        @keyframes creatorPopupGridDrift {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(54px, 54px, 0); }
        }

        @keyframes creatorPopupRibbons {
          0%, 100% { transform: translateX(-22%) skewX(-8deg); opacity: 0.12; }
          45% { transform: translateX(18%) skewX(-8deg); opacity: 0.28; }
          70% { transform: translateX(32%) skewX(-8deg); opacity: 0.18; }
        }

        @keyframes creatorPopupScan {
          0%, 100% { transform: translateY(-78%); opacity: 0; }
          18% { opacity: 0.16; }
          54% { opacity: 0.18; }
          78% { transform: translateY(78%); opacity: 0; }
        }

        @keyframes creatorPopupParticleFloat {
          0%, 100% { opacity: 0; transform: translate3d(0, 18px, 0) scale(0.65); }
          30% { opacity: 0.62; }
          70% { opacity: 0.34; transform: translate3d(16px, -28px, 0) scale(1.24); }
        }

        @keyframes creatorPopupLightning {
          0%, 17%, 21%, 100% { opacity: 0; }
          18% { opacity: 0.9; }
          19% { opacity: 0.18; }
          20% { opacity: 0.72; }
        }

        @keyframes creatorPopupRuneOrbit {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.86); opacity: 0.18; }
          42% { transform: translate3d(8px, -14px, 0) rotate(28deg) scale(1.06); opacity: 0.42; }
          72% { transform: translate3d(-6px, 10px, 0) rotate(54deg) scale(0.96); opacity: 0.26; }
        }

        @keyframes creatorPopupDataRain {
          0% { transform: translateY(-115%); opacity: 0; }
          10% { opacity: 0.9; }
          85% { opacity: 0.5; }
          100% { transform: translateY(115%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
