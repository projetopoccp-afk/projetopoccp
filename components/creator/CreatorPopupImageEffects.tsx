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

const sparkItems = Array.from({ length: 16 }, (_, index) => index);
const stormBolts = Array.from({ length: 9 }, (_, index) => index);
const runeItems = ["✦", "◇", "✧", "△", "✹", "◆", "✶", "⬡", "✺", "◈"];
const prismSlices = Array.from({ length: 7 }, (_, index) => index);
const matrixColumns = Array.from({ length: 14 }, (_, index) => index);
const starItems = Array.from({ length: 22 }, (_, index) => index);

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
      {currentStyle === "cyber" ? (
        <>
          <div className="creator-popup-cyber-grid" />
          <div className="creator-popup-cyber-scan" />
          <div className="creator-popup-cyber-nodes">
            {sparkItems.map((item) => (
              <span key={`cyber-node-${item}`} />
            ))}
          </div>
        </>
      ) : null}

      {currentStyle === "emerald" ? (
        <>
          <div className="creator-popup-emerald-mist" />
          <div className="creator-popup-emerald-crystals">
            {sparkItems.slice(0, 12).map((item) => (
              <span key={`emerald-crystal-${item}`} />
            ))}
          </div>
          <div className="creator-popup-emerald-pulses" />
        </>
      ) : null}

      {currentStyle === "gold" ? (
        <>
          <div className="creator-popup-gold-aura" />
          <div className="creator-popup-gold-dust">
            {starItems.map((item) => (
              <span key={`gold-dust-${item}`} />
            ))}
          </div>
          <div className="creator-popup-gold-shine" />
        </>
      ) : null}

      {currentStyle === "silver" ? (
        <>
          <div className="creator-popup-silver-sheen" />
          <div className="creator-popup-silver-grain" />
          <div className="creator-popup-silver-sparks">
            {sparkItems.slice(0, 8).map((item) => (
              <span key={`silver-spark-${item}`} />
            ))}
          </div>
        </>
      ) : null}

      {currentStyle === "storm" ? (
        <>
          <div className="creator-popup-storm-clouds" />
          <div className="creator-popup-storm-bolts">
            {stormBolts.map((item) => (
              <span key={`storm-bolt-${item}`} />
            ))}
          </div>
          <div className="creator-popup-storm-sparks">
            {sparkItems.map((item) => (
              <span key={`storm-spark-${item}`} />
            ))}
          </div>
        </>
      ) : null}

      {currentStyle === "runes" ? (
        <>
          <div className="creator-popup-runes-orbit">
            {runeItems.map((rune, index) => (
              <span key={`${rune}-${index}`}>{rune}</span>
            ))}
          </div>
          <div className="creator-popup-runes-rings" />
        </>
      ) : null}

      {currentStyle === "solar" ? (
        <>
          <div className="creator-popup-solar-rivers" />
          <div className="creator-popup-solar-flares">
            {starItems.slice(0, 14).map((item) => (
              <span key={`solar-flare-${item}`} />
            ))}
          </div>
          <div className="creator-popup-solar-core" />
        </>
      ) : null}

      {currentStyle === "prism" ? (
        <>
          <div className="creator-popup-prism-slices">
            {prismSlices.map((item) => (
              <span key={`prism-slice-${item}`} />
            ))}
          </div>
          <div className="creator-popup-prism-reflection" />
        </>
      ) : null}

      {currentStyle === "void" ? (
        <>
          <div className="creator-popup-void-depth" />
          <div className="creator-popup-void-stars">
            {starItems.map((item) => (
              <span key={`void-star-${item}`} />
            ))}
          </div>
          <div className="creator-popup-void-vortex" />
        </>
      ) : null}

      {currentStyle === "aurora" ? (
        <>
          <div className="creator-popup-aurora-waves" />
          <div className="creator-popup-aurora-lights" />
        </>
      ) : null}

      {currentStyle === "matrix" ? (
        <>
          <div className="creator-popup-matrix-rain">
            {matrixColumns.map((column) => (
              <span key={`matrix-column-${column}`}>0101 1100 0110 1001</span>
            ))}
          </div>
          <div className="creator-popup-matrix-scan" />
        </>
      ) : null}

      <style jsx>{`
        .creator-popup-image-effects {
          pointer-events: none;
          position: absolute;
          inset: 0;
          z-index: 2;
          overflow: hidden;
          transform: translateZ(0);
          mix-blend-mode: screen;
        }

        .creator-popup-image-effects > * {
          position: absolute;
          inset: 0;
        }

        .creator-popup-cyber-grid {
          background-image:
            linear-gradient(90deg, rgba(34, 211, 238, 0.28) 1px, transparent 1px),
            linear-gradient(0deg, rgba(14, 165, 233, 0.2) 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.34;
          animation: popupCyberGrid 7.5s linear infinite;
        }

        .creator-popup-cyber-scan {
          background:
            linear-gradient(180deg, transparent 0%, transparent 38%, rgba(103, 232, 249, 0.5) 50%, transparent 62%, transparent 100%),
            linear-gradient(90deg, transparent 0%, rgba(34, 211, 238, 0.18) 48%, transparent 100%);
          opacity: 0.32;
          animation: popupCyberScan 3.4s ease-in-out infinite;
        }

        .creator-popup-cyber-nodes span,
        .creator-popup-storm-sparks span,
        .creator-popup-silver-sparks span,
        .creator-popup-gold-dust span,
        .creator-popup-void-stars span,
        .creator-popup-solar-flares span {
          position: absolute;
          border-radius: 999px;
          opacity: 0;
        }

        .creator-popup-cyber-nodes span {
          width: 5px;
          height: 5px;
          background: rgba(125, 249, 255, 0.95);
          box-shadow: 0 0 14px rgba(34, 211, 238, 0.9);
          animation: popupCyberNode 4.4s ease-in-out infinite;
        }

        .creator-popup-cyber-nodes span:nth-child(1) { left: 8%; top: 16%; animation-delay: -0.3s; }
        .creator-popup-cyber-nodes span:nth-child(2) { left: 18%; top: 74%; animation-delay: -1.1s; }
        .creator-popup-cyber-nodes span:nth-child(3) { left: 31%; top: 26%; animation-delay: -2.1s; }
        .creator-popup-cyber-nodes span:nth-child(4) { left: 45%; top: 82%; animation-delay: -3.2s; }
        .creator-popup-cyber-nodes span:nth-child(5) { left: 58%; top: 18%; animation-delay: -0.9s; }
        .creator-popup-cyber-nodes span:nth-child(6) { left: 70%; top: 52%; animation-delay: -2.6s; }
        .creator-popup-cyber-nodes span:nth-child(7) { left: 84%; top: 32%; animation-delay: -3.8s; }
        .creator-popup-cyber-nodes span:nth-child(8) { left: 92%; top: 72%; animation-delay: -1.9s; }
        .creator-popup-cyber-nodes span:nth-child(9) { left: 14%; top: 45%; animation-delay: -3.4s; }
        .creator-popup-cyber-nodes span:nth-child(10) { left: 38%; top: 10%; animation-delay: -4.1s; }
        .creator-popup-cyber-nodes span:nth-child(11) { left: 52%; top: 58%; animation-delay: -1.6s; }
        .creator-popup-cyber-nodes span:nth-child(12) { left: 76%; top: 86%; animation-delay: -2.8s; }
        .creator-popup-cyber-nodes span:nth-child(13) { left: 5%; top: 88%; animation-delay: -3.7s; }
        .creator-popup-cyber-nodes span:nth-child(14) { left: 64%; top: 7%; animation-delay: -0.6s; }
        .creator-popup-cyber-nodes span:nth-child(15) { left: 87%; top: 12%; animation-delay: -4.7s; }
        .creator-popup-cyber-nodes span:nth-child(16) { left: 25%; top: 58%; animation-delay: -2.2s; }

        .creator-popup-emerald-mist {
          background:
            radial-gradient(circle at 24% 22%, rgba(52, 211, 153, 0.34), transparent 28%),
            radial-gradient(circle at 74% 70%, rgba(16, 185, 129, 0.3), transparent 34%),
            linear-gradient(115deg, transparent 12%, rgba(6, 95, 70, 0.22), transparent 62%);
          opacity: 0.78;
          animation: popupEmeraldMist 8s ease-in-out infinite;
        }

        .creator-popup-emerald-pulses {
          background:
            radial-gradient(circle at 50% 50%, transparent 0 22%, rgba(110, 231, 183, 0.18) 24%, transparent 30%),
            radial-gradient(circle at 28% 68%, transparent 0 14%, rgba(16, 185, 129, 0.2) 16%, transparent 24%);
          opacity: 0.55;
          animation: popupEmeraldPulse 5.8s ease-in-out infinite;
        }

        .creator-popup-emerald-crystals span {
          position: absolute;
          width: 9px;
          height: 9px;
          background: rgba(110, 231, 183, 0.82);
          clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
          box-shadow: 0 0 14px rgba(16, 185, 129, 0.8);
          opacity: 0;
          animation: popupCrystalFloat 7s ease-in-out infinite;
        }

        .creator-popup-emerald-crystals span:nth-child(1) { left: 10%; top: 16%; animation-delay: -0.8s; }
        .creator-popup-emerald-crystals span:nth-child(2) { left: 22%; top: 72%; animation-delay: -2.2s; }
        .creator-popup-emerald-crystals span:nth-child(3) { left: 34%; top: 34%; animation-delay: -4.1s; }
        .creator-popup-emerald-crystals span:nth-child(4) { left: 49%; top: 82%; animation-delay: -1.5s; }
        .creator-popup-emerald-crystals span:nth-child(5) { left: 60%; top: 18%; animation-delay: -3.1s; }
        .creator-popup-emerald-crystals span:nth-child(6) { left: 75%; top: 55%; animation-delay: -5.2s; }
        .creator-popup-emerald-crystals span:nth-child(7) { left: 88%; top: 28%; animation-delay: -2.9s; }
        .creator-popup-emerald-crystals span:nth-child(8) { left: 12%; top: 88%; animation-delay: -4.8s; }
        .creator-popup-emerald-crystals span:nth-child(9) { left: 42%; top: 12%; animation-delay: -1.9s; }
        .creator-popup-emerald-crystals span:nth-child(10) { left: 82%; top: 82%; animation-delay: -0.4s; }
        .creator-popup-emerald-crystals span:nth-child(11) { left: 5%; top: 52%; animation-delay: -6.1s; }
        .creator-popup-emerald-crystals span:nth-child(12) { left: 67%; top: 40%; animation-delay: -3.8s; }

        .creator-popup-gold-aura {
          background:
            radial-gradient(circle at 50% 18%, rgba(254, 240, 138, 0.35), transparent 28%),
            radial-gradient(circle at 80% 56%, rgba(245, 158, 11, 0.3), transparent 36%),
            radial-gradient(circle at 28% 82%, rgba(217, 119, 6, 0.22), transparent 32%);
          opacity: 0.75;
          animation: popupGoldAura 7.4s ease-in-out infinite;
        }

        .creator-popup-gold-shine {
          background: linear-gradient(118deg, transparent 0 28%, rgba(254, 243, 199, 0.34) 42%, rgba(253, 224, 71, 0.16) 48%, transparent 64% 100%);
          opacity: 0.42;
          transform: translateX(-130%);
          animation: popupGoldShine 6.2s ease-in-out infinite;
        }

        .creator-popup-gold-dust span,
        .creator-popup-solar-flares span {
          width: 4px;
          height: 4px;
          background: rgba(254, 240, 138, 0.92);
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.86);
          animation: popupGoldDust 5.8s ease-in-out infinite;
        }

        .creator-popup-silver-sheen {
          background:
            linear-gradient(118deg, transparent 0 16%, rgba(255, 255, 255, 0.24) 30%, transparent 46%),
            linear-gradient(72deg, transparent 0 48%, rgba(148, 163, 184, 0.22) 62%, transparent 78%);
          opacity: 0.42;
          animation: popupSilverSheen 8s ease-in-out infinite;
        }

        .creator-popup-silver-grain {
          background-image:
            radial-gradient(circle, rgba(255, 255, 255, 0.28) 0 1px, transparent 1px),
            linear-gradient(90deg, rgba(226, 232, 240, 0.12), transparent 30%, rgba(148, 163, 184, 0.1));
          background-size: 22px 22px, 100% 100%;
          opacity: 0.22;
        }

        .creator-popup-silver-sparks span {
          width: 3px;
          height: 3px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow: 0 0 10px rgba(226, 232, 240, 0.72);
          animation: popupSilverSpark 7s ease-in-out infinite;
        }

        .creator-popup-storm-clouds {
          background:
            radial-gradient(circle at 24% 24%, rgba(56, 189, 248, 0.2), transparent 30%),
            radial-gradient(circle at 80% 62%, rgba(14, 165, 233, 0.24), transparent 36%),
            linear-gradient(180deg, rgba(8, 47, 73, 0.22), transparent 42%, rgba(15, 23, 42, 0.24));
          opacity: 0.75;
          animation: popupStormClouds 6.6s ease-in-out infinite;
        }

        .creator-popup-storm-bolts span {
          position: absolute;
          width: 2px;
          height: 126px;
          background: linear-gradient(180deg, transparent, rgba(224, 242, 254, 0.95), rgba(56, 189, 248, 0.82), transparent);
          clip-path: polygon(45% 0, 78% 18%, 56% 18%, 88% 46%, 62% 46%, 96% 100%, 30% 55%, 55% 55%, 14% 25%, 42% 25%);
          filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.9));
          opacity: 0;
          animation: popupStormBolt 3.1s steps(1, end) infinite;
        }

        .creator-popup-storm-bolts span:nth-child(1) { left: 7%; top: 5%; transform: rotate(12deg); animation-delay: -0.2s; }
        .creator-popup-storm-bolts span:nth-child(2) { left: 21%; top: 44%; transform: rotate(-16deg) scale(0.8); animation-delay: -1.5s; }
        .creator-popup-storm-bolts span:nth-child(3) { left: 36%; top: 12%; transform: rotate(18deg) scale(0.72); animation-delay: -2.2s; }
        .creator-popup-storm-bolts span:nth-child(4) { left: 55%; top: 38%; transform: rotate(-9deg) scale(0.92); animation-delay: -0.9s; }
        .creator-popup-storm-bolts span:nth-child(5) { left: 74%; top: 8%; transform: rotate(14deg) scale(0.82); animation-delay: -2.7s; }
        .creator-popup-storm-bolts span:nth-child(6) { left: 86%; top: 50%; transform: rotate(-13deg) scale(0.74); animation-delay: -1.9s; }
        .creator-popup-storm-bolts span:nth-child(7) { left: 18%; top: 72%; transform: rotate(9deg) scale(0.64); animation-delay: -2.9s; }
        .creator-popup-storm-bolts span:nth-child(8) { left: 62%; top: 70%; transform: rotate(-18deg) scale(0.66); animation-delay: -1.1s; }
        .creator-popup-storm-bolts span:nth-child(9) { left: 92%; top: 20%; transform: rotate(20deg) scale(0.58); animation-delay: -3.4s; }

        .creator-popup-storm-sparks span {
          width: 4px;
          height: 4px;
          background: rgba(224, 242, 254, 0.9);
          box-shadow: 0 0 12px rgba(56, 189, 248, 0.88);
          animation: popupStormSpark 4.5s ease-in-out infinite;
        }

        .creator-popup-runes-rings {
          background:
            radial-gradient(circle at 50% 50%, transparent 0 26%, rgba(167, 139, 250, 0.22) 28%, transparent 31%),
            radial-gradient(circle at 50% 50%, transparent 0 43%, rgba(45, 212, 191, 0.12) 45%, transparent 48%);
          opacity: 0.7;
          animation: popupRunesRings 12s linear infinite;
        }

        .creator-popup-runes-orbit span {
          position: absolute;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border: 1px solid rgba(196, 181, 253, 0.58);
          border-radius: 999px;
          color: rgba(221, 214, 254, 0.9);
          font-size: 19px;
          text-shadow: 0 0 16px rgba(167, 139, 250, 0.9);
          opacity: 0.28;
          animation: popupRuneFloat 8.5s ease-in-out infinite;
        }

        .creator-popup-runes-orbit span:nth-child(1) { left: 8%; top: 16%; animation-delay: -0.3s; }
        .creator-popup-runes-orbit span:nth-child(2) { left: 80%; top: 18%; animation-delay: -1.6s; }
        .creator-popup-runes-orbit span:nth-child(3) { left: 22%; top: 62%; animation-delay: -2.3s; }
        .creator-popup-runes-orbit span:nth-child(4) { left: 66%; top: 72%; animation-delay: -3.4s; }
        .creator-popup-runes-orbit span:nth-child(5) { left: 46%; top: 34%; animation-delay: -4.2s; }
        .creator-popup-runes-orbit span:nth-child(6) { left: 5%; top: 80%; animation-delay: -5.1s; }
        .creator-popup-runes-orbit span:nth-child(7) { left: 88%; top: 54%; animation-delay: -6.3s; }
        .creator-popup-runes-orbit span:nth-child(8) { left: 38%; top: 8%; animation-delay: -7.1s; }
        .creator-popup-runes-orbit span:nth-child(9) { left: 58%; top: 12%; animation-delay: -1.1s; }
        .creator-popup-runes-orbit span:nth-child(10) { left: 32%; top: 84%; animation-delay: -3.8s; }

        .creator-popup-solar-rivers {
          background:
            linear-gradient(108deg, transparent 0 10%, rgba(254, 240, 138, 0.24) 18%, transparent 30%),
            linear-gradient(128deg, transparent 0 34%, rgba(245, 158, 11, 0.28) 44%, transparent 58%),
            linear-gradient(96deg, transparent 0 58%, rgba(254, 215, 170, 0.24) 70%, transparent 84%);
          opacity: 0.82;
          animation: popupSolarRivers 6.8s ease-in-out infinite;
        }

        .creator-popup-solar-core {
          background:
            radial-gradient(circle at 74% 20%, rgba(254, 240, 138, 0.38), transparent 24%),
            radial-gradient(circle at 28% 74%, rgba(217, 119, 6, 0.22), transparent 28%);
          opacity: 0.7;
          animation: popupSolarCore 5.6s ease-in-out infinite;
        }

        .creator-popup-prism-slices span {
          position: absolute;
          top: -12%;
          bottom: -12%;
          width: 16%;
          opacity: 0.28;
          transform: skewX(-12deg);
          animation: popupPrismSlice 8s ease-in-out infinite;
        }

        .creator-popup-prism-slices span:nth-child(1) { left: -8%; background: rgba(34, 211, 238, 0.26); animation-delay: -0.2s; }
        .creator-popup-prism-slices span:nth-child(2) { left: 10%; background: rgba(217, 70, 239, 0.24); animation-delay: -1.4s; }
        .creator-popup-prism-slices span:nth-child(3) { left: 28%; background: rgba(253, 224, 71, 0.2); animation-delay: -2.2s; }
        .creator-popup-prism-slices span:nth-child(4) { left: 46%; background: rgba(74, 222, 128, 0.2); animation-delay: -3.3s; }
        .creator-popup-prism-slices span:nth-child(5) { left: 64%; background: rgba(96, 165, 250, 0.24); animation-delay: -4.1s; }
        .creator-popup-prism-slices span:nth-child(6) { left: 82%; background: rgba(244, 114, 182, 0.22); animation-delay: -5.1s; }
        .creator-popup-prism-slices span:nth-child(7) { left: 100%; background: rgba(255, 255, 255, 0.18); animation-delay: -6.2s; }

        .creator-popup-prism-reflection {
          background: linear-gradient(118deg, transparent 0 36%, rgba(255, 255, 255, 0.32) 50%, transparent 64% 100%);
          opacity: 0.28;
          animation: popupPrismReflection 4.8s ease-in-out infinite;
        }

        .creator-popup-void-depth {
          background:
            radial-gradient(circle at 50% 48%, rgba(88, 28, 135, 0.38), transparent 36%),
            radial-gradient(circle at 72% 22%, rgba(244, 114, 182, 0.18), transparent 26%),
            linear-gradient(180deg, rgba(15, 23, 42, 0.35), transparent 48%, rgba(2, 6, 23, 0.38));
          opacity: 0.95;
          mix-blend-mode: multiply;
          animation: popupVoidDepth 8s ease-in-out infinite;
        }

        .creator-popup-void-vortex {
          background:
            conic-gradient(from 0deg at 52% 48%, transparent, rgba(168, 85, 247, 0.16), transparent, rgba(244, 114, 182, 0.12), transparent);
          opacity: 0.45;
          animation: popupVoidVortex 18s linear infinite;
        }

        .creator-popup-void-stars span {
          width: 3px;
          height: 3px;
          background: rgba(216, 180, 254, 0.82);
          box-shadow: 0 0 13px rgba(168, 85, 247, 0.82);
          animation: popupVoidStar 7s ease-in-out infinite;
        }

        .creator-popup-aurora-waves {
          background:
            linear-gradient(112deg, transparent 0 6%, rgba(45, 212, 191, 0.24) 20%, transparent 42%),
            linear-gradient(78deg, transparent 0 22%, rgba(192, 132, 252, 0.22) 44%, transparent 66%),
            linear-gradient(132deg, transparent 0 40%, rgba(134, 239, 172, 0.18) 58%, transparent 80%);
          filter: blur(1px);
          opacity: 0.72;
          animation: popupAuroraWaves 8.5s ease-in-out infinite;
        }

        .creator-popup-aurora-lights {
          background:
            radial-gradient(circle at 20% 12%, rgba(45, 212, 191, 0.28), transparent 24%),
            radial-gradient(circle at 76% 36%, rgba(192, 132, 252, 0.25), transparent 28%),
            radial-gradient(circle at 46% 84%, rgba(134, 239, 172, 0.18), transparent 32%);
          opacity: 0.72;
          animation: popupAuroraLights 7.2s ease-in-out infinite;
        }

        .creator-popup-matrix-rain {
          display: flex;
          justify-content: space-around;
          gap: 8px;
          overflow: hidden;
          opacity: 0.42;
        }

        .creator-popup-matrix-rain span {
          width: 14px;
          color: rgba(74, 222, 128, 0.86);
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 10px;
          line-height: 1.1;
          text-shadow: 0 0 12px rgba(74, 222, 128, 0.8);
          writing-mode: vertical-rl;
          transform: translateY(-115%);
          animation: popupMatrixRain 7s linear infinite;
        }

        .creator-popup-matrix-rain span:nth-child(odd) { animation-duration: 8.8s; }
        .creator-popup-matrix-rain span:nth-child(3n) { animation-delay: -3.2s; }
        .creator-popup-matrix-rain span:nth-child(4n) { animation-delay: -5.3s; }

        .creator-popup-matrix-scan {
          background-image:
            linear-gradient(180deg, transparent 0 46%, rgba(187, 247, 208, 0.28) 50%, transparent 54%),
            linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.12), transparent);
          opacity: 0.45;
          animation: popupMatrixScan 3.8s ease-in-out infinite;
        }

        .creator-popup-gold-dust span:nth-child(1),
        .creator-popup-solar-flares span:nth-child(1),
        .creator-popup-void-stars span:nth-child(1),
        .creator-popup-storm-sparks span:nth-child(1),
        .creator-popup-silver-sparks span:nth-child(1) { left: 7%; top: 14%; animation-delay: -0.4s; }
        .creator-popup-gold-dust span:nth-child(2),
        .creator-popup-solar-flares span:nth-child(2),
        .creator-popup-void-stars span:nth-child(2),
        .creator-popup-storm-sparks span:nth-child(2),
        .creator-popup-silver-sparks span:nth-child(2) { left: 18%; top: 68%; animation-delay: -2.1s; }
        .creator-popup-gold-dust span:nth-child(3),
        .creator-popup-solar-flares span:nth-child(3),
        .creator-popup-void-stars span:nth-child(3),
        .creator-popup-storm-sparks span:nth-child(3),
        .creator-popup-silver-sparks span:nth-child(3) { left: 31%; top: 28%; animation-delay: -1.3s; }
        .creator-popup-gold-dust span:nth-child(4),
        .creator-popup-solar-flares span:nth-child(4),
        .creator-popup-void-stars span:nth-child(4),
        .creator-popup-storm-sparks span:nth-child(4),
        .creator-popup-silver-sparks span:nth-child(4) { left: 44%; top: 78%; animation-delay: -3.2s; }
        .creator-popup-gold-dust span:nth-child(5),
        .creator-popup-solar-flares span:nth-child(5),
        .creator-popup-void-stars span:nth-child(5),
        .creator-popup-storm-sparks span:nth-child(5),
        .creator-popup-silver-sparks span:nth-child(5) { left: 56%; top: 18%; animation-delay: -1.8s; }
        .creator-popup-gold-dust span:nth-child(6),
        .creator-popup-solar-flares span:nth-child(6),
        .creator-popup-void-stars span:nth-child(6),
        .creator-popup-storm-sparks span:nth-child(6),
        .creator-popup-silver-sparks span:nth-child(6) { left: 66%; top: 54%; animation-delay: -4.4s; }
        .creator-popup-gold-dust span:nth-child(7),
        .creator-popup-solar-flares span:nth-child(7),
        .creator-popup-void-stars span:nth-child(7),
        .creator-popup-storm-sparks span:nth-child(7),
        .creator-popup-silver-sparks span:nth-child(7) { left: 78%; top: 34%; animation-delay: -2.7s; }
        .creator-popup-gold-dust span:nth-child(8),
        .creator-popup-solar-flares span:nth-child(8),
        .creator-popup-void-stars span:nth-child(8),
        .creator-popup-storm-sparks span:nth-child(8),
        .creator-popup-silver-sparks span:nth-child(8) { left: 90%; top: 72%; animation-delay: -0.9s; }

        @keyframes popupCyberGrid {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(32px, 32px, 0); }
        }

        @keyframes popupCyberScan {
          0%, 100% { transform: translateY(-82%); opacity: 0; }
          18%, 56% { opacity: 0.36; }
          80% { transform: translateY(82%); opacity: 0; }
        }

        @keyframes popupCyberNode {
          0%, 100% { opacity: 0; transform: scale(0.7); }
          45% { opacity: 0.9; transform: scale(1.2); }
        }

        @keyframes popupEmeraldMist {
          0%, 100% { transform: translate3d(-2%, 0, 0) scale(1); opacity: 0.62; }
          50% { transform: translate3d(3%, -2%, 0) scale(1.06); opacity: 0.88; }
        }

        @keyframes popupEmeraldPulse {
          0%, 100% { transform: scale(0.94); opacity: 0.22; }
          50% { transform: scale(1.08); opacity: 0.58; }
        }

        @keyframes popupCrystalFloat {
          0%, 100% { opacity: 0; transform: translate3d(0, 18px, 0) rotate(0deg) scale(0.75); }
          34% { opacity: 0.75; }
          72% { opacity: 0.38; transform: translate3d(14px, -26px, 0) rotate(90deg) scale(1.1); }
        }

        @keyframes popupGoldAura {
          0%, 100% { transform: scale(1); opacity: 0.55; }
          50% { transform: scale(1.07); opacity: 0.84; }
        }

        @keyframes popupGoldShine {
          0%, 12% { transform: translateX(-130%) skewX(-9deg); opacity: 0; }
          38% { opacity: 0.5; }
          72%, 100% { transform: translateX(130%) skewX(-9deg); opacity: 0; }
        }

        @keyframes popupGoldDust {
          0%, 100% { opacity: 0; transform: translate3d(0, 20px, 0) scale(0.6); }
          35% { opacity: 0.92; }
          72% { opacity: 0.32; transform: translate3d(18px, -34px, 0) scale(1.18); }
        }

        @keyframes popupSilverSheen {
          0%, 100% { transform: translateX(-18%) skewX(-9deg); opacity: 0.18; }
          48% { transform: translateX(18%) skewX(-9deg); opacity: 0.48; }
        }

        @keyframes popupSilverSpark {
          0%, 100% { opacity: 0; transform: translate3d(0, 12px, 0) scale(0.55); }
          44% { opacity: 0.6; transform: translate3d(8px, -10px, 0) scale(1); }
        }

        @keyframes popupStormClouds {
          0%, 100% { transform: translateX(-2%) scale(1); opacity: 0.58; }
          50% { transform: translateX(3%) scale(1.05); opacity: 0.82; }
        }

        @keyframes popupStormBolt {
          0%, 12%, 16%, 48%, 100% { opacity: 0; }
          13% { opacity: 0.95; }
          14% { opacity: 0.22; }
          15% { opacity: 0.78; }
        }

        @keyframes popupStormSpark {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          40% { opacity: 0.9; transform: translate3d(12px, -18px, 0) scale(1.2); }
        }

        @keyframes popupRunesRings {
          0% { transform: rotate(0deg) scale(0.98); }
          100% { transform: rotate(360deg) scale(0.98); }
        }

        @keyframes popupRuneFloat {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg) scale(0.88); opacity: 0.18; }
          45% { transform: translate3d(10px, -15px, 0) rotate(34deg) scale(1.08); opacity: 0.42; }
          76% { transform: translate3d(-8px, 12px, 0) rotate(58deg) scale(0.96); opacity: 0.28; }
        }

        @keyframes popupSolarRivers {
          0%, 100% { transform: translateX(-16%) skewX(-7deg); opacity: 0.58; }
          52% { transform: translateX(20%) skewX(-7deg); opacity: 0.9; }
        }

        @keyframes popupSolarCore {
          0%, 100% { transform: scale(1); opacity: 0.46; }
          50% { transform: scale(1.1); opacity: 0.82; }
        }

        @keyframes popupPrismSlice {
          0%, 100% { transform: translateX(-24px) skewX(-12deg); opacity: 0.12; }
          45% { transform: translateX(22px) skewX(-12deg); opacity: 0.34; }
        }

        @keyframes popupPrismReflection {
          0%, 100% { transform: translateX(-120%) skewX(-12deg); opacity: 0; }
          42% { opacity: 0.44; }
          72% { transform: translateX(120%) skewX(-12deg); opacity: 0; }
        }

        @keyframes popupVoidDepth {
          0%, 100% { opacity: 0.66; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.06); }
        }

        @keyframes popupVoidVortex {
          0% { transform: rotate(0deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1.1); }
        }

        @keyframes popupVoidStar {
          0%, 100% { opacity: 0; transform: scale(0.6); }
          42% { opacity: 0.78; transform: translate3d(8px, -20px, 0) scale(1.18); }
        }

        @keyframes popupAuroraWaves {
          0%, 100% { transform: translateX(-18%) skewX(-10deg); opacity: 0.42; }
          50% { transform: translateX(20%) skewX(-10deg); opacity: 0.84; }
        }

        @keyframes popupAuroraLights {
          0%, 100% { transform: scale(1); opacity: 0.44; }
          50% { transform: scale(1.08); opacity: 0.76; }
        }

        @keyframes popupMatrixRain {
          0% { transform: translateY(-115%); opacity: 0; }
          10% { opacity: 0.95; }
          84% { opacity: 0.62; }
          100% { transform: translateY(115%); opacity: 0; }
        }

        @keyframes popupMatrixScan {
          0%, 100% { transform: translateY(-84%); opacity: 0; }
          22%, 58% { opacity: 0.44; }
          82% { transform: translateY(84%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
