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
  progress: number;
  speed: number;
  color: string;
}

const COLOR_PALETTE = [
  { main: "rgba(0, 240, 255, 0.9)", glow: "rgba(0, 240, 255, 0.3)" },   // Cyan
  { main: "rgba(255, 0, 127, 0.9)", glow: "rgba(255, 0, 127, 0.3)" },   // Magenta
  { main: "rgba(168, 85, 247, 0.9)", glow: "rgba(168, 85, 247, 0.3)" },  // Purple
  { main: "rgba(59, 130, 246, 0.9)", glow: "rgba(59, 130, 246, 0.3)" },   // Neon Blue
  { main: "rgba(16, 185, 129, 0.9)", glow: "rgba(16, 185, 129, 0.3)" },  // Emerald
  { main: "rgba(245, 158, 11, 0.9)", glow: "rgba(245, 158, 11, 0.3)" },  // Gold
];

export const GlowingNetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    let isVisible = !document.hidden;
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize, { passive: true });

    // Mouse tracking (throttled)
    const mouse = {
      x: -1000,
      y: -1000,
      radius: 150,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    // Optimized particle count: balanced density without frame drops
    const particleCount = Math.min(Math.floor((width * height) / 32000), 40);
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      const paletteItem = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 1.6 + 1.6,
        color: paletteItem.main,
        glowColor: paletteItem.glow,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    const pulses: ConnectionPulse[] = [];
    const maxDist = 135;

    const animate = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      // Fast solid dark background fill
      ctx.fillStyle = "#060913";
      ctx.fillRect(0, 0, width, height);

      // Subtle gradient vignette without re-allocating
      const radialGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width);
      radialGrad.addColorStop(0, "rgba(10, 16, 32, 0.4)");
      radialGrad.addColorStop(1, "rgba(4, 6, 14, 0.85)");
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, width, height);

      // Update particle positions
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        p.pulsePhase += 0.025;
      }

      // Clean up finished pulses
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].progress += pulses[i].speed;
        if (pulses[i].progress >= 1) {
          pulses.splice(i, 1);
        }
      }

      // Batched lines pass: draw all connections in a single lightweight stroke pass
      ctx.beginPath();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.15)";
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDist * maxDist) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);

            // Spawn passing light packets
            if (Math.random() < 0.002 && pulses.length < 15) {
              pulses.push({
                p1Index: i,
                p2Index: j,
                progress: 0,
                speed: 0.01 + Math.random() * 0.012,
                color: p1.color,
              });
            }
          }
        }

        // Connect to mouse cursor if nearby
        if (mouse.x > 0 && mouse.y > 0) {
          const dx = mouse.x - p1.x;
          const dy = mouse.y - p1.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < mouse.radius * mouse.radius) {
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
          }
        }
      }
      ctx.stroke();

      // Render pulses efficiently
      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        const p1 = particles[pulse.p1Index];
        const p2 = particles[pulse.p2Index];
        if (!p1 || !p2) continue;

        const currentX = p1.x + (p2.x - p1.x) * pulse.progress;
        const currentY = p1.y + (p2.y - p1.y) * pulse.progress;

        ctx.beginPath();
        ctx.arc(currentX, currentY, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      // Draw particles with 2-layer halo (hardware fast, zero shadowBlur overhead)
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const radius = p.radius + Math.sin(p.pulsePhase) * 0.4;

        // Outer soft glow aura
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.glowColor;
        ctx.fill();

        // Core bright center
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[-1] will-change-transform"
    />
  );
};

export default GlowingNetworkBackground;
