import React, { useEffect, useRef } from 'react';

export const VFXAtmosphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Subtle ambient particle field
    const particleCount = Math.min(32, Math.floor(width / 50));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.6,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -Math.random() * 0.35 - 0.1,
      alpha: Math.random() * 0.5 + 0.15,
      hue: Math.random() > 0.5 ? 220 : 270, // Cool blue to violet
    }));

    let t = 0;
    const render = () => {
      t += 0.008;
      ctx.clearRect(0, 0, width, height);

      // Draw faint floating particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx + Math.sin(t + i) * 0.15;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha * 0.4})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Dynamic blurred chromatic orbs drifting in the background */}
      <div className="absolute -top-32 left-1/4 w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-indigo-500/15 via-violet-500/10 to-cyan-400/15 blur-[100px] animate-aurora" />
      <div className="absolute top-20 right-10 w-[450px] h-[400px] rounded-full bg-gradient-to-br from-cyan-500/12 via-blue-500/10 to-fuchsia-500/12 blur-[120px] animate-aurora-fast" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[350px] rounded-full bg-gradient-to-tr from-violet-600/10 via-purple-500/10 to-indigo-400/10 blur-[110px] animate-aurora" />

      {/* Particle dust canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />
    </div>
  );
};
