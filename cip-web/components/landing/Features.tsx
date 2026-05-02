"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  Target,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Interview Coach",
    description:
      "Practice with realistic AI interviews. The system analyzes tone, content, confidence, and pacing, then gives focused feedback after every answer.",
    color: "#4F46E5",
    gradient: "from-[#4F46E5]/20 to-[#4F46E5]/5",
    tag: "Core Module",
    bullets: ["Voice recognition", "Sentiment analysis", "Adaptive difficulty"],
  },
  {
    icon: Zap,
    title: "Skill Intelligence",
    description:
      "Upload your resume and get an instant 360° skill audit. AI identifies your gaps, maps learning paths, and shows exactly what companies want.",
    color: "#06B6D4",
    gradient: "from-[#06B6D4]/20 to-[#06B6D4]/5",
    tag: "Smart Analysis",
    bullets: ["Resume parsing", "Gap mapping", "Learning paths"],
  },
  {
    icon: Target,
    title: "Smart Job Matching",
    description:
      "AI cross-references your skill DNA against 400+ live job postings and surfaces only roles where your match score exceeds 75%. No noise.",
    color: "#22C55E",
    gradient: "from-[#22C55E]/20 to-[#22C55E]/5",
    tag: "Live Jobs",
    bullets: ["400+ companies", "Real-time sync", "Match scoring"],
  },
  {
    icon: ShieldCheck,
    title: "Certificate Validator",
    description:
      "ML-powered OCR verifies certificate authenticity instantly. Detect tampering, confirm credentials, and build a verified portfolio employers trust.",
    color: "#F59E0B",
    gradient: "from-[#F59E0B]/20 to-[#F59E0B]/5",
    tag: "Trust Layer",
    bullets: ["OCR scanning", "Tamper detection", "Verified badges"],
  },
];

export default function Features() {
  return (
    <section id="features" className="py-28 px-6 relative overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1120]/40 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4F46E5]/10 border border-[#4F46E5]/20 mb-5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider">
              Four Powerful Modules
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-syne text-4xl md:text-5xl font-extrabold text-white mb-4"
          >
            Everything You Need to{" "}
            <span className="text-gradient">Land Your Dream Job</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#94A3B8] text-lg max-w-2xl mx-auto"
          >
            Each module is independently powerful. Together, they form an
            unstoppable career OS.
          </motion.p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.03, y: -6 }}
              className="group relative p-6 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-xl hover:border-white/20 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Hover glow bg */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              />

              {/* Top shimmer line */}
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`,
                }}
              />

              <div className="relative z-10">
                {/* Tag */}
                <div
                  className="inline-block px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider mb-4"
                  style={{
                    background: `${f.color}15`,
                    color: f.color,
                    border: `1px solid ${f.color}30`,
                  }}
                >
                  {f.tag}
                </div>

                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${f.color}30, ${f.color}10)`,
                    border: `1px solid ${f.color}25`,
                  }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>

                {/* Title */}
                <h3 className="font-syne text-xl font-bold text-white mb-2">
                  {f.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
                  {f.description}
                </p>

                {/* Bullets */}
                <ul className="space-y-1.5 mb-4">
                  {f.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-center gap-2 text-xs text-[#64748B]"
                    >
                      <span
                        className="w-1 h-1 rounded-full"
                        style={{ background: f.color }}
                      />
                      {b}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div
                  className="flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ color: f.color }}
                >
                  Explore module
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-[#4F46E5]/10 via-[#06B6D4]/10 to-[#22C55E]/10 border border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div>
            <div className="font-syne text-lg font-bold text-white mb-1">
              All modules included in every plan
            </div>
            <div className="text-sm text-[#94A3B8]">
              No feature gates. Full access from day one.
            </div>
          </div>
          <motion.a
            href="#cta"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="flex-shrink-0 px-6 py-3 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white text-sm font-semibold hover:shadow-lg hover:shadow-[#4F46E5]/30 transition-all"
          >
            Start for Free →
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
