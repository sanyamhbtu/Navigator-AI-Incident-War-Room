"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

// "Try it in 60 seconds" — Coral-style CTA card.
// Now anchored by the coral.png illustration on the right side.

export function DemoCTA() {
  return (
    <section className="py-24 sm:py-32 border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative bg-panel border border-border-strong rounded-md p-8 sm:p-12 overflow-hidden"
        >
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 items-center">
            {/* Left: text + CTAs */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] mb-4">
                Try it in 60 seconds.
              </h2>
              <p className="text-base text-fg-muted leading-relaxed max-w-xl mb-8">
                The demo runs against mock data but exactly the same flow as
                the backend: Coral resolves the JOIN, Groq reads the result,
                the brief streams in field-by-field.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
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
                  className="px-5 py-2.5 text-fg-muted hover:text-fg text-sm transition-colors"
                >
                  Read the docs ↗
                </a>
                <a
                  href="https://github.com/sanyamhbtu/navigator-backend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 text-fg-muted hover:text-fg text-sm transition-colors"
                >
                  GitHub ↗
                </a>
              </div>
            </div>

            {/* Right: coral illustration */}
            <div className="relative flex items-center justify-center lg:justify-end">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/coral.png"
                alt="Coral reef"
                className="w-56 sm:w-64 lg:w-72 h-auto opacity-80"
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
