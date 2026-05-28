"use client";

import { motion } from "framer-motion";
import { ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import Link from "next/link";

// Coral-inspired hero: full-bleed coral Navigator photograph behind the headline,
// dark warm overlay for legibility, code snippet floating on the right,
// strikethrough word in the headline, and a stats bar at the bottom.
// Hybrid: the bold borders/shadows come from neubrutalism.

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden border-b border-border"
    >
      {/* Coral reNavigatoref photograph as full-bleed background */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=2000&q=80&auto=format&fit=crop"
          alt="Coral Navigator"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
        {/* Warm dark overlay — left dense, right slightly less so the code panel is over a darker patch */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/40 via-bg/85 to-bg" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/95 via-bg/70 to-bg/85" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-32 pb-16 sm:pt-40 sm:pb-20">
        {/* Kicker — restrained, no chip chrome */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-[13px] text-fg-muted font-medium tracking-tight"
        >
          <span className="text-coral">Navigator</span>
          <span className="mx-2 text-fg-subtle">/</span>
          <span>An AI Incident War Room, built for the Coral Hackathon</span>
        </motion.div>

        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-12 items-start">
          {/* Left: headline + CTAs */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="text-5xl sm:text-6xl lg:text-7xl leading-[1.0] tracking-[-0.03em] font-medium"
            >
              From <span className="strike-thick text-fg-muted">tab-switching</span>{" "}
              to root cause
              <br />
              <span className="text-coral">in 12 seconds.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-7 text-lg text-fg-muted leading-[1.55] max-w-lg"
            >
              Navigator runs one Coral SQL query across PagerDuty, GitHub,
              Datadog, Sentry, Slack, and Linear. Groq reads the JOIN. Your
              on-call gets a brief — no ETL, no glue code, no dashboards.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-9 flex items-center gap-5 flex-wrap"
            >
              <Link
                href="/demo"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-coral text-bg rounded-md font-semibold text-sm hover:bg-coral-soft transition-colors brutal-shadow-sm brutal-hover"
              >
                Open the demo
                <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="https://github.com/sanyamhbtu/navigator-backend"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-fg-muted hover:text-fg underline-offset-4 hover:underline transition-colors"
              >
                Read the source ↗
              </a>
            </motion.div>
          </div>

          {/* Right: code snippet panel — floating like Coral's hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="lg:mt-6"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>

      {/* Bottom stats bar — like Coral's "31% higher accuracy" strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="relative border-t border-border bg-bg/80 backdrop-blur"
      >
        <div className="max-w-6xl mx-auto px-6 py-6 grid sm:grid-cols-[1fr_auto_auto] gap-6 items-center">
          <p className="text-sm text-fg-muted">
            With Navigator, your on-call gets to root cause
          </p>
          <StatChip direction="up" value="150×" label="faster than tabs" />
          <StatChip direction="down" value="6→1" label="tools to read" />
        </div>
      </motion.div>
    </section>
  );
}

function StatChip({
  direction,
  value,
  label,
}: {
  direction: "up" | "down";
  value: string;
  label: string;
}) {
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  const color = direction === "up" ? "text-coral" : "text-teal";
  return (
    <div className="flex items-center gap-3">
      <Icon className={`size-5 ${color}`} strokeWidth={2.5} />
      <div>
        <div className="text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </div>
        <div className="text-[11px] font-mono uppercase tracking-wider text-fg-subtle">
          {label}
        </div>
      </div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="relative">
      {/* Ambient coral glow */}
      <div className="absolute -inset-6 bg-coral/8 rounded-[32px] blur-3xl pointer-events-none" />

      {/* Outer neumorphic shell */}
      <div className="relative neumorph-card p-4 backdrop-blur-sm">
        {/* Window chrome — soft and inline, no harsh border */}
        <div className="flex items-center justify-between px-2 pb-3 mb-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red/50" />
            <span className="size-2.5 rounded-full bg-yellow/50" />
            <span className="size-2.5 rounded-full bg-green/50" />
          </div>
          <span className="text-[11px] font-mono text-fg-subtle">
            Navigator · war-room
          </span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-coral">
            <span className="size-1.5 rounded-full bg-coral pulse-dot" />
            live
          </div>
        </div>

        {/* Incident header — raised pill */}
        <div className="neumorph-raised px-5 py-4 mb-3">
          <div className="flex items-center gap-2.5 mb-1.5 text-[11px] font-mono">
            <span className="px-2 py-0.5 bg-red/15 rounded-full text-red font-semibold tracking-wider">
              P1
            </span>
            <span className="text-fg-subtle">INC-042</span>
            <span className="text-fg-subtle">·</span>
            <span className="text-fg-subtle">02:14 UTC</span>
            <span className="text-fg-subtle">·</span>
            <span className="text-coral">11.8s</span>
          </div>
          <div className="text-sm font-semibold text-fg leading-snug">
            payments-api 5xx error rate spike
          </div>
          <div className="text-[11px] font-mono text-fg-subtle mt-1">
            payments-api · service
          </div>
        </div>

        {/* Root cause — coral-tinted neumorphic surface */}
        <div className="neumorph-coral px-5 py-4 mb-3">
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-coral font-semibold">
              ◆ Root cause
            </div>
            <div className="text-[10px] font-mono text-fg-subtle">
              high confidence
            </div>
          </div>
          <p className="text-[13px] leading-[1.55] text-fg">
            Deploy <code className="text-coral font-mono">a8f2c39</code> by{" "}
            <span className="font-mono text-fg-muted">@rahul</span> removed
            Stripe signature verification at 02:09. Error rate spiked{" "}
            <span className="text-coral font-semibold">470×</span> within 3
            minutes.
          </p>
        </div>

        {/* Action + Page — twin raised cards */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="neumorph-raised px-4 py-3.5">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-2">
              Action
            </div>
            <div className="text-[13px] text-fg font-medium">
              Revert <code className="text-coral font-mono">a8f2c39</code>
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-coral">
              <span className="size-1.5 rounded-full bg-coral" /> rollback
            </div>
          </div>
          <div className="neumorph-raised px-4 py-3.5">
            <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-fg-subtle mb-2">
              Page
            </div>
            <div className="flex flex-col gap-0.5 text-[12px] font-mono">
              <span className="text-fg">@rahul</span>
              <span className="text-fg-muted">@payments-oncall</span>
            </div>
          </div>
        </div>

        {/* Source health — inset footer pill */}
        <div className="neumorph-inset px-4 py-2.5 flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-2 text-fg-subtle">
            <span className="text-coral">✓</span>
            <span>6/6 sources joined · via coral.sql</span>
          </div>
          <div className="flex items-center gap-1.5">
            {["pagerduty", "github", "datadog", "sentry", "slack", "linear"].map(
              (s) => (
                <span
                  key={s}
                  title={s}
                  className="size-1.5 rounded-full bg-coral/70"
                  style={{
                    boxShadow:
                      "0 0 8px rgba(255,107,61,0.4), inset 0 1px 0 rgba(255,180,140,0.3)",
                  }}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
