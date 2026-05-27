"use client";

import { motion } from "framer-motion";
import { Lock, Key, Gauge, Crosshair } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// "Built for production agent workloads" — Coral's 4-column production-grade
// feature cards. We translate to Reef's incident triage capabilities.

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Lock,
    title: "Read-only by design",
    body: "Reef only reads from your APIs. No writes, no destructive operations. Safe to point at production.",
  },
  {
    icon: Key,
    title: "Permissions that fit on-call",
    body: "Scoped tokens, per-source credentials. The agent sees only what your incident channel sees — nothing more.",
  },
  {
    icon: Gauge,
    title: "Cached and rate-aware",
    body: "Groq's sub-second inference, query caching in Coral. Repeat investigations cost <0.1× and run in <0.5s.",
  },
  {
    icon: Crosshair,
    title: "Tuned for high-signal triage",
    body: "Tight timestamp windows. Confidence scoring on every brief. Suspect commits ranked by recency, not chance.",
  },
];

export function BeforeAfter() {
  return (
    <section className="py-24 sm:py-32 border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-5xl font-medium tracking-[-0.02em] leading-[1.05] max-w-3xl mb-14"
        >
          Built for real incident workflows.{" "}
          <span className="text-fg-muted">Not for demos.</span>
        </motion.h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="bg-panel border border-border rounded-md p-6 hover:border-border-strong transition-colors"
              >
                <div className="size-9 bg-bg border border-border rounded-md flex items-center justify-center mb-4">
                  <Icon className="size-4 text-coral" strokeWidth={1.75} />
                </div>
                <h3 className="font-semibold text-base text-fg mb-2 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-sm text-fg-muted leading-relaxed">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
