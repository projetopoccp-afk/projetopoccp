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
  | "matrix"
  | "inferno"
  | "frost"
  | "glitch"
  | "nebula"
  | "eclipse"
  | "bloom";

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
    descriptionFallback: "Energia esmeralda, cristais e névoa arcana.",
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
    descriptionFallback: "Raios fortes atravessando a imagem com faíscas cyan.",
  },
  {
    value: "runes",
    labelKey: "creatorPopupImageEffectRunes",
    fallback: "Runas vivas",
    descriptionKey: "creatorPopupImageEffectRunesDescription",
    descriptionFallback: "Símbolos arcanos flutuando e girando pela imagem.",
  },
  {
    value: "solar",
    labelKey: "creatorPopupImageEffectSolar",
    fallback: "Rios de sol",
    descriptionKey: "creatorPopupImageEffectSolarDescription",
    descriptionFallback: "Fluxos solares largos atravessando a imagem.",
  },
  {
    value: "prism",
    labelKey: "creatorPopupImageEffectPrism",
    fallback: "Prisma holográfico",
    descriptionKey: "creatorPopupImageEffectPrismDescription",
    descriptionFallback: "Divisões brilhantes, cortes prismáticos e brilho premium.",
  },
  {
    value: "void",
    labelKey: "creatorPopupImageEffectVoid",
    fallback: "Vazio astral",
    descriptionKey: "creatorPopupImageEffectVoidDescription",
    descriptionFallback: "Distorções roxas, profundidade cósmica e energia sombria.",
  },
  {
    value: "aurora",
    labelKey: "creatorPopupImageEffectAurora",
    fallback: "Aurora viva",
    descriptionKey: "creatorPopupImageEffectAuroraDescription",
    descriptionFallback: "Ondas de aurora coloridas preenchendo a imagem.",
  },
  {
    value: "matrix",
    labelKey: "creatorPopupImageEffectMatrix",
    fallback: "Chuva de dados",
    descriptionKey: "creatorPopupImageEffectMatrixDescription",
    descriptionFallback: "Dados digitais descendo pela imagem com brilho verde.",
  },
  {
    value: "inferno",
    labelKey: "creatorPopupImageEffectInferno",
    fallback: "Inferno rubi",
    descriptionKey: "creatorPopupImageEffectInfernoDescription",
    descriptionFallback: "Chamas rubi, brasas e ondas de calor.",
  },
  {
    value: "frost",
    labelKey: "creatorPopupImageEffectFrost",
    fallback: "Geada ártica",
    descriptionKey: "creatorPopupImageEffectFrostDescription",
    descriptionFallback: "Cristais de gelo, neve luminosa e névoa fria.",
  },
  {
    value: "glitch",
    labelKey: "creatorPopupImageEffectGlitch",
    fallback: "Glitch dimensional",
    descriptionKey: "creatorPopupImageEffectGlitchDescription",
    descriptionFallback: "Falhas digitais, cortes RGB e deslocamentos rápidos.",
  },
  {
    value: "nebula",
    labelKey: "creatorPopupImageEffectNebula",
    fallback: "Nebulosa cósmica",
    descriptionKey: "creatorPopupImageEffectNebulaDescription",
    descriptionFallback: "Nuvens cósmicas, estrelas e poeira espacial.",
  },
  {
    value: "eclipse",
    labelKey: "creatorPopupImageEffectEclipse",
    fallback: "Eclipse sombrio",
    descriptionKey: "creatorPopupImageEffectEclipseDescription",
    descriptionFallback: "Anéis de eclipse, sombra orbital e brilho frio.",
  },
  {
    value: "bloom",
    labelKey: "creatorPopupImageEffectBloom",
    fallback: "Florescer místico",
    descriptionKey: "creatorPopupImageEffectBloomDescription",
    descriptionFallback: "Pétalas de energia, pólen luminoso e aura viva.",
  },
];

type CreatorPopupImageEffectsProps = {
  style?: string | null;
};

const sparks = Array.from({ length: 26 }, (_, index) => index);
const stormBolts = Array.from({ length: 18 }, (_, index) => index);
const runes = ["✦", "◇", "✧", "△", "✹", "◆", "✶", "⬡", "✺", "✷", "◈", "⌬"];
const matrixColumns = Array.from({ length: 18 }, (_, index) => index);
const prismCuts = Array.from({ length: 9 }, (_, index) => index);
const crystals = Array.from({ length: 14 }, (_, index) => index);
const embers = Array.from({ length: 24 }, (_, index) => index);
const snow = Array.from({ length: 24 }, (_, index) => index);
const stars = Array.from({ length: 30 }, (_, index) => index);
const petals = Array.from({ length: 18 }, (_, index) => index);

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
      {currentStyle === "cyber" ? <CyberEffect /> : null}
      {currentStyle === "emerald" ? <EmeraldEffect /> : null}
      {currentStyle === "gold" ? <GoldEffect /> : null}
      {currentStyle === "silver" ? <SilverEffect /> : null}
      {currentStyle === "storm" ? <StormEffect /> : null}
      {currentStyle === "runes" ? <RunesEffect /> : null}
      {currentStyle === "solar" ? <SolarEffect /> : null}
      {currentStyle === "prism" ? <PrismEffect /> : null}
      {currentStyle === "void" ? <VoidEffect /> : null}
      {currentStyle === "aurora" ? <AuroraEffect /> : null}
      {currentStyle === "matrix" ? <MatrixEffect /> : null}
      {currentStyle === "inferno" ? <InfernoEffect /> : null}
      {currentStyle === "frost" ? <FrostEffect /> : null}
      {currentStyle === "glitch" ? <GlitchEffect /> : null}
      {currentStyle === "nebula" ? <NebulaEffect /> : null}
      {currentStyle === "eclipse" ? <EclipseEffect /> : null}
      {currentStyle === "bloom" ? <BloomEffect /> : null}

      <style jsx>{styles}</style>
    </div>
  );
}

