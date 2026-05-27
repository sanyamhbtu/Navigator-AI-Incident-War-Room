"use client";

import { motion } from "framer-motion";

// Side-by-side: real SQL on the left, query result on the right.
// Adapted from Coral's "Give agents the context that changes outcomes" section.

const TABS = [
  { id: "coding", label: "Coding agents", active: false },
  { id: "sre", label: "AI SRE", active: true },
  { id: "security", label: "Security & compliance", active: false },
  { id: "support", label: "Customer escalations", active: false },
  { id: "ops", label: "Assistants for internal ops", active: false },
];

export function Sources() {
  return (
    <section className="py-24 sm:py-32 border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-5xl font-medium tracking-[-0.02em] leading-[1.05] max-w-3xl mb-12"
        >
          Give the agent the context that{" "}
          <span className="text-fg-muted">changes the outcome.</span>
        </motion.h2>

        <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-12">
          {/* Tabs on the left */}
          <div className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                  tab.active
                    ? "bg-panel text-fg font-semibold"
                    : "text-fg-muted hover:text-fg hover:bg-panel/50"
                }`}
                disabled
              >
                {tab.active && <span className="size-1.5 rounded-full bg-coral" />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* SQL + Result example */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-950 border border-border-strong rounded-md overflow-hidden"
          >
            <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-fg-subtle">
                investigate INC-042
              </span>
              <span className="text-[11px] font-mono text-coral">3 queries · 11.8s</span>
            </div>
            <pre className="px-5 py-4 font-mono text-[12px] leading-[1.7] text-zinc-300 overflow-x-auto">
              <code>
{`-- Suspect commits in the 30m pre-incident window
`}<span className="text-coral">{`SELECT `}</span>{`sha, author, message, pushed_at,
       EXTRACT(EPOCH FROM (created_at - pushed_at))/60
         AS minutes_before
`}<span className="text-coral">{`FROM `}</span>{`github.commits
`}<span className="text-coral">{`WHERE `}</span>{`repository = `}<span className="text-fg-muted">{`'payments-api'`}</span>{`
  `}<span className="text-coral">{`AND `}</span>{`pushed_at >= `}<span className="text-fg-muted">{`'2026-05-26 02:14'`}</span>{` - `}<span className="text-coral">{`INTERVAL `}</span><span className="text-fg-muted">{`'30m'`}</span>{`
`}<span className="text-coral">{`ORDER BY `}</span>{`pushed_at `}<span className="text-coral">{`DESC`}</span>{`;`}
              </code>
            </pre>
            <div className="border-t border-border bg-zinc-900/40 px-5 py-3">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[11px] font-mono text-fg-subtle mb-2">
                <span>sha</span>
                <span>author</span>
                <span>minutes_before</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[12px] font-mono py-1 border-t border-border-muted">
                <span className="text-coral">a8f2c39</span>
                <span className="text-fg">rahul</span>
                <span className="text-fg tabular-nums">5</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[12px] font-mono py-1 border-t border-border-muted text-fg-muted">
                <span>7b1d4f2</span>
                <span>priya</span>
                <span className="tabular-nums">48</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-[12px] font-mono py-1 border-t border-border-muted text-fg-muted">
                <span>3c9e8a1</span>
                <span>rahul</span>
                <span className="tabular-nums">96</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
