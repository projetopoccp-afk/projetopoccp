"use client";

const particles = Array.from({ length: 36 });

export function ParticleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((_, index) => (
        <span
          key={index}
          className="absolute h-1 w-1 animate-pulse rounded-full bg-cyan-200/40 shadow-[0_0_12px_rgba(103,232,249,0.8)]"
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 53) % 100}%`,
            animationDelay: `${index * 0.18}s`,
            animationDuration: `${2 + (index % 5)}s`,
          }}
        />
      ))}
    </div>
  );
}