function SparkLayer({ className = "" }: { className?: string }) {
  return (
    <div className={`creator-popup-sparks ${className}`}>
      {sparks.map((item) => (
        <span key={`spark-${item}`} />
      ))}
    </div>
  );
}

function CyberEffect() {
  return (
    <>
      <div className="cyber-grid" />
      <div className="cyber-circuits" />
      <div className="cyber-pulse cyber-pulse-a" />
      <div className="cyber-pulse cyber-pulse-b" />
      <div className="cyber-scan" />
      <SparkLayer className="cyber-sparks" />
    </>
  );
}

function EmeraldEffect() {
  return (
    <>
      <div className="emerald-mist" />
      <div className="emerald-crystal-field">
        {crystals.map((item) => (
          <span key={`emerald-crystal-${item}`} />
        ))}
      </div>
      <SparkLayer className="emerald-sparks" />
    </>
  );
}

function GoldEffect() {
  return (
    <>
      <div className="gold-halo" />
      <div className="gold-dust" />
      <div className="gold-shimmer" />
      <SparkLayer className="gold-sparks" />
    </>
  );
}

function SilverEffect() {
  return (
    <>
      <div className="silver-brush" />
      <div className="silver-sheen" />
      <div className="silver-dust" />
    </>
  );
}

function StormEffect() {
  return (
    <>
      <div className="storm-flash" />
      <div className="storm-bolts">
        {stormBolts.map((item) => (
          <span key={`storm-bolt-${item}`} />
        ))}
      </div>
      <div className="storm-clouds" />
      <SparkLayer className="storm-sparks" />
    </>
  );
}

function RunesEffect() {
  return (
    <>
      <div className="runes-aura" />
      <div className="runes-field">
        {runes.map((rune, index) => (
          <span key={`${rune}-${index}`}>{rune}</span>
        ))}
      </div>
      <div className="runes-ring" />
    </>
  );
}

function SolarEffect() {
  return (
    <>
      <div className="solar-rivers" />
      <div className="solar-core" />
      <div className="solar-flares" />
      <SparkLayer className="solar-sparks" />
    </>
  );
}

function PrismEffect() {
  return (
    <>
      <div className="prism-wash" />
      <div className="prism-cuts">
        {prismCuts.map((item) => (
          <span key={`prism-cut-${item}`} />
        ))}
      </div>
      <div className="prism-sweep" />
    </>
  );
}

function VoidEffect() {
  return (
    <>
      <div className="void-vignette" />
      <div className="void-rifts" />
      <div className="void-pulse" />
      <SparkLayer className="void-sparks" />
    </>
  );
}

function AuroraEffect() {
  return (
    <>
      <div className="aurora-waves" />
      <div className="aurora-curtain" />
      <SparkLayer className="aurora-sparks" />
    </>
  );
}

function MatrixEffect() {
  return (
    <>
      <div className="matrix-rain">
        {matrixColumns.map((column) => (
          <span key={`matrix-column-${column}`}>0101 1100 0110 1001</span>
        ))}
      </div>
      <div className="matrix-scan" />
    </>
  );
}

function InfernoEffect() {
  return (
    <>
      <div className="inferno-heat" />
      <div className="inferno-flames" />
      <div className="inferno-embers">
        {embers.map((item) => (
          <span key={`ember-${item}`} />
        ))}
      </div>
    </>
  );
}

function FrostEffect() {
  return (
    <>
      <div className="frost-fog" />
      <div className="frost-cracks" />
      <div className="frost-snow">
        {snow.map((item) => (
          <span key={`snow-${item}`} />
        ))}
      </div>
    </>
  );
}

function GlitchEffect() {
  return (
    <>
      <div className="glitch-slices" />
      <div className="glitch-rgb glitch-rgb-a" />
      <div className="glitch-rgb glitch-rgb-b" />
      <div className="glitch-noise" />
    </>
  );
}

function NebulaEffect() {
  return (
    <>
      <div className="nebula-clouds" />
      <div className="nebula-stars">
        {stars.map((item) => (
          <span key={`star-${item}`} />
        ))}
      </div>
      <div className="nebula-drift" />
    </>
  );
}

function EclipseEffect() {
  return (
    <>
      <div className="eclipse-ring" />
      <div className="eclipse-shadow" />
      <div className="eclipse-rays" />
    </>
  );
}

function BloomEffect() {
  return (
    <>
      <div className="bloom-aura" />
      <div className="bloom-petals">
        {petals.map((item) => (
          <span key={`petal-${item}`} />
        ))}
      </div>
      <SparkLayer className="bloom-sparks" />
    </>
  );
}

