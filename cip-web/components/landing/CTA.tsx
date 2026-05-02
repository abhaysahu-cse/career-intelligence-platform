"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2, Star } from "lucide-react";

const perks = [
  "Free forever plan — no credit card required",
  "Full access to all 4 AI modules",
  "Unlimited AI interview practice in beta",
  "Export reports and certificates",
];

const testimonials = [
  {
    name: "Priya S.",
    role: "Got hired at Google",
    text: "CIP's AI feedback was brutally honest — and that's exactly what I needed. 3 weeks later, offer from Google.",
    score: 5,
    color: "#4F46E5",
  },
  {
    name: "Rahul M.",
    role: "Placed at Amazon",
    text: "The skill gap analysis alone saved me months of guesswork. I knew exactly what to study.",
    score: 5,
    color: "#06B6D4",
  },
  {
    name: "Sneha K.",
    role: "Joined a Series B startup",
    text: "I went from blanking on behavioral questions to answering fluently. Night and day difference.",
    score: 5,
    color: "#22C55E",
  },
];

export default function CTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSubmitted(true);
  };

  return (
    <section id="cta" className="py-28 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#020617] pointer-events-none" />

      {/* Glowing orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#4F46E5]/10 to-[#06B6D4]/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-5 mb-20"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-xl"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(t.score)].map((_, j) => (
                  <Star
                    key={j}
                    className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]"
                  />
                ))}
              </div>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: t.color }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {t.name}
                  </div>
                  <div className="text-xs" style={{ color: t.color }}>
                    {t.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Main CTA block */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4F46E5]/10 border border-[#4F46E5]/25 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-xs font-semibold text-[#4F46E5] uppercase tracking-wider">
              Start Free Today
            </span>
          </motion.div>

          <h2 className="font-syne text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
            Your AI Career Coach
            <br />
            <span className="text-gradient">Is Waiting</span>
          </h2>

          <p className="text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10">
            Join thousands of candidates who stopped guessing and started
            landing offers with AI-powered precision.
          </p>

          {/* Perks */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {perks.map((perk) => (
              <div
                key={perk}
                className="flex items-center gap-2 text-sm text-[#94A3B8]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                {perk}
              </div>
            ))}
          </div>

          {/* Email form */}
          {!submitted ? (
            <motion.div
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-6"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <motion.a
                href="/auth/signup"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#06B6D4] text-white font-semibold text-sm hover:shadow-xl hover:shadow-[#4F46E5]/30 transition-all whitespace-nowrap"
              >
                Start Free Interview
                <ArrowRight className="w-4 h-4" />
              </motion.a>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 py-4 mb-6"
            >
              <CheckCircle2 className="w-6 h-6 text-[#22C55E]" />
              <span className="text-white font-semibold">
                You're in! We'll be in touch very soon.
              </span>
            </motion.div>
          )}

          <p className="text-xs text-[#64748B]">
            No spam, ever. Unsubscribe anytime.{" "}
            <a href="#" className="underline hover:text-[#94A3B8]">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
