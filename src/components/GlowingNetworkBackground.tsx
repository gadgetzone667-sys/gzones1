import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  glowColor: string;
  pulsePhase: number;
}

interface ConnectionPulse {
  p1Index: number;
  p2Index: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
}

const COLOR_PALETTE = [
  { main: "rgba(0, 240, 255, 0.9)", glow: "#00f0ff" },   // Cyan
  { main: "rgba(255, 0, 127, 0.9)", glow: "#ff007f" },   // Magenta
  { main: "rgba(168, 85, 247, 0.9)", glow: "#a855f7" },  // Purple
  { main: "rgba(59, 130, 246, 0.9)", glow: "#3b82f6" },   // Neon Blue
  { main: "rgba(16, 185, 129, 0.9)", glow: "#10b981" },  // Emerald
  { main: "rgba(245, 158, 11, 0.9)", glow: "#f59e0b" },  // Gold
];

export const GlowingNetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Mouse tracking
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 180,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    // Initialize particles
    const particleCount = Math.min(Math.floor((width * height) / 14000), 85);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const paletteItem = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2 + 1.8,
        color: paletteItem.main,
        glowColor: paletteItem.glow,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Dynamic passing light pulses along connections
    const pulses: ConnectionPulse[] = [];
    const maxDist = 140;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep dark futuristic canvas overlay
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(5, 8, 20, 0.95)");
      gradient.addColorStop(0.5, "rgba(9, 13, 26, 0.96)");
      gradient.addColorStop(1, "rgba(3, 5, 14, 0.97)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Update particle positions
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off canvas walls
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        p.pulsePhase += 0.03;
      });

      // Maintain passing connection pulses
      // Clean up dead pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].progress += pulses[i].speed;
        if (pulses[i].progress >= 1) {
          pulses.splice(i, 1);
        }
      }

      // Draw connections and spawn passing glowing pulses
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.45;

            // Gradient line between multicolor dots
            const lineGrad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            lineGrad.addColorStop(0, p1.color.replace("0.9", `${alpha}`));
            lineGrad.addColorStop(1, p2.color.replace("0.9", `${alpha}`));

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();

            // Occasionally spawn a passing glowing light packet along active connections
            if (Math.random() < 0.003 && pulses.length < 40) {
              pulses.push({
                p1Index: i,
                p2Index: j,
                progress: 0,
                speed: 0.008 + Math.random() * 0.012,
                color: p1.glowColor,
              });
            }
          }
        }

        // Connect to mouse cursor if nearby
        if (mouse.x > 0 && mouse.y > 0) {
          const p = particles[i];
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const alpha = (1 - dist / mouse.radius) * 0.6;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "#00f0ff";
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Draw passing glowing pulses along connection lines
      pulses.forEach((pulse) => {
        const p1 = particles[pulse.p1Index];
        const p2 = particles[pulse.p2Index];
        if (!p1 || !p2) return;

        const currentX = p1.x + (p2.x - p1.x) * pulse.progress;
        const currentY = p1.y + (p2.y - p1.y) * pulse.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(currentX, currentY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 14;
        ctx.shadowColor = pulse.color;
        ctx.fill();

        // Draw light streak trailing behind pulse
        const trailX = p1.x + (p2.x - p1.x) * Math.max(0, pulse.progress - 0.08);
        const trailY = p1.y + (p2.y - p1.y) * Math.max(0, pulse.progress - 0.08);

        const streakGrad = ctx.createLinearGradient(trailX, trailY, currentX, currentY);
        streakGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
        streakGrad.addColorStop(1, pulse.color);

        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(currentX, currentY);
        ctx.strokeStyle = streakGrad;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
      });

      // Draw glowing multicolored dots
      particles.forEach((p) => {
        const currentRadius = p.radius + Math.sin(p.pulsePhase) * 0.6;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12 + Math.sin(p.pulsePhase) * 4;
        ctx.shadowColor = p.glowColor;
        ctx.fill();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] transition-opacity duration-1000"
    />
  );
};

export default GlowingNetworkBackground;
