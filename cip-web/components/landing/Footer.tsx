"use client";

import { motion } from "framer-motion";
import { Brain, Twitter, Github, Linkedin, Heart } from "lucide-react";

const footerLinks = {
  Product: ["Features", "How It Works", "Demo", "Pricing", "Roadmap"],
  Company: ["About", "Blog", "Careers", "Press", "Contact"],
  Resources: ["Documentation", "API", "Community", "Status", "Changelog"],
  Legal: ["Privacy", "Terms", "Security", "GDPR", "Cookies"],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] relative">
      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4F46E5]/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top section */}
        <div className="grid md:grid-cols-5 gap-12 mb-12">
          {/* Brand col */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#06B6D4] flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-syne text-xl font-bold text-gradient-primary">
                CIP
              </span>
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed mb-5">
              AI-powered career intelligence platform for serious candidates.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Twitter, href: "#" },
                { Icon: Github, href: "#" },
                { Icon: Linkedin, href: "#" },
              ].map(({ Icon, href }) => (
                <motion.a
                  key={href + Icon.name}
                  href={href}
                  whileHover={{ scale: 1.15, y: -2 }}
                  className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#64748B] hover:text-white hover:border-white/20 transition-colors"
                >
                  <Icon className="w-3.5 h-3.5" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4">
                {category}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[#64748B]">
            © 2026 CIP. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-sm text-[#64748B]">
            Built with{" "}
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
            </motion.span>{" "}
            and AI for ambitious candidates
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono-jetbrains text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
