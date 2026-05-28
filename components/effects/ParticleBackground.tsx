"use client";

const particles = Array.from({ length: 42 });

const connections = [
  { left: "12%", top: "22%", width: "180px", rotate: "24deg" },
  { left: "28%", top: "68%", width: "220px", rotate: "-18deg" },
  { left: "62%", top: "28%", width: "260px", rotate: "14deg" },
  { left: "72%", top: "74%", width: "190px", rotate: "-28deg" },
  { left: "42%", top: "48%", width: "300px", rotate: "8deg" },
];

export function ParticleBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {connections.map((line, index) => (
        <span
          key={`connection-${index}`}
          className="absolute h-px origin-left animate-pulse bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent"
          style={{
            left: line.left,
            top: line.top,
            width: line.width,
            transform: `rotate(${line.rotate})`,
            animationDelay: `${index * 0.7}s`,
            animationDuration: `${4 + index}s`,
          }}
        />
      ))}

      {particles.map((_, index) => (
        <span
          key={index}
          className="absolute rounded-full bg-cyan-200/35 shadow-[0_0_14px_rgba(103,232,249,0.65)]"
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 53) % 100}%`,
            width: `${2 + (index % 3)}px`,
            height: `${2 + (index % 3)}px`,
            opacity: 0.25 + (index % 5) * 0.1,
            animation: `floatParticle ${6 + (index % 7)}s ease-in-out infinite`,
            animationDelay: `${index * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}