const styles = `
  .creator-popup-image-effects {
    pointer-events: none;
    position: absolute;
    inset: 0;
    z-index: 2;
    overflow: hidden;
    mix-blend-mode: screen;
    transform: translateZ(0);
    isolation: isolate;
  }

  .creator-popup-image-effects > :global(*) {
    position: absolute;
    inset: 0;
  }

  .creator-popup-sparks span,
  .emerald-crystal-field span,
  .storm-bolts span,
  .runes-field span,
  .prism-cuts span,
  .inferno-embers span,
  .frost-snow span,
  .nebula-stars span,
  .bloom-petals span {
    position: absolute;
    display: block;
  }

  /* CYBER */
  .cyber-grid {
    opacity: 0.28;
    background-image:
      linear-gradient(90deg, rgba(34, 211, 238, 0.45) 1px, transparent 1px),
      linear-gradient(0deg, rgba(59, 130, 246, 0.34) 1px, transparent 1px);
    background-size: 32px 32px;
    animation: popupCyberGrid 8s linear infinite;
  }

  .cyber-circuits {
    opacity: 0.48;
    background:
      linear-gradient(90deg, transparent 4%, rgba(103, 232, 249, 0.72) 5%, transparent 6%, transparent 38%, rgba(56, 189, 248, 0.58) 39%, transparent 40%),
      linear-gradient(0deg, transparent 12%, rgba(34, 211, 238, 0.5) 13%, transparent 14%, transparent 62%, rgba(125, 211, 252, 0.45) 63%, transparent 64%);
    background-size: 120px 90px;
    filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.7));
    animation: popupCyberCircuit 5.6s steps(2, end) infinite;
  }

  .cyber-pulse {
    width: 170px;
    height: 170px;
    border: 2px solid rgba(103, 232, 249, 0.5);
    border-radius: 999px;
    box-shadow: inset 0 0 28px rgba(34, 211, 238, 0.2), 0 0 26px rgba(34, 211, 238, 0.36);
    animation: popupCyberPulse 3.6s ease-out infinite;
  }

  .cyber-pulse-a { left: 12%; top: 18%; }
  .cyber-pulse-b { left: 56%; top: 58%; animation-delay: -1.8s; transform: scale(0.72); }

  .cyber-scan {
    opacity: 0.38;
    background: linear-gradient(180deg, transparent 0%, rgba(103, 232, 249, 0.8) 49%, rgba(255, 255, 255, 0.6) 50%, rgba(103, 232, 249, 0.8) 51%, transparent 100%);
    height: 22%;
    animation: popupVerticalScan 4.8s ease-in-out infinite;
  }

  .cyber-sparks span {
    width: 3px;
    height: 3px;
    border-radius: 999px;
    background: rgba(207, 250, 254, 0.9);
    box-shadow: 0 0 12px rgba(34, 211, 238, 0.95);
    animation: popupSparkFloat 4.5s ease-in-out infinite;
  }

  /* EMERALD */
  .emerald-mist {
    opacity: 0.7;
    background:
      radial-gradient(circle at 28% 24%, rgba(52, 211, 153, 0.42), transparent 30%),
      radial-gradient(circle at 70% 72%, rgba(16, 185, 129, 0.45), transparent 34%),
      linear-gradient(140deg, transparent 10%, rgba(5, 150, 105, 0.22), transparent 58%);
    animation: popupMistBreath 6.2s ease-in-out infinite;
  }

  .emerald-crystal-field span {
    width: 14px;
    height: 24px;
    background: linear-gradient(135deg, rgba(187, 247, 208, 0.9), rgba(16, 185, 129, 0.32));
    clip-path: polygon(50% 0, 100% 30%, 70% 100%, 30% 100%, 0 30%);
    box-shadow: 0 0 16px rgba(52, 211, 153, 0.8);
    opacity: 0.52;
    animation: popupCrystalRise 7s ease-in-out infinite;
  }

  .emerald-sparks span {
    width: 5px;
    height: 5px;
    border: 1px solid rgba(187, 247, 208, 0.8);
    transform: rotate(45deg);
    box-shadow: 0 0 14px rgba(52, 211, 153, 0.72);
    animation: popupSparkFloat 6s ease-in-out infinite;
  }

  /* GOLD */
  .gold-halo {
    opacity: 0.66;
    background:
      radial-gradient(circle at 50% 22%, rgba(254, 240, 138, 0.6), transparent 26%),
      radial-gradient(circle at 18% 78%, rgba(245, 158, 11, 0.34), transparent 32%),
      radial-gradient(circle at 84% 74%, rgba(253, 224, 71, 0.42), transparent 32%);
    animation: popupGoldHalo 5.2s ease-in-out infinite;
  }

  .gold-dust {
    opacity: 0.45;
    background-image:
      radial-gradient(circle, rgba(254, 243, 199, 0.9) 0 2px, transparent 2.5px),
      radial-gradient(circle, rgba(251, 191, 36, 0.84) 0 1.5px, transparent 2px);
    background-size: 44px 50px, 76px 82px;
    animation: popupGoldDust 9s linear infinite;
  }

  .gold-shimmer {
    opacity: 0.46;
    background: linear-gradient(112deg, transparent 14%, rgba(254, 240, 138, 0.55) 22%, rgba(245, 158, 11, 0.35) 28%, transparent 42%);
    transform: translateX(-80%);
    animation: popupShimmerSweep 5.4s ease-in-out infinite;
  }

  .gold-sparks span,
  .solar-sparks span {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: rgba(254, 243, 199, 0.95);
    box-shadow: 0 0 14px rgba(253, 224, 71, 0.9);
    animation: popupSparkFloat 5.8s ease-in-out infinite;
  }

  /* SILVER */
  .silver-brush {
    opacity: 0.35;
    background:
      repeating-linear-gradient(118deg, transparent 0 18px, rgba(226, 232, 240, 0.18) 19px 21px, transparent 22px 42px),
      radial-gradient(circle at 24% 20%, rgba(255, 255, 255, 0.24), transparent 26%);
    animation: popupSilverBrush 8s ease-in-out infinite;
  }

  .silver-sheen {
    opacity: 0.42;
    background: linear-gradient(118deg, transparent 30%, rgba(255, 255, 255, 0.55) 46%, rgba(148, 163, 184, 0.24) 52%, transparent 66%);
    transform: translateX(-110%);
    animation: popupShimmerSweep 7s ease-in-out infinite;
  }

  .silver-dust {
    opacity: 0.18;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.9) 0 1.2px, transparent 1.8px);
    background-size: 36px 42px;
    animation: popupGoldDust 11s linear infinite;
  }

  /* STORM */
  .storm-flash {
    opacity: 0;
    background: radial-gradient(circle at 48% 32%, rgba(255,255,255,0.55), rgba(125,211,252,0.28) 24%, transparent 54%);
    animation: popupStormFlash 2.4s steps(1, end) infinite;
  }

  .storm-clouds {
    opacity: 0.42;
    background:
      radial-gradient(circle at 18% 20%, rgba(14, 165, 233, 0.32), transparent 28%),
      radial-gradient(circle at 82% 44%, rgba(59, 130, 246, 0.28), transparent 32%),
      radial-gradient(circle at 48% 82%, rgba(103, 232, 249, 0.24), transparent 34%);
    animation: popupMistBreath 4.8s ease-in-out infinite;
  }

  .storm-bolts span {
    width: 5px;
    height: 230px;
    background: linear-gradient(180deg, transparent, rgba(255,255,255,0.96) 22%, rgba(125,211,252,0.92) 48%, rgba(255,255,255,0.88) 72%, transparent);
    clip-path: polygon(48% 0, 84% 18%, 58% 18%, 96% 44%, 62% 44%, 88% 100%, 34% 58%, 54% 58%, 12% 28%, 42% 28%);
    filter: drop-shadow(0 0 9px rgba(255,255,255,0.86)) drop-shadow(0 0 20px rgba(56,189,248,0.95));
    opacity: 0;
    animation: popupStormBolt 2.2s steps(1, end) infinite;
  }

  .storm-sparks span {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: rgba(224, 242, 254, 0.95);
    box-shadow: 0 0 18px rgba(56, 189, 248, 1);
    animation: popupSparkJitter 2.4s steps(2, end) infinite;
  }

  /* RUNES */
  .runes-aura {
    opacity: 0.52;
    background:
      radial-gradient(circle at 50% 50%, transparent 0 22%, rgba(52, 211, 153, 0.2) 24%, transparent 38%),
      radial-gradient(circle at 20% 22%, rgba(45, 212, 191, 0.28), transparent 28%),
      radial-gradient(circle at 76% 72%, rgba(34, 197, 94, 0.26), transparent 30%);
    animation: popupMistBreath 6s ease-in-out infinite;
  }

  .runes-field span {
    width: 48px;
    height: 48px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(134, 239, 172, 0.72);
    border-radius: 999px;
    color: rgba(220, 252, 231, 0.92);
    font-size: 20px;
    text-shadow: 0 0 18px rgba(52, 211, 153, 0.98);
    box-shadow: inset 0 0 14px rgba(52, 211, 153, 0.18), 0 0 16px rgba(52, 211, 153, 0.45);
    opacity: 0.52;
    animation: popupRuneOrbit 8s ease-in-out infinite;
  }

  .runes-ring {
    opacity: 0.38;
    background: conic-gradient(from 0deg, transparent, rgba(52, 211, 153, 0.22), transparent, rgba(45, 212, 191, 0.18), transparent);
    mask-image: radial-gradient(circle, transparent 0 25%, black 27% 38%, transparent 40%);
    animation: popupRuneRing 9s linear infinite;
  }

  /* SOLAR */
  .solar-rivers {
    opacity: 0.66;
    background:
      linear-gradient(112deg, transparent 0 12%, rgba(254, 240, 138, 0.78) 20%, rgba(245, 158, 11, 0.46) 28%, transparent 42%),
      linear-gradient(74deg, transparent 22%, rgba(253, 224, 71, 0.5) 34%, transparent 50%),
      linear-gradient(138deg, transparent 42%, rgba(251, 191, 36, 0.42) 58%, transparent 72%);
    transform: translateX(-35%) skewX(-8deg);
    animation: popupSolarRiver 5.8s ease-in-out infinite;
  }

  .solar-core {
    opacity: 0.56;
    background: radial-gradient(circle at 64% 22%, rgba(255,255,255,0.72), rgba(254,240,138,0.46) 14%, rgba(245,158,11,0.22) 34%, transparent 60%);
    animation: popupGoldHalo 4.2s ease-in-out infinite;
  }

  .solar-flares {
    opacity: 0.5;
    background: conic-gradient(from 35deg at 66% 24%, transparent, rgba(254,240,138,0.42), transparent 18%, rgba(245,158,11,0.3), transparent 34%);
    animation: popupSolarFlares 7s linear infinite;
  }

  /* PRISM */
  .prism-wash {
    opacity: 0.46;
    background: linear-gradient(130deg, rgba(34,211,238,0.18), rgba(217,70,239,0.22), rgba(253,224,71,0.16), rgba(74,222,128,0.14));
    animation: popupPrismHue 6s ease-in-out infinite;
  }

  .prism-cuts span {
    width: 38%;
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.86), rgba(34,211,238,0.58), rgba(217,70,239,0.48), transparent);
    box-shadow: 0 0 18px rgba(255,255,255,0.44);
    opacity: 0.56;
    transform: rotate(-18deg);
    animation: popupPrismCut 4.2s ease-in-out infinite;
  }

  .prism-sweep {
    opacity: 0.48;
    background: linear-gradient(112deg, transparent 12%, rgba(255,255,255,0.56) 22%, rgba(34,211,238,0.24) 30%, transparent 46%);
    transform: translateX(-110%);
    animation: popupShimmerSweep 4.8s ease-in-out infinite;
  }

  /* VOID */
  .void-vignette {
    opacity: 0.72;
    background:
      radial-gradient(circle at 50% 42%, transparent 0 22%, rgba(88,28,135,0.36) 44%, rgba(2,6,23,0.72) 78%),
      radial-gradient(circle at 18% 18%, rgba(168,85,247,0.38), transparent 28%),
      radial-gradient(circle at 82% 76%, rgba(244,114,182,0.2), transparent 34%);
    animation: popupVoidBreath 5.4s ease-in-out infinite;
  }

  .void-rifts {
    opacity: 0.5;
    background:
      linear-gradient(104deg, transparent 14%, rgba(168,85,247,0.6) 15%, transparent 17%),
      linear-gradient(72deg, transparent 54%, rgba(244,114,182,0.42) 55%, transparent 58%);
    filter: drop-shadow(0 0 12px rgba(168,85,247,0.7));
    animation: popupVoidRifts 3.8s steps(2, end) infinite;
  }

  .void-pulse {
    opacity: 0.34;
    background: conic-gradient(from 0deg, rgba(168,85,247,0.22), transparent, rgba(244,114,182,0.16), transparent, rgba(168,85,247,0.22));
    animation: popupRuneRing 11s linear infinite reverse;
  }

  .void-sparks span {
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: rgba(216, 180, 254, 0.86);
    box-shadow: 0 0 16px rgba(168,85,247,0.96);
    animation: popupSparkFloat 6.5s ease-in-out infinite;
  }

  /* AURORA */
  .aurora-waves {
    opacity: 0.62;
    background:
      linear-gradient(98deg, transparent 8%, rgba(45,212,191,0.42) 24%, transparent 42%),
      linear-gradient(122deg, transparent 24%, rgba(192,132,252,0.38) 42%, transparent 62%),
      linear-gradient(78deg, transparent 42%, rgba(134,239,172,0.32) 58%, transparent 78%);
    filter: blur(0.2px);
    animation: popupAuroraWave 8s ease-in-out infinite;
  }

  .aurora-curtain {
    opacity: 0.34;
    background: repeating-linear-gradient(90deg, rgba(45,212,191,0.22) 0 6px, transparent 7px 34px, rgba(192,132,252,0.18) 35px 42px, transparent 43px 72px);
    animation: popupAuroraCurtain 7.4s ease-in-out infinite;
  }

  .aurora-sparks span {
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: rgba(204,251,241,0.9);
    box-shadow: 0 0 16px rgba(45,212,191,0.85);
    animation: popupSparkFloat 6.8s ease-in-out infinite;
  }

  /* MATRIX */
  .matrix-rain {
    display: flex;
    justify-content: space-around;
    gap: 8px;
    opacity: 0.5;
    overflow: hidden;
    background: radial-gradient(circle at 50% 50%, rgba(34,197,94,0.18), transparent 64%);
  }

  .matrix-rain span {
    width: 14px;
    color: rgba(187, 247, 208, 0.94);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 10px;
    line-height: 1.1;
    text-shadow: 0 0 12px rgba(74,222,128,0.92);
    writing-mode: vertical-rl;
    transform: translateY(-120%);
    animation: popupMatrixRain 5.6s linear infinite;
  }

  .matrix-scan {
    opacity: 0.32;
    background: repeating-linear-gradient(180deg, transparent 0 9px, rgba(74,222,128,0.2) 10px 11px);
    animation: popupMatrixScan 3.4s linear infinite;
  }

  /* INFERNO */
  .inferno-heat {
    opacity: 0.64;
    background:
      radial-gradient(circle at 28% 78%, rgba(239,68,68,0.48), transparent 30%),
      radial-gradient(circle at 76% 22%, rgba(251,146,60,0.42), transparent 32%),
      linear-gradient(0deg, rgba(127,29,29,0.34), transparent 68%);
    animation: popupInfernoHeat 3.8s ease-in-out infinite;
  }

  .inferno-flames {
    opacity: 0.58;
    background:
      linear-gradient(18deg, transparent 40%, rgba(248,113,113,0.42) 54%, transparent 72%),
      linear-gradient(-20deg, transparent 34%, rgba(251,146,60,0.36) 48%, transparent 68%),
      repeating-radial-gradient(ellipse at 50% 100%, rgba(239,68,68,0.28) 0 5px, transparent 6px 24px);
    animation: popupInfernoFlames 3.6s ease-in-out infinite;
  }

  .inferno-embers span {
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: rgba(254,202,202,0.94);
    box-shadow: 0 0 16px rgba(239,68,68,0.95), 0 0 26px rgba(251,146,60,0.72);
    animation: popupEmberRise 4.6s ease-in-out infinite;
  }

  /* FROST */
  .frost-fog {
    opacity: 0.62;
    background:
      radial-gradient(circle at 28% 18%, rgba(224,242,254,0.42), transparent 32%),
      radial-gradient(circle at 76% 80%, rgba(125,211,252,0.32), transparent 34%),
      linear-gradient(180deg, rgba(240,249,255,0.16), transparent 68%);
    animation: popupFrostFog 6.2s ease-in-out infinite;
  }

  .frost-cracks {
    opacity: 0.44;
    background:
      linear-gradient(42deg, transparent 20%, rgba(224,242,254,0.55) 21%, transparent 22%),
      linear-gradient(-36deg, transparent 62%, rgba(186,230,253,0.48) 63%, transparent 64%),
      linear-gradient(84deg, transparent 40%, rgba(255,255,255,0.38) 41%, transparent 42%);
    filter: drop-shadow(0 0 9px rgba(186,230,253,0.7));
    animation: popupFrostCrack 5s ease-in-out infinite;
  }

  .frost-snow span {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: rgba(240,249,255,0.95);
    box-shadow: 0 0 12px rgba(186,230,253,0.9);
    animation: popupSnowFall 7s linear infinite;
  }

  /* GLITCH */
  .glitch-slices {
    opacity: 0.5;
    background:
      linear-gradient(90deg, transparent 0 12%, rgba(34,211,238,0.42) 13% 18%, transparent 19% 40%, rgba(244,114,182,0.38) 41% 47%, transparent 48%),
      repeating-linear-gradient(180deg, transparent 0 18px, rgba(255,255,255,0.18) 19px 21px, transparent 22px 48px);
    animation: popupGlitchSlices 2.2s steps(2, end) infinite;
  }

  .glitch-rgb {
    opacity: 0.38;
    background: linear-gradient(90deg, rgba(34,211,238,0.3), transparent 38%, rgba(244,114,182,0.26));
    mix-blend-mode: screen;
    animation: popupGlitchShift 1.8s steps(2, end) infinite;
  }

  .glitch-rgb-a { transform: translateX(-5px); }
  .glitch-rgb-b { transform: translateX(5px); animation-delay: -0.8s; }

  .glitch-noise {
    opacity: 0.22;
    background-image: radial-gradient(circle, rgba(255,255,255,0.75) 0 1px, transparent 1.4px);
    background-size: 9px 9px;
    animation: popupNoise 0.6s steps(2, end) infinite;
  }

  /* NEBULA */
  .nebula-clouds {
    opacity: 0.68;
    background:
      radial-gradient(circle at 22% 30%, rgba(217,70,239,0.42), transparent 34%),
      radial-gradient(circle at 78% 24%, rgba(59,130,246,0.36), transparent 36%),
      radial-gradient(circle at 52% 78%, rgba(124,58,237,0.42), transparent 38%),
      radial-gradient(circle at 48% 48%, rgba(255,255,255,0.12), transparent 64%);
    animation: popupNebulaClouds 8s ease-in-out infinite;
  }

  .nebula-stars span {
    width: 3px;
    height: 3px;
    border-radius: 999px;
    background: rgba(255,255,255,0.96);
    box-shadow: 0 0 14px rgba(196,181,253,0.82);
    animation: popupStarTwinkle 3.4s ease-in-out infinite;
  }

  .nebula-drift {
    opacity: 0.3;
    background: conic-gradient(from 80deg, transparent, rgba(217,70,239,0.22), transparent, rgba(59,130,246,0.2), transparent);
    animation: popupRuneRing 16s linear infinite;
  }

  /* ECLIPSE */
  .eclipse-ring {
    opacity: 0.74;
    background: radial-gradient(circle at 50% 38%, transparent 0 19%, rgba(226,232,240,0.72) 20%, rgba(96,165,250,0.32) 23%, transparent 28%);
    filter: drop-shadow(0 0 18px rgba(147,197,253,0.65));
    animation: popupEclipseRing 6.5s ease-in-out infinite;
  }

  .eclipse-shadow {
    opacity: 0.55;
    background: radial-gradient(circle at 50% 38%, rgba(2,6,23,0.74) 0 19%, transparent 30%), radial-gradient(circle at 50% 50%, transparent 0 42%, rgba(15,23,42,0.42) 74%);
    animation: popupVoidBreath 7s ease-in-out infinite;
  }

  .eclipse-rays {
    opacity: 0.28;
    background: conic-gradient(from 0deg at 50% 38%, rgba(226,232,240,0.4), transparent 8%, rgba(96,165,250,0.2), transparent 18%, rgba(226,232,240,0.3), transparent 28%);
    animation: popupRuneRing 12s linear infinite;
  }

  /* BLOOM */
  .bloom-aura {
    opacity: 0.62;
    background:
      radial-gradient(circle at 26% 72%, rgba(244,114,182,0.38), transparent 34%),
      radial-gradient(circle at 74% 26%, rgba(134,239,172,0.36), transparent 32%),
      radial-gradient(circle at 50% 50%, rgba(253,164,175,0.22), transparent 60%);
    animation: popupMistBreath 6s ease-in-out infinite;
  }

  .bloom-petals span {
    width: 14px;
    height: 24px;
    border-radius: 999px 999px 4px 4px;
    background: linear-gradient(180deg, rgba(255,228,230,0.9), rgba(244,114,182,0.36));
    box-shadow: 0 0 14px rgba(244,114,182,0.68);
    opacity: 0.58;
    animation: popupPetalFall 7.2s ease-in-out infinite;
  }

  .bloom-sparks span {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: rgba(255,228,230,0.9);
    box-shadow: 0 0 14px rgba(244,114,182,0.82);
    animation: popupSparkFloat 6.2s ease-in-out infinite;
  }

  /* POSITIONS */
  ${sparkPositions(".creator-popup-sparks span")}
  ${crystalPositions()}
  ${stormPositions()}
  ${runePositions()}
  ${matrixPositions()}
  ${prismPositions()}
  ${emberPositions()}
  ${snowPositions()}
  ${starPositions()}
  ${petalPositions()}

  @keyframes popupCyberGrid { 0% { transform: translate3d(0,0,0); } 100% { transform: translate3d(32px,32px,0); } }
  @keyframes popupCyberCircuit { 0%,100% { opacity: 0.32; } 45% { opacity: 0.72; } 48% { opacity: 0.22; } 52% { opacity: 0.8; } }
  @keyframes popupCyberPulse { 0% { opacity: 0; transform: scale(0.3); } 18% { opacity: 0.74; } 100% { opacity: 0; transform: scale(1.9); } }
  @keyframes popupVerticalScan { 0%,100% { transform: translateY(-85%); opacity: 0; } 20%,70% { opacity: 0.48; } 84% { transform: translateY(395%); opacity: 0; } }
  @keyframes popupSparkFloat { 0%,100% { opacity: 0; transform: translate3d(0,18px,0) scale(0.72); } 30% { opacity: 0.88; } 74% { opacity: 0.36; transform: translate3d(18px,-32px,0) scale(1.25); } }
  @keyframes popupSparkJitter { 0%,100% { opacity: 0; transform: translate3d(0,0,0) scale(0.7); } 18% { opacity: 1; transform: translate3d(4px,-5px,0) scale(1.25); } 22% { opacity: 0.2; } 28% { opacity: 0.9; transform: translate3d(-6px,4px,0) scale(1); } }
  @keyframes popupMistBreath { 0%,100% { opacity: 0.45; transform: scale(1); } 50% { opacity: 0.82; transform: scale(1.08); } }
  @keyframes popupCrystalRise { 0%,100% { opacity: 0.18; transform: translate3d(0,22px,0) rotate(0deg) scale(0.75); } 42% { opacity: 0.74; transform: translate3d(8px,-22px,0) rotate(22deg) scale(1.1); } 74% { opacity: 0.4; transform: translate3d(-6px,-42px,0) rotate(-14deg) scale(0.92); } }
  @keyframes popupGoldHalo { 0%,100% { opacity: 0.46; transform: scale(1); } 50% { opacity: 0.78; transform: scale(1.1); } }
  @keyframes popupGoldDust { 0% { background-position: 0 0, 0 0; } 100% { background-position: 52px -90px, -76px -126px; } }
  @keyframes popupShimmerSweep { 0%,100% { transform: translateX(-120%) skewX(-10deg); opacity: 0; } 18% { opacity: 0.68; } 54% { opacity: 0.42; } 82% { transform: translateX(120%) skewX(-10deg); opacity: 0; } }
  @keyframes popupSilverBrush { 0%,100% { transform: translateX(-8%); opacity: 0.22; } 50% { transform: translateX(8%); opacity: 0.44; } }
  @keyframes popupStormFlash { 0%, 13%, 16%, 40%, 44%, 100% { opacity: 0; } 14% { opacity: 0.78; } 15% { opacity: 0.18; } 42% { opacity: 0.62; } }
  @keyframes popupStormBolt { 0%, 12%, 15%, 52%, 55%, 100% { opacity: 0; } 13% { opacity: 1; } 14% { opacity: 0.25; } 53% { opacity: 0.86; } 54% { opacity: 0.18; } }
  @keyframes popupRuneOrbit { 0%,100% { transform: translate3d(0,0,0) rotate(0deg) scale(0.86); opacity: 0.32; } 42% { transform: translate3d(10px,-18px,0) rotate(32deg) scale(1.08); opacity: 0.78; } 74% { transform: translate3d(-8px,12px,0) rotate(70deg) scale(0.95); opacity: 0.44; } }
  @keyframes popupRuneRing { 0% { transform: rotate(0deg) scale(1); } 100% { transform: rotate(360deg) scale(1); } }
  @keyframes popupSolarRiver { 0%,100% { transform: translateX(-45%) skewX(-8deg); opacity: 0.42; } 50% { transform: translateX(20%) skewX(-8deg); opacity: 0.86; } }
  @keyframes popupSolarFlares { 0% { transform: rotate(0deg) scale(1); } 100% { transform: rotate(360deg) scale(1.05); } }
  @keyframes popupPrismHue { 0%,100% { opacity: 0.32; filter: hue-rotate(0deg); } 50% { opacity: 0.56; filter: hue-rotate(70deg); } }
  @keyframes popupPrismCut { 0%,100% { opacity: 0.15; transform: translateX(-12%) rotate(-18deg); } 45% { opacity: 0.82; transform: translateX(16%) rotate(-18deg); } }
  @keyframes popupVoidBreath { 0%,100% { opacity: 0.42; transform: scale(1); } 50% { opacity: 0.78; transform: scale(1.12); } }
  @keyframes popupVoidRifts { 0%,100% { opacity: 0.28; transform: translateX(0); } 30% { opacity: 0.72; transform: translateX(7px); } 34% { opacity: 0.22; transform: translateX(-4px); } }
  @keyframes popupAuroraWave { 0%,100% { transform: translateX(-22%) skewX(-10deg); opacity: 0.42; } 50% { transform: translateX(18%) skewX(-10deg); opacity: 0.82; } }
  @keyframes popupAuroraCurtain { 0%,100% { transform: translateX(-10%); opacity: 0.22; } 50% { transform: translateX(12%); opacity: 0.48; } }
  @keyframes popupMatrixRain { 0% { transform: translateY(-120%); opacity: 0; } 10% { opacity: 1; } 82% { opacity: 0.72; } 100% { transform: translateY(120%); opacity: 0; } }
  @keyframes popupMatrixScan { 0% { transform: translateY(0); } 100% { transform: translateY(24px); } }
  @keyframes popupInfernoHeat { 0%,100% { transform: scale(1) translateY(0); opacity: 0.44; } 50% { transform: scale(1.08) translateY(-10px); opacity: 0.82; } }
  @keyframes popupInfernoFlames { 0%,100% { transform: translateY(10px) scaleY(0.96); opacity: 0.42; } 50% { transform: translateY(-16px) scaleY(1.08); opacity: 0.78; } }
  @keyframes popupEmberRise { 0% { opacity: 0; transform: translate3d(0,28px,0) scale(0.6); } 20% { opacity: 0.95; } 100% { opacity: 0; transform: translate3d(16px,-96px,0) scale(1.18); } }
  @keyframes popupFrostFog { 0%,100% { transform: translateX(-6%) scale(1); opacity: 0.42; } 50% { transform: translateX(6%) scale(1.08); opacity: 0.74; } }
  @keyframes popupFrostCrack { 0%,100% { opacity: 0.18; } 44% { opacity: 0.7; } 48% { opacity: 0.28; } 54% { opacity: 0.58; } }
  @keyframes popupSnowFall { 0% { opacity: 0; transform: translate3d(0,-20px,0) scale(0.65); } 20% { opacity: 0.9; } 100% { opacity: 0; transform: translate3d(14px,120px,0) scale(1); } }
  @keyframes popupGlitchSlices { 0%,100% { transform: translateX(0); opacity: 0.24; } 18% { transform: translateX(-8px); opacity: 0.78; } 20% { transform: translateX(8px); opacity: 0.28; } 46% { transform: translateX(5px); opacity: 0.64; } 48% { transform: translateX(-4px); opacity: 0.2; } }
  @keyframes popupGlitchShift { 0%,100% { transform: translateX(0); opacity: 0.15; } 28% { transform: translateX(-10px); opacity: 0.52; } 31% { transform: translateX(8px); opacity: 0.22; } }
  @keyframes popupNoise { 0% { transform: translate(0,0); opacity: 0.12; } 100% { transform: translate(9px,9px); opacity: 0.32; } }
  @keyframes popupNebulaClouds { 0%,100% { transform: scale(1) rotate(0deg); opacity: 0.5; } 50% { transform: scale(1.12) rotate(4deg); opacity: 0.82; } }
  @keyframes popupStarTwinkle { 0%,100% { opacity: 0.18; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1.18); } }
  @keyframes popupEclipseRing { 0%,100% { transform: scale(0.94); opacity: 0.58; } 50% { transform: scale(1.08); opacity: 0.9; } }
  @keyframes popupPetalFall { 0% { opacity: 0; transform: translate3d(0,-24px,0) rotate(0deg) scale(0.78); } 18% { opacity: 0.82; } 100% { opacity: 0; transform: translate3d(22px,118px,0) rotate(160deg) scale(1.05); } }
`;

