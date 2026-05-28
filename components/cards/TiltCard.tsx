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

    const percentX = x / rect.width;
    const percentY = y / rect.height;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    card.style.setProperty("--glow-x", `${percentX * 100}%`);
    card.style.setProperty("--glow-y", `${percentY * 100}%`);
    card.style.setProperty("--move-x", `${(percentX - 0.5) * 8}px`);
    card.style.setProperty("--move-y", `${(percentY - 0.5) * 8}px`);

    card.style.transform = `
      perspective(1100px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.04)
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

    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "50%");
    card.style.setProperty("--move-x", "0px");
    card.style.setProperty("--move-y", "0px");
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden rounded-[28px] transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-30 rounded-[28px] opacity-0 transition duration-300 group-hover:opacity-70">
        <div className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.22),transparent_30%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 rounded-[28px] opacity-0 transition duration-500 group-hover:opacity-30">
        <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(125deg,rgba(34,211,238,0.14),rgba(168,85,247,0.12),rgba(236,72,153,0.10),rgba(250,204,21,0.06),rgba(34,211,238,0.10))]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[28px] opacity-0 transition duration-500 group-hover:opacity-60">
        <div className="absolute inset-0 translate-x-[-120%] rounded-[28px] bg-[linear-gradient(115deg,transparent_28%,rgba(255,255,255,0.10)_45%,transparent_62%)] transition-transform duration-1000 group-hover:translate-x-[120%]" />
      </div>

      <div
        className="relative z-10 transition-transform duration-200 ease-out group-hover:translate-x-[var(--move-x)] group-hover:translate-y-[var(--move-y)]"
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </div>
  );
}