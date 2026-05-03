"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Play,
  ChevronRight,
  Star,
  Mic,
  Brain,
  CheckCircle2,
} from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";



const stats = [
  { value: "10K+", label: "Interviews Conducted", color: "#4F46E5" },
  { value: "95%", label: "Success Rate", color: "#06B6D4" },
  { value: "500+", label: "Top Companies", color: "#22C55E" },
];

const sampleMessages = [
  { role: "ai", text: "Tell me about a challenging project you led." },
  {
    role: "user",
    text: "I led a team of 5 to rebuild our microservices architecture...",
  },
  {
    role: "ai",
    text: "Great structure! Add quantifiable impact — e.g. latency reduced by X%.",
    isFeeback: true,
  },
];

export default function Hero() {


  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <AnimatedBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 mb-8"
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] text-sm">
            <motion.span
              className="w-2 h-2 rounded-full bg-[#22C55E]"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-[#22C55E] font-mono-jetbrains text-xs font-medium">
              LIVE
            </span>
            <span className="text-[#94A3B8]">AI Interview Platform — Now in Beta</span>
          </div>
        </motion.div>

        {/* Halo Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-500/10 to-transparent blur-[100px] rounded-full pointer-events-none -z-10" />

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="font-syne text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-wide"
        >
          <span className="text-gradient block">Your AI Career Copilot.</span>
          <span className="text-white block mt-2">Turn Interviews into</span>
          <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
            Offers.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="text-lg md:text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Real-time AI coaching for interviews, instant skill gap analysis,
          and smart job matching — all in one platform built for serious
          candidates.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-6"
        >
          <motion.a
            href="/auth/signup"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white font-semibold text-base shadow-lg shadow-[#4F46E5]/30 hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all"
          >
            Start Your Interview
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.a>
          <motion.a
            href="#demo"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="group flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white font-semibold text-base hover:bg-white/[0.1] transition-all"
          >
            <Play className="w-4 h-4" />
            Watch Demo
          </motion.a>
        </motion.div>

        {/* Social proof stars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-3 mb-16 text-sm text-[#64748B]"
        >
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]"
              />
            ))}
          </div>
          <span>
            <strong className="text-[#E2E8F0]">4.9/5</strong> from 2,400+
            candidates
          </span>
        </motion.div>

        {/* Main visual: split cards */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {/* Left: Live interview preview */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="glass-card rounded-2xl overflow-hidden text-left"
          >
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex gap-1.5">
                {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
                  <div
                    key={c}
                    className="w-3 h-3 rounded-full"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="flex-1 text-center">
                <span className="font-mono-jetbrains text-xs text-[#64748B]">
                  cip.ai / interview
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#22C55E]">
                <Mic className="w-3 h-3" />
                <span>REC</span>
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-[#22C55E]"
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              </div>
            </div>

            {/* Chat messages */}
            <div className="p-4 space-y-3 min-h-[220px]">
              {sampleMessages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.4 }}
                  className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      msg.role === "ai"
                        ? "bg-gradient-to-br from-[#4F46E5] to-[#06B6D4]"
                        : "bg-[#1E293B] border border-white/10"
                    }`}
                  >
                    {msg.role === "ai" ? (
                      <Brain className="w-3.5 h-3.5 text-white" />
                    ) : (
                      "U"
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      (msg as { isFeeback?: boolean }).isFeeback
                        ? "bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]"
                        : msg.role === "ai"
                        ? "bg-white/[0.05] border border-white/[0.06] text-[#E2E8F0]"
                        : "bg-[#4F46E5]/20 border border-[#4F46E5]/30 text-[#E2E8F0]"
                    }`}
                  >
                    {(msg as { isFeeback?: boolean }).isFeeback && (
                      <div className="flex items-center gap-1 mb-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        AI Tip
                      </div>
                    )}
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Score bar */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between text-xs text-[#64748B] mb-1.5">
                <span>Confidence Score</span>
                <span className="text-[#22C55E] font-semibold">87%</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#4F46E5] to-[#22C55E]"
                  initial={{ width: 0 }}
                  animate={{ width: "87%" }}
                  transition={{ delay: 1.8, duration: 1.2, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>

          {/* Right: Skill radar + job cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-4"
          >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  className="glass-card rounded-xl p-3 text-center"
                >
                  <div
                    className="font-syne text-2xl font-bold"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5 leading-tight">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Job matches */}
            <div className="glass-card rounded-2xl p-4 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  AI Job Matches
                </span>
                <span className="text-xs text-[#4F46E5]">View All →</span>
              </div>
              {[
                {
                  role: "Senior Software Engineer",
                  co: "Google",
                  match: 94,
                  color: "#22C55E",
                },
                {
                  role: "Product Manager",
                  co: "Stripe",
                  match: 87,
                  color: "#06B6D4",
                },
                {
                  role: "ML Engineer",
                  co: "OpenAI",
                  match: 82,
                  color: "#4F46E5",
                },
              ].map((job, i) => (
                <motion.div
                  key={job.co}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + i * 0.15 }}
                  className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-[#E2E8F0]">
                      {job.role}
                    </div>
                    <div className="text-xs text-[#64748B]">{job.co}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="text-sm font-bold"
                      style={{ color: job.color }}
                    >
                      {job.match}%
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-[#64748B]" />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trusted by */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="glass-card rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider">
                Trusted by employees at
              </span>
              <div className="flex gap-4 text-xs font-semibold text-[#64748B]">
                {["Google", "Meta", "Amazon", "Apple"].map((co) => (
                  <span key={co} className="hover:text-white transition-colors cursor-default">
                    {co}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
