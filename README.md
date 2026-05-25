# Navigator

AI-powered incident investigation for SRE teams. One Coral SQL query across PagerDuty, GitHub, Datadog, Sentry, and Slack — Claude turns it into an actionable brief in under 15 seconds.

## What it does

When a production incident fires, Navigator correlates signals across all your tools automatically and generates a root cause hypothesis, suspect commit, blast radius assessment, and rollback recommendation — without your engineer opening a single tab.

## Stack

- **Coral** — cross-source SQL joins across 6 tools
- **Claude** — AI incident brief + postmortem generation
- **Node.js + Express** — REST API + WebSocket server
- **PagerDuty** — incident source of truth
- **Datadog** — metrics and logs
- **GitHub** — commit and deployment correlation
- **Sentry** — error correlation
- **Slack** — context + automated posting
- **Linear** — automatic issue creation

## Repos

- **Backend** — [`navigator-backend`](https://github.com/yourusername/navigator-backend)
- **Frontend** — [`navigator-ui`](https://github.com/yourusername/navigator-ui)

## Getting started

```bash
git clone https://github.com/sanyamhbtu/navigator-backend
cd navigator-backend
npm install
cp .env.example .env
```

Fill in `.env`, then:

```bash
coral source add pagerduty
coral source add github
coral source add datadog
coral source add slack
coral source add sentry
coral source add linear

npm run dev
```

## Environment variables

```env
PORT=3001
INTERNAL_API_KEY=

ANTHROPIC_API_KEY=
PAGERDUTY_API_KEY=
DATADOG_API_KEY=
DATADOG_APP_KEY=
GITHUB_TOKEN=
GITHUB_ORG=
SLACK_BOT_TOKEN=
SLACK_INCIDENT_CHANNEL=#incidents
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
LINEAR_API_KEY=
LINEAR_TEAM_ID=
```

## API

All endpoints require `x-api-key` header except `/api/health`.

```
GET  /api/health
GET  /api/incidents
GET  /api/investigate/:id
GET  /api/investigate/:id?post_slack=true&create_linear=true
POST /api/investigate/:id/postmortem
POST /api/investigate/:id/ask
POST /api/slack/post-brief
GET  /api/linear/issues
```
## Frontend

Built with React + Vite. Dark glassmorphism UI with real-time WebSocket updates.

```bash
git clone https://github.com/yourusername/navigator-ui
cd navigator-ui
npm install
```

Create `.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_API_KEY=your_internal_api_key
```

```bash
npm run dev
```

WebSocket on `ws://localhost:3001` — pushes `INCIDENTS_UPDATE` events every 60 seconds.

## License

MIT