function sparkPositions(selector: string) {
  const positions = [
    [7, 14, -0.4], [18, 68, -2.1], [31, 28, -1.3], [44, 78, -3.2],
    [56, 18, -1.8], [66, 54, -4.4], [78, 34, -2.7], [90, 72, -0.9],
    [12, 44, -5.1], [25, 88, -3.8], [39, 8, -2.4], [51, 48, -4.9],
    [62, 86, -1.6], [73, 12, -3.5], [84, 48, -5.6], [94, 24, -2.9],
    [4, 82, -4.1], [48, 62, -0.6], [16, 24, -6.3], [34, 72, -7.1],
    [58, 38, -6.8], [70, 82, -7.7], [86, 14, -6.5], [96, 58, -7.3],
    [28, 12, -8.1], [42, 92, -8.7],
  ];

  return positions
    .map(
      ([left, top, delay], index) =>
        `${selector}:nth-child(${index + 1}) { left: ${left}%; top: ${top}%; animation-delay: ${delay}s; }`,
    )
    .join("\n");
}

function crystalPositions() {
  const positions = [[12, 22, -0.3], [24, 72, -1.7], [42, 16, -2.8], [58, 64, -0.9], [76, 26, -3.4], [86, 78, -2.1], [8, 84, -4.8], [68, 8, -5.2], [34, 46, -3.9], [52, 84, -6.1], [92, 42, -5.6], [18, 38, -6.8], [46, 30, -7.4], [72, 58, -7.9]];
  return positions.map(([left, top, delay], index) => `.emerald-crystal-field span:nth-child(${index + 1}) { left: ${left}%; top: ${top}%; animation-delay: ${delay}s; }`).join("\n");
}

