"use client";

import { useRef } from "react";

type TiltCardProps = {
  children: React.ReactNode;
  className?: string;
};

export function TiltCard({ children, className = "" }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    const glowX = (x / rect.width) * 100;
    const glowY = (y / rect.height) * 100;

    card.style.setProperty("--glow-x", `${glowX}%`);
    card.style.setProperty("--glow-y", `${glowY}%`);

    card.style.transform = `
      perspective(1100px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.05)
    `;
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = `
      perspective(1100px)
      rotateX(0deg)
      rotateY(0deg)
      scale(1)
    `;

    card.style.setProperty("--glow-x", `50%`);
    card.style.setProperty("--glow-y", `50%`);
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-20 rounded-[28px] opacity-0 mix-blend-screen transition duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.55),transparent_28%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 rounded-[28px] opacity-0 mix-blend-color-dodge transition duration-500 group-hover:opacity-70">
        <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(125deg,rgba(34,211,238,0.20),rgba(168,85,247,0.22),rgba(236,72,153,0.20),rgba(34,211,238,0.16))]" />
      </div>

      {children}
    </div>
  );
}