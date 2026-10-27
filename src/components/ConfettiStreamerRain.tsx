import React, { useEffect, useRef } from 'react';

export interface ConfettiOrigin {
  x: number;
  y: number;
}

interface Props {
  active: boolean;
  origin?: ConfettiOrigin | null;
  onComplete?: () => void;
}

// Particle Types: Confetti Rectangles, Streamer Ribbons (Serpentinas), Hearts, Stars, Sparkles
type ParticleKind = 'streamer' | 'confetti' | 'heart' | 'star' | 'glitter';

interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  length?: number;
  color: string;
  darkColor: string;
  opacity: number;
  rotation: number;
  rotationSpeed: number;
  flip: number;
  flipSpeed: number;
  swaySpeed: number;
  swayOffset: number;
  swayDistance: number;
  gravity: number;
  drag: number;
  sparklePhase?: number;
  // Ribbon segment trails for real serpentine streamers
  trail?: { x: number; y: number }[];
}

const PALETTE = [
  { main: '#ff0055', dark: '#b3003b' }, // Hot Crimson Rose
  { main: '#00f0ff', dark: '#0099aa' }, // Electric Cyan
  { main: '#ffcc00', dark: '#cc9900' }, // Brilliant Gold
  { main: '#10b981', dark: '#047857' }, // Emerald Racing
  { main: '#d946ef', dark: '#9333ea' }, // Neon Purple
  { main: '#f97316', dark: '#c2410c' }, // Flame Orange
  { main: '#38bdf8', dark: '#0284c7' }, // Sky Blue
  { main: '#ffffff', dark: '#cbd5e1' }, // Starlight White
  { main: '#ff4d6d', dark: '#c9184a' }, // Valentine Pink
];

