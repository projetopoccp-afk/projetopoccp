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

    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;

    card.style.setProperty("--glow-x", `${percentX * 100}%`);
    card.style.setProperty("--glow-y", `${percentY * 100}%`);

    card.style.transform = `
      perspective(1200px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.02)
    `;
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = `
      perspective(1200px)
      rotateX(0deg)
      rotateY(0deg)
      scale(1)
    `;

    card.style.setProperty("--glow-x", "50%");
    card.style.setProperty("--glow-y", "50%");
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden rounded-[24px] transition-transform duration-200 ease-out ${className}`}
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-30 rounded-[24px] opacity-0 transition duration-300 group-hover:opacity-35">
        <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.18),transparent_32%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[24px] opacity-0 transition duration-500 group-hover:opacity-45">
        <div className="absolute inset-0 translate-x-[-120%] rounded-[24px] bg-[linear-gradient(115deg,transparent_28%,rgba(255,255,255,0.10)_45%,transparent_62%)] transition-transform duration-1000 group-hover:translate-x-[120%]" />
      </div>

      <div
        className="relative z-10"
        style={{
          transformStyle: "preserve-3d",
          backfaceVisibility: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}