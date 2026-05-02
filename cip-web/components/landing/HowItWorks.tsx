"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  FileText,
  Video,
  MessageSquare,
  Target,
  Briefcase,
} from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Upload Resume",
    description:
      "Drop your resume. AI instantly parses your skills, experience, and identifies gaps versus market demand.",
    color: "#4F46E5",
    detail: "Parsed in < 3 sec",
  },
  {
    icon: Video,
    title: "AI Mock Interview",
    description:
      "Choose your target role and enter a live AI interview. Real questions. Real pressure. Real voice analysis.",
    color: "#06B6D4",
    detail: "Voice + NLP powered",
  },
  {
    icon: MessageSquare,
    title: "Instant Feedback",
    description:
      "Every answer is scored. AI breaks down content quality, communication clarity, and confidence level.",
    color: "#8B5CF6",
    detail: "Per-answer scoring",
  },
  {
    icon: Target,
    title: "Identify Gaps",
    description:
      "Skill intelligence maps exactly what you're missing and shows the fastest path to bridge the gap.",
    color: "#F59E0B",
    detail: "Personalized roadmap",
  },
  {
    icon: Briefcase,
    title: "Match & Apply",
    description:
      "AI surfaces jobs where your readiness score is above the threshold. Apply with confidence.",
    color: "#22C55E",
    detail: "400+ live listings",
  },
];

export default function HowItWorks() {
  const lineRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(lineRef, { once: true, margin: "-100px" });

  return (
    <section
      id="how-it-works"
      className="py-28 px-6 relative overflow-hidden"
    >
      {/* Background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120]/60 to-transparent pointer-events-none" />
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/20 mb-5"
          >
            <span className="text-xs font-semibold text-[#06B6D4] uppercase tracking-wider">
              The Process
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-syne text-4xl md:text-5xl font-extrabold text-white mb-4"
          >
            From Resume to{" "}
            <span className="text-gradient">Job Offer</span>
            <br />
            in 5 Steps
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[#94A3B8] text-lg max-w-xl mx-auto"
          >
            A structured pipeline that transforms interview anxiety into
            career confidence.
          </motion.p>
        </div>

        {/* Timeline — Desktop */}
        <div className="hidden lg:block relative" ref={lineRef}>
          {/* Progress line */}
          <div className="absolute top-8 left-[10%] right-[10%] h-px bg-white/[0.06]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#4F46E5] via-[#06B6D4] via-[#8B5CF6] via-[#F59E0B] to-[#22C55E]"
              initial={{ width: "0%" }}
              animate={isInView ? { width: "100%" } : {}}
              transition={{ duration: 1.5, ease: "easeInOut", delay: 0.3 }}
            />
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
                className="flex flex-col items-center text-center group"
              >
                {/* Icon circle */}
                <motion.div
                  whileHover={{ scale: 1.15 }}
                  className="relative w-16 h-16 rounded-full flex items-center justify-center mb-5 z-10 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${step.color}30, ${step.color}10)`,
                    border: `2px solid ${step.color}40`,
                    boxShadow: `0 0 0 0 ${step.color}40`,
                  }}
                  whileInView={{
                    boxShadow: [`0 0 0 0 ${step.color}40`, `0 0 0 8px transparent`],
                  }}
                  transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
                >
                  <step.icon className="w-7 h-7" style={{ color: step.color }} />
                  {/* Step number badge */}
                  <div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: step.color }}
                  >
                    {i + 1}
                  </div>
                </motion.div>

                {/* Detail badge */}
                <div
                  className="px-2.5 py-1 rounded-full text-[10px] font-medium mb-2"
                  style={{
                    background: `${step.color}12`,
                    color: step.color,
                    border: `1px solid ${step.color}25`,
                  }}
                >
                  {step.detail}
                </div>

                <h4 className="font-syne font-bold text-white text-base mb-2">
                  {step.title}
                </h4>
                <p className="text-xs text-[#64748B] leading-relaxed px-1">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline — Mobile (vertical) */}
        <div className="lg:hidden space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-4"
            >
              {/* Left: icon + line */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `${step.color}20`,
                    border: `1px solid ${step.color}40`,
                  }}
                >
                  <step.icon className="w-5 h-5" style={{ color: step.color }} />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 mt-2 bg-gradient-to-b from-white/10 to-transparent" />
                )}
              </div>

              {/* Right: content */}
              <div className="pb-6">
                <div
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-medium mb-1"
                  style={{ background: `${step.color}15`, color: step.color }}
                >
                  Step {i + 1}
                </div>
                <h4 className="font-syne font-bold text-white text-base mb-1">
                  {step.title}
                </h4>
                <p className="text-sm text-[#64748B] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA under timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-[#94A3B8] text-sm mb-4">
            Average time from first session to first offer:{" "}
            <strong className="text-white">14 days</strong>
          </p>
          <motion.a
            href="#cta"
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white text-sm font-semibold hover:bg-white/[0.1] transition-all"
          >
            Start Your Journey →
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
}
