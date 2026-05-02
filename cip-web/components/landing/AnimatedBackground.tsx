"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const colors = ["#4F46E5", "#06B6D4", "#22C55E", "#8B5CF6"];
    const particles: Particle[] = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(79, 70, 229, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.round(p.alpha * 255).toString(16).padStart(2, "0");
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-mesh" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-60" />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Large orbs */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)",
          top: "5%",
          left: "10%",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
          bottom: "10%",
          right: "10%",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.9, 0.5],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          background: "radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)",
          top: "40%",
          left: "60%",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Floating data nodes — visualize AI processing */}
      {[
        { label: "Resume.pdf", x: "8%", y: "35%", color: "#4F46E5", delay: 0 },
        { label: "Skills++", x: "85%", y: "20%", color: "#06B6D4", delay: 1 },
        { label: "Match: 94%", x: "15%", y: "70%", color: "#22C55E", delay: 2 },
        { label: "AI Feedback", x: "80%", y: "65%", color: "#8B5CF6", delay: 1.5 },
        { label: "Interview ✓", x: "50%", y: "85%", color: "#F59E0B", delay: 0.5 },
      ].map((node) => (
        <motion.div
          key={node.label}
          className="absolute hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-jetbrains font-medium"
          style={{
            left: node.x,
            top: node.y,
            background: `${node.color}15`,
            border: `1px solid ${node.color}30`,
            color: node.color,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 0.8, 0.8, 0],
            scale: [0.8, 1, 1, 0.8],
            y: [0, -10, -10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: node.delay,
            ease: "easeInOut",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: node.color }}
          />
          {node.label}
        </motion.div>
      ))}
    </div>
  );
}
