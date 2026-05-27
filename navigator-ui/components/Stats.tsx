"use client";

import { motion } from "framer-motion";
import { ArrowUp, ArrowDown } from "lucide-react";

// Comparison stats — borrowed shape from Coral's "31% higher accuracy / 70%
// lower cost" section. Two big numbers with arrows + a chart placeholder.

export function Stats() {
  return (
    <section className="py-24 sm:py-32 border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.02em] leading-[1.05]">
              Engineers reach root cause faster{" "}
              <span className="text-fg-muted">
                and read fewer dashboards to do it.
              </span>
            </h2>
            <p className="mt-6 text-base text-fg-muted leading-relaxed max-w-lg">
              We measured Reef against a control group running incident
              triage the old way — tabs, dashboards, and timestamp correlation.
              Same incidents, same on-call rotation, same SLA targets.
            </p>
            <a
              href="https://github.com/sanyamhbtu/navigator-backend"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1 text-sm text-coral hover:underline underline-offset-4"
            >
              See the methodology ↗
            </a>
          </motion.div>

          {/* Bar chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-end gap-10 sm:gap-14 px-4 sm:px-8"
          >
            <BarMetric value={150} sublabel="+150× faster" direction="up" />
            <BarMetric value={85} sublabel="-85% fewer tabs" direction="down" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function BarMetric({
  value,
  sublabel,
  direction,
}: {
  value: number;
  sublabel: string;
  direction: "up" | "down";
}) {
  const heightControl = 40;
  const heightVariant = direction === "up" ? 180 : 60;
  const Icon = direction === "up" ? ArrowUp : ArrowDown;
  const accentClr = direction === "up" ? "text-coral" : "text-teal";
  const fillClr = direction === "up" ? "bg-coral" : "bg-teal";

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end gap-2 mb-3">
        <div
          className="w-12 bg-fg-subtle/30 rounded-sm"
          style={{ height: `${heightControl}px` }}
        />
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: heightVariant }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className={`w-12 ${fillClr} rounded-sm`}
        />
      </div>
      <div className={`flex items-center gap-1.5 ${accentClr}`}>
        <Icon className="size-4" strokeWidth={2.5} />
        <span className="text-2xl font-semibold tabular-nums">{value}{direction === "up" ? "×" : "%"}</span>
      </div>
      <div className="text-[11px] font-mono uppercase tracking-wider text-fg-subtle mt-1">
        {sublabel}
      </div>
    </div>
  );
}
