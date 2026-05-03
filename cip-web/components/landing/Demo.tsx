"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Play,
  Mic,
  MicOff,
  Brain,
  BarChart3,
  TrendingUp,
  Award,
  ChevronRight,
} from "lucide-react";

const features = [
  "Real-time voice recognition & analysis",
  "AI-generated per-answer feedback",
  "Adaptive question difficulty engine",
  "Skill gap identification on-the-fly",
  "Export full session report as PDF",
];

const questions = [
  "Tell me about a time you led a high-stakes project under a tight deadline.",
  "How do you handle conflict within a cross-functional team?",
  "Describe your experience with system design at scale.",
  "What's your approach to mentoring junior engineers?",
];

const skillBars = [
  { skill: "Communication", score: 82, color: "#4F46E5" },
  { skill: "Technical Depth", score: 91, color: "#06B6D4" },
  { skill: "Problem Solving", score: 76, color: "#22C55E" },
  { skill: "Leadership", score: 68, color: "#F59E0B" },
];

export default function Demo() {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [recording, setRecording] = useState(false);

  return (
    <section id="demo" className="py-28 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0B1120]/50 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 mb-6"
            >
              <Play className="w-3.5 h-3.5 text-[#22C55E]" />
              <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">
                See It In Action
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-syne text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight"
            >
              AI That Coaches You{" "}
              <span className="text-gradient">Like a Real Mentor</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-[#A1A1AA] mb-8 leading-relaxed"
            >
              Our AI doesn't just listen — it understands. It evaluates your
              answers the way a senior hiring manager would, then teaches you
              to do better.
            </motion.p>

            {/* Feature list */}
            <motion.ul
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                visible: { transition: { staggerChildren: 0.08 } },
              }}
              className="space-y-3 mb-10"
            >
              {features.map((f) => (
                <motion.li
                  key={f}
                  variants={{
                    hidden: { opacity: 0, x: -20 },
                    visible: { opacity: 1, x: 0 },
                  }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[#22C55E]/15 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                  </div>
                  <span className="text-[#FFFFFF] text-sm">{f}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.a
              href="#cta"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white font-semibold text-base shadow-lg shadow-[#4F46E5]/30 hover:shadow-xl transition-all"
            >
              Try It Now — Free
              <ChevronRight className="w-4 h-4" />
            </motion.a>
          </div>

          {/* Right: Interactive Mock Interface */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Glow backdrop */}
            <div className="absolute -inset-4 bg-gradient-to-br from-[#4F46E5]/20 to-[#06B6D4]/20 blur-3xl rounded-3xl" />

            <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0B1120]/80 backdrop-blur-xl shadow-2xl">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-black/30">
                <div className="flex gap-1.5">
                  {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 flex items-center justify-center gap-2">
                  <span className="font-mono-jetbrains text-xs text-[#71717A]">
                    cip.ai / interview / software-engineer
                  </span>
                </div>
              </div>

              {/* Main content */}
              <div className="p-5 space-y-4">
                {/* Header bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#4F46E5]" />
                    <span className="text-sm font-medium text-white">
                      AI Interview Coach
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-[#22C55E]"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[#22C55E]">Session Active</span>
                  </div>
                </div>

                {/* Question selector */}
                <div className="space-y-2">
                  <div className="text-xs text-[#71717A] uppercase tracking-wider mb-2">
                    Question {activeQuestion + 1} / {questions.length}
                  </div>
                  <div className="p-4 rounded-xl bg-[#4F46E5]/10 border border-[#4F46E5]/20">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={activeQuestion}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-sm text-[#FFFFFF] leading-relaxed"
                      >
                        {questions[activeQuestion]}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  {/* Question nav */}
                  <div className="flex gap-1.5">
                    {questions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveQuestion(i)}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background:
                            i === activeQuestion
                              ? "#4F46E5"
                              : i < activeQuestion
                              ? "#4F46E5" + "60"
                              : "rgba(255,255,255,0.08)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Recording button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setRecording(!recording)}
                    className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      recording
                        ? "bg-red-500/20 border border-red-500/30 text-red-400"
                        : "bg-[#4F46E5]/15 border border-[#4F46E5]/25 text-[#4F46E5]"
                    }`}
                  >
                    {recording ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        >
                          <MicOff className="w-4 h-4" />
                        </motion.div>
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        Start Recording
                      </>
                    )}
                  </button>
                  <div className="text-xs text-[#71717A]">
                    {recording ? (
                      <motion.span
                        className="text-red-400"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        ● Recording...
                      </motion.span>
                    ) : (
                      "Press to answer"
                    )}
                  </div>
                </div>

                {/* Skill bars */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#A1A1AA]">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Session Skills
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#22C55E]">
                      <TrendingUp className="w-3 h-3" />
                      +12% this week
                    </div>
                  </div>
                  {skillBars.map((bar, i) => (
                    <div key={bar.skill}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#A1A1AA]">{bar.skill}</span>
                        <span
                          className="font-semibold"
                          style={{ color: bar.color }}
                        >
                          {bar.score}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: bar.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${bar.score}%` }}
                          viewport={{ once: true }}
                          transition={{
                            delay: 0.3 + i * 0.1,
                            duration: 0.8,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Award, label: "Overall", value: "B+", color: "#06B6D4" },
                    { icon: Brain, label: "AI Feedback", value: "14", color: "#4F46E5" },
                    { icon: TrendingUp, label: "Readiness", value: "78%", color: "#22C55E" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05] text-center"
                    >
                      <stat.icon
                        className="w-4 h-4 mx-auto mb-1"
                        style={{ color: stat.color }}
                      />
                      <div
                        className="text-lg font-bold font-syne"
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </div>
                      <div className="text-[10px] text-[#71717A]">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