export const ConfettiStreamerRain: React.FC<Props> = ({ active, origin, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = (canvas.width = window.innerWidth * dpr);
    let height = (canvas.height = window.innerHeight * dpr);
    ctx.scale(dpr, dpr);

    const logicalWidth = window.innerWidth;
    const logicalHeight = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth * dpr;
      height = canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];

    // 1. Initial burst from the Heart button click origin
    const burstX = origin ? origin.x : logicalWidth / 2;
    const burstY = origin ? origin.y : logicalHeight * 0.45;
    const burstCount = 65;

    for (let i = 0; i < burstCount; i++) {
      const col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 11;
      const kindPick = Math.random();
      const kind: ParticleKind =
        kindPick < 0.35 ? 'heart' : kindPick < 0.7 ? 'star' : 'confetti';

      particles.push({
        kind,
        x: burstX,
        y: burstY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5.5, // strong upward kick
        size: kind === 'heart' ? 10 + Math.random() * 8 : 6 + Math.random() * 8,
        color: col.main,
        darkColor: col.dark,
        opacity: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.25,
        flip: Math.random() * Math.PI,
        flipSpeed: 0.08 + Math.random() * 0.15,
        swaySpeed: 0.04 + Math.random() * 0.05,
        swayOffset: Math.random() * Math.PI * 2,
        swayDistance: 1.5 + Math.random() * 2,
        gravity: 0.18 + Math.random() * 0.12,
        drag: 0.965,
        sparklePhase: Math.random() * Math.PI * 2,
      });
    }

    // 2. Cascade of long fluttery streamers (serpentinas) and confetti raining from sky
    const skyCascadeCount = 140;

    for (let i = 0; i < skyCascadeCount; i++) {
      const col = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const isStreamer = Math.random() < 0.42; // ~42% are streamers
      const isHeart = !isStreamer && Math.random() < 0.28;
      const kind: ParticleKind = isStreamer
        ? 'streamer'
        : isHeart
        ? 'heart'
        : Math.random() < 0.2
        ? 'star'
        : 'confetti';

      const startX = Math.random() * logicalWidth;
      const startY = -30 - Math.random() * (logicalHeight * 0.85);

      particles.push({
        kind,
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 3,
        vy: isStreamer ? 2.8 + Math.random() * 3.5 : 3.8 + Math.random() * 4.5,
        size: isStreamer ? 5 + Math.random() * 3 : kind === 'heart' ? 9 + Math.random() * 6 : 7 + Math.random() * 7,
        length: isStreamer ? 45 + Math.random() * 60 : undefined,
        color: col.main,
        darkColor: col.dark,
        opacity: 1,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
        flip: Math.random() * Math.PI,
        flipSpeed: 0.04 + Math.random() * 0.1,
        swaySpeed: 0.03 + Math.random() * 0.04,
        swayOffset: Math.random() * Math.PI * 2,
        swayDistance: isStreamer ? 3.5 + Math.random() * 3 : 1.5 + Math.random() * 2,
        gravity: isStreamer ? 0.09 : 0.14,
        drag: 0.99,
        sparklePhase: Math.random() * Math.PI * 2,
        trail: isStreamer
          ? Array.from({ length: 8 }, () => ({ x: startX, y: startY }))
          : undefined,
      });
    }

    let animId: number;
    const startTime = Date.now();
    const duration = 1600; // 1.6s quick festive burst that disappears promptly

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      let allDead = true;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Apply physics
        p.vx *= p.drag;
        p.vy = (p.vy + p.gravity) * p.drag;
        p.x += p.vx + Math.sin(p.swayOffset) * p.swayDistance;
        p.y += p.vy;

        p.swayOffset += p.swaySpeed;
        p.rotation += p.rotationSpeed;
        p.flip += p.flipSpeed;
        if (p.sparklePhase !== undefined) p.sparklePhase += 0.12;

        // Trail update for streamers
        if (p.trail) {
          p.trail.unshift({ x: p.x, y: p.y });
          if (p.trail.length > 8) p.trail.pop();
        }

        // Fade out gracefully and quickly as requested
        if (elapsed > 800) {
          p.opacity = Math.max(0, p.opacity - 0.038);
        }

        if (p.y < logicalHeight + 90 && p.opacity > 0) {
          allDead = false;

          ctx.save();
          ctx.globalAlpha = p.opacity;

          if (p.kind === 'streamer') {
            // Curving undulating ribbon (serpentina) with 3D twist
            const flipFactor = Math.sin(p.flip);
            const currentColor = flipFactor > 0 ? p.color : p.darkColor;

            ctx.strokeStyle = currentColor;
            ctx.lineWidth = Math.max(1.5, p.size * Math.abs(flipFactor));
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (p.trail && p.trail.length > 2) {
              ctx.beginPath();
              ctx.moveTo(p.trail[0].x, p.trail[0].y);
              for (let j = 1; j < p.trail.length; j++) {
                const xc = (p.trail[j - 1].x + p.trail[j].x) / 2;
                const yc = (p.trail[j - 1].y + p.trail[j].y) / 2;
                ctx.quadraticCurveTo(p.trail[j - 1].x, p.trail[j - 1].y, xc, yc);
              }
              ctx.stroke();

              // Add sparkling tip highlight
              ctx.fillStyle = '#ffffff';
              ctx.shadowColor = currentColor;
              ctx.shadowBlur = 8;
              ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
            } else {
              // Direct sine streamer
              ctx.beginPath();
              const ribbonLen = p.length || 50;
              ctx.moveTo(p.x, p.y);
              for (let step = 0; step < ribbonLen; step += 10) {
                const waveX = p.x + Math.sin(p.swayOffset + step * 0.15) * 12;
                const waveY = p.y - step;
                ctx.lineTo(waveX, waveY);
              }
              ctx.stroke();
            }
          } else if (p.kind === 'heart') {
            // Miniature beating celebratory heart
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            const flipScale = Math.sin(p.flip);
            ctx.scale(flipScale, 1);

            const s = p.size;
            ctx.fillStyle = flipScale > 0 ? p.color : p.darkColor;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;

            ctx.beginPath();
            ctx.moveTo(0, s * 0.3);
            ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, s * 0.2, 0, s);
            ctx.bezierCurveTo(s, s * 0.2, s * 0.5, -s * 0.3, 0, s * 0.3);
            ctx.fill();
          } else if (p.kind === 'star') {
            // Sparkling 4-point starlight
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            const sparkle = Math.abs(Math.sin(p.sparklePhase || 0));
            const s = p.size * (0.7 + sparkle * 0.5);

            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;

            ctx.beginPath();
            for (let pt = 0; pt < 4; pt++) {
              ctx.rotate(Math.PI / 2);
              ctx.lineTo(s, 0);
              ctx.lineTo(s * 0.25, s * 0.25);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            // Confetti rectangle with 3D tumbling perspective
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            const flipFactor = Math.cos(p.flip);
            ctx.scale(1, flipFactor);

            ctx.fillStyle = flipFactor > 0 ? p.color : p.darkColor;
            ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.7);

            // Glisten border on face
            if (flipFactor > 0.6) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
              ctx.fillRect(-p.size / 2, -p.size / 3, p.size, 1.5);
            }
          }

          ctx.restore();
        }
      }

      if (elapsed < duration && !allDead) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        if (onComplete) onComplete();
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [active, origin, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
