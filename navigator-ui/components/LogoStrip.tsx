"use client";

import { motion } from "framer-motion";

// "Works with the tools you already use" — borrowed directly from Coral's site.
// Text-only chips (no real logos for trademark reasons) but with the same vibe.

const TOOLS = [
  "PagerDuty",
  "GitHub",
  "Datadog",
  "Sentry",
  "Slack",
  "Linear",
  "OpenTelemetry",
  "LaunchDarkly",
  "Stripe",
];

export function LogoStrip() {
  return (
    <section id="stack" className="py-12 sm:py-16 border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-xs font-mono uppercase tracking-[0.2em] text-fg-subtle text-center mb-8"
        >
          Works with the tools you already use
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4"
        >
          {TOOLS.map((tool, i) => (
            <span
              key={tool}
              className="text-fg-muted text-lg font-medium"
              style={{ opacity: 1 - i * 0.05 }}
            >
              {tool}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
