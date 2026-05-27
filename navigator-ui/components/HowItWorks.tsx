"use client";

import { motion } from "framer-motion";

// Numbered architecture steps — same shape as Coral's "Turn every data source
// into a table. Query them together." section. Left column has a SQL example,
// right column has the 4 numbered items with one highlighted.

const STEPS = [
  {
    n: "01",
    title: "Alert fires",
    body: "PagerDuty triggers. Webhook (or 60s cron poll) hands the incident ID to the backend.",
  },
  {
    n: "02",
    title: "Coral resolves the JOIN",
    body: "One SQL across six live APIs. Coral handles auth, pagination, and rate limits below deck.",
  },
  {
    n: "03",
    title: "Groq reads the result",
    body: "Llama 3.3 70B on Groq, JSON mode. Returns structured fields: root cause, suspect commit, action, who to page.",
  },
  {
    n: "04",
    title: "Brief lands where you work",
    body: "Posts to #incidents with structured fields. Linear ticket auto-created with action items.",
    highlight: true,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 sm:py-32 border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-3xl sm:text-5xl font-medium tracking-[-0.02em] leading-[1.05] max-w-3xl mb-16"
        >
          Turn every alert into a brief.{" "}
          <span className="text-fg-muted">Read them together.</span>
        </motion.h2>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Left: example output */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-zinc-950 border border-border-strong rounded-md overflow-hidden"
          >
            <div className="border-b border-border px-4 py-2.5 flex items-center justify-between">
              <span className="text-[11px] font-mono text-fg-subtle">
                navigator.brief.json
              </span>
              <span className="text-[11px] font-mono text-coral">claude</span>
            </div>
            <pre className="px-5 py-4 font-mono text-[12px] leading-[1.7] text-zinc-300 overflow-x-auto">
              <code>
{`{
  `}<span className="text-coral">{`"root_cause"`}</span>{`: `}<span className="text-fg-muted">{`"Deploy a8f2c39 by @rahul
    removed Stripe signature verification at
    02:09 UTC. Error rate spiked 470× within
    3 minutes of the push."`}</span>{`,
  `}<span className="text-coral">{`"suspect_commit"`}</span>{`: { sha: "a8f2c39" },
  `}<span className="text-coral">{`"blast_radius"`}</span>{`: `}<span className="text-fg-muted">{`"all payment endpoints"`}</span>{`,
  `}<span className="text-coral">{`"recommended_action"`}</span>{`: `}<span className="text-fg-muted">{`"revert"`}</span>{`,
  `}<span className="text-coral">{`"who_to_page"`}</span>{`: [`}<span className="text-fg-muted">{`"@rahul"`}</span>{`],
  `}<span className="text-coral">{`"confidence"`}</span>{`: `}<span className="text-fg-muted">{`"High"`}</span>{`
}`}
              </code>
            </pre>
          </motion.div>

          {/* Right: numbered steps */}
          <div className="space-y-1">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className={`grid grid-cols-[auto_1fr] gap-5 p-5 rounded-md border transition-colors ${
                  step.highlight
                    ? "bg-panel border-coral/40"
                    : "border-transparent hover:bg-panel/50"
                }`}
              >
                <span
                  className={`font-mono text-sm tabular-nums shrink-0 pt-0.5 ${
                    step.highlight ? "text-coral" : "text-fg-subtle"
                  }`}
                >
                  {step.n}
                </span>
                <div>
                  <h3
                    className={`text-base font-semibold tracking-tight mb-1.5 ${
                      step.highlight ? "text-coral" : "text-fg"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm text-fg-muted leading-relaxed">
                    {step.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
