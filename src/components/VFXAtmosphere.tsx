import React, { useEffect, useRef } from 'react';

export const VFXAtmosphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrameId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle cool-slate, indigo, and seafoam fluid motion layers
    const blobs = [
      { bx: 0.2, by: 0.22, r: 0.36, speedX: 0.38, speedY: 0.28, hue: 226, sat: 68, light: 62, alpha: 0.14 },
      { bx: 0.8, by: 0.26, r: 0.38, speedX: 0.32, speedY: 0.44, hue: 196, sat: 70, light: 56, alpha: 0.12 },
      { bx: 0.46, by: 0.78, r: 0.42, speedX: 0.28, speedY: 0.36, hue: 244, sat: 58, light: 64, alpha: 0.11 },
      { bx: 0.84, by: 0.8, r: 0.32, speedX: 0.45, speedY: 0.24, hue: 170, sat: 56, light: 52, alpha: 0.1 },
    ];

    let t = 0;
    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);
      const minDim = Math.max(width, height);

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        const cx = width * (b.bx + Math.sin(t * b.speedX + i * 1.4) * 0.13);
        const cy = height * (b.by + Math.cos(t * b.speedY + i * 1.9) * 0.11);
        const radius = minDim * (b.r + Math.sin(t * 0.3 + i) * 0.035);

        const grad = ctx.createRadialGradient(cx, cy, radius * 0.06, cx, cy, radius);
        grad.addColorStop(0, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, ${b.alpha})`);
        grad.addColorStop(0.55, `hsla(${b.hue + 10}, ${b.sat}%, ${b.light}%, ${b.alpha * 0.4})`);
        grad.addColorStop(1, `hsla(${b.hue}, ${b.sat}%, ${b.light}%, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        t += 0.01;
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Base directional slate canvas */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100/70 to-indigo-50/45 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/75 transition-colors duration-500" />

      {/* Subtle architectural coordinate grid for visual structure */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Continuous fluid blur-gradient layers */}
      <div
        className="absolute -top-44 -left-24 w-[44rem] h-[34rem] rounded-full blur-[125px] animate-fluid-a"
        style={{
          background:
            'radial-gradient(circle at 35% 40%, rgba(79, 70, 229, 0.22), rgba(14, 165, 233, 0.16) 52%, transparent 78%)',
        }}
      />
      <div
        className="absolute -top-24 -right-32 w-[42rem] h-[38rem] rounded-full blur-[130px] animate-fluid-b"
        style={{
          background:
            'radial-gradient(circle at 60% 35%, rgba(14, 165, 233, 0.2), rgba(99, 102, 241, 0.15) 54%, transparent 80%)',
        }}
      />
      <div
        className="absolute -bottom-44 left-1/4 w-[48rem] h-[32rem] rounded-full blur-[125px] animate-fluid-c"
        style={{
          background:
            'radial-gradient(circle at 50% 60%, rgba(16, 185, 129, 0.16), rgba(79, 70, 229, 0.16) 55%, transparent 80%)',
        }}
      />

      {/* Real-time animated radial fluid canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90 dark:opacity-80" />

      {/* Top-to-bottom depth glaze */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-slate-200/35 dark:from-black/15 dark:via-transparent dark:to-black/45" />
    </div>
  );
};