function stormPositions() {
  const positions = [[8, 2, 8, -0.2], [18, 34, -14, -1.1], [28, 8, 16, -1.8], [38, 50, -10, -0.8], [48, 18, 13, -2.4], [58, 44, -18, -1.6], [68, 6, 11, -2.9], [78, 38, -13, -0.5], [88, 14, 16, -3.2], [12, 66, -16, -2.2], [32, 70, 12, -3.7], [52, 72, -12, -3.1], [72, 70, 18, -4.1], [90, 58, -10, -4.7], [4, 42, 15, -5.1], [44, -2, -9, -5.6], [62, 20, 8, -6.2], [82, -4, -15, -6.6]];
  return positions.map(([left, top, rotate, delay], index) => `.storm-bolts span:nth-child(${index + 1}) { left: ${left}%; top: ${top}%; transform: rotate(${rotate}deg) scale(${index % 3 === 0 ? 1.1 : index % 3 === 1 ? 0.86 : 0.72}); animation-delay: ${delay}s; }`).join("\n");
}

function runePositions() {
  const positions = [[9, 20, -0.4], [78, 18, -2.2], [24, 62, -1.1], [64, 70, -3.4], [47, 36, -4.5], [6, 78, -5.8], [86, 56, -6.7], [38, 8, -7.5], [58, 14, -8.2], [18, 42, -8.9], [74, 38, -9.6], [42, 84, -10.3]];
  return positions.map(([left, top, delay], index) => `.runes-field span:nth-child(${index + 1}) { left: ${left}%; top: ${top}%; animation-delay: ${delay}s; transform: scale(${index % 2 === 0 ? 1 : 0.82}); }`).join("\n");
}

