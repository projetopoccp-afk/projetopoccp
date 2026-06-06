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

    const rotateX = ((y - centerY) / centerY) * -20;
    const rotateY = ((x - centerX) / centerX) * 20;

    card.style.setProperty("--glow-x", `${percentX * 100}%`);
    card.style.setProperty("--glow-y", `${percentY * 100}%`);

    card.style.transform = `
      perspective(1000px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale(1.055)
    `;
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;

    card.style.transform = `
      perspective(1000px)
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
      className={`group relative overflow-hidden rounded-[24px] transition-transform duration-150 ease-out will-change-transform ${className}`}
      style={{
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden",
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 z-30 rounded-[24px] opacity-0 transition-opacity duration-300 group-hover:opacity-45">
        <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_var(--glow-x)_var(--glow-y),rgba(255,255,255,0.22),rgba(103,232,249,0.08)_22%,transparent_42%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[24px] opacity-0 transition-opacity duration-500 group-hover:opacity-50">
        <div className="absolute inset-0 translate-x-[-130%] rounded-[24px] bg-[linear-gradient(115deg,transparent_24%,rgba(255,255,255,0.08)_38%,rgba(255,255,255,0.18)_48%,rgba(103,232,249,0.08)_56%,transparent_72%)] transition-transform duration-1000 group-hover:translate-x-[130%]" />
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