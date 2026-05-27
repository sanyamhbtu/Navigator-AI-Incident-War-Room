# Navigator — Landing Page UI

The marketing landing page + interactive demo for [Navigator](../README.md), built for the **Pirates of the Coral-bean** hackathon (Coral, 2026).

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **Tailwind CSS v4** (CSS-first `@theme` tokens)
- **Framer Motion** for hero / scroll / typewriter animations
- **Lucide React** icons (GitHub mark inlined as SVG since lucide v1.16 dropped brand icons)

## Run locally

```bash
npm install
npm run dev     # → http://localhost:3000
```

## Deploy

```bash
# Vercel (one command, zero config — vercel.json not needed)
npx vercel
# Or push to GitHub and import at vercel.com/new
```

The page is fully static-prerendered (`○ (Static)` in the build output) — no API routes, no server runtime required. Hosts cleanly on Vercel, Netlify, Cloudflare Pages, or any static host.

## What's in here

| Section | File | Notes |
|---|---|---|
| Top nav | `components/Nav.tsx` | Sticky, glass-blur on scroll |
| Hero | `components/Hero.tsx` | Headline + `AnimatedSQL` showpiece |
| Animated SQL | `components/AnimatedSQL.tsx` | Typewriter of the master JOIN query — the literal demo of "6 sources in 1 query" |
| Stats strip | `components/Stats.tsx` | 6 / 1 / 12s / $10k+ |
| Before vs. After | `components/BeforeAfter.tsx` | 30 min of tabs vs. 12 seconds |
| How it works | `components/HowItWorks.tsx` | 4-step pipeline diagram |
| Live demo | `components/LiveDemo.tsx` | Interactive — click an incident, watch the brief generate |
| Sources | `components/Sources.tsx` | 6-source grid + tech stack pills |
| Footer | `components/Footer.tsx` | Project + hackathon links |

Mock data for the live demo lives in `lib/mockData.ts`. The incident, AI brief, commits, metrics, and Sentry errors are all designed to tell one coherent story (INC-042: payments-api / Stripe webhook break / Rahul / rollback recommended) so judges can follow it without explanation.

## Color tokens

GitHub-Dark inspired, defined in `app/globals.css` via Tailwind v4 `@theme`:

```
bg / panel / panel-2 / hover / border
blue / green / yellow / orange / red / purple / pink / coral
fg / fg-muted / fg-subtle
```

Use directly as utilities: `bg-panel`, `text-fg-muted`, `border-coral/30`, etc.

## License

MIT — same as the parent project.