function matrixPositions() {
  return Array.from({ length: 18 }, (_, index) => `.matrix-rain span:nth-child(${index + 1}) { animation-delay: -${(index * 0.43).toFixed(2)}s; animation-duration: ${(4.8 + (index % 5) * 0.7).toFixed(1)}s; }`).join("\n");
}

function prismPositions() {
  const positions = [[8, 14, -0.2], [18, 42, -1.1], [28, 70, -2.1], [42, 24, -3.1], [54, 54, -0.9], [66, 82, -2.8], [74, 10, -3.8], [82, 36, -4.4], [10, 88, -5.2]];
  return positions.map(([left, top, delay], index) => `.prism-cuts span:nth-child(${index + 1}) { left: ${left}%; top: ${top}%; animation-delay: ${delay}s; width: ${index % 2 === 0 ? 44 : 28}%; }`).join("\n");
}

function emberPositions() {
  return sparkPositions(".inferno-embers span");
}

function snowPositions() {
  return sparkPositions(".frost-snow span");
}

function starPositions() {
  const positions = [[6, 12, -0.1], [14, 38, -1.2], [22, 8, -2.3], [28, 72, -0.8], [34, 28, -3.1], [42, 82, -1.7], [48, 16, -2.8], [54, 52, -3.7], [60, 10, -4.1], [68, 68, -1.4], [74, 24, -2.4], [82, 84, -3.4], [88, 44, -4.4], [94, 18, -5.1], [10, 82, -5.8], [18, 62, -6.2], [26, 48, -6.8], [36, 94, -7.1], [46, 36, -7.8], [58, 90, -8.2], [70, 46, -8.8], [78, 6, -9.1], [90, 70, -9.8], [96, 56, -10.2], [4, 54, -10.8], [32, 4, -11.1], [52, 72, -11.8], [64, 30, -12.2], [84, 58, -12.8], [72, 94, -13.1]];
  return positions.map(([left, top, delay], index) => `.nebula-stars span:nth-child(${index + 1}) { left: ${left}%; top: ${top}%; animation-delay: ${delay}s; }`).join("\n");
}

function petalPositions() {
  const positions = [[8, 0, -0.2], [16, 18, -1.2], [24, -4, -2.2], [32, 34, -3.2], [40, 8, -4.2], [48, 24, -5.2], [56, -8, -6.2], [64, 36, -7.2], [72, 12, -8.2], [80, -2, -9.2], [88, 28, -10.2], [96, 4, -11.2], [12, 46, -12.2], [28, 56, -13.2], [44, 44, -14.2], [60, 58, -15.2], [76, 48, -16.2], [92, 62, -17.2]];
  return positions.map(([left, top, delay], index) => `.bloom-petals span:nth-child(${index + 1}) { left: ${left}%; top: ${top}%; animation-delay: ${delay}s; transform: rotate(${index * 19}deg); }`).join("\n");
}
