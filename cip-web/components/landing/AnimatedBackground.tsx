"use client";

import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black">
      {/* Base mesh gradient class from global CSS */}
      <div className="absolute inset-0 bg-mesh opacity-40" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-10" />

      {/* Large subtle orbs */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '80vw',
          height: '80vh',
          background: "radial-gradient(circle, rgba(79,70,229,0.03) 0%, transparent 60%)",
          top: "-10%",
          left: "-10%",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: '70vw',
          height: '70vh',
          background: "radial-gradient(circle, rgba(6,182,212,0.02) 0%, transparent 60%)",
          bottom: "-10%",
          right: "-10%",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  );
}
