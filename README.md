# 🌌 Navigator: AI-Powered Incident War Room

Navigator is a state-of-the-art AI-powered incident investigation and war room dashboard designed for SRE and engineering teams. It correlates real-time signals across your entire toolchain—including PagerDuty, GitHub, Datadog, Sentry, Slack, and Linear—by running cross-source SQL queries via **Coral** and generating instant, actionable incident briefs using **Groq (Llama 3.3 70B)** in under a second.

---

## ✨ Features

- **🚀 Blazing Fast Inference**: Leveraging Groq and Llama 3.3 70B to generate root-cause hypotheses, suspect commits, blast radius assessments, and rollback recommendations in under a second.
- **🔌 Unified Coral SQL Queries**: Connects signals across 6 different DevOps and observability tools via one clean SQL interface.
- **📡 Real-Time Updates**: Leverages WebSockets to push active incident updates automatically.
- **🎨 Sleek Modern Interface**: A premium Next.js 15 App Router frontend featuring rich glassmorphism styling, clean dark mode, responsive layouts, and interactive animations powered by Tailwind CSS and Framer Motion.
- **🛠️ Fully Actionable**: Instantly generate professional markdown postmortems, ask context-aware questions to the virtual SRE assistant, post briefs directly to Slack, and create Linear tickets in one click.

---

## 🏗️ Repository Architecture

This project is a monorepo containing two main components:
1. **[`navigator-backend`](file:///C:/Users/11ara/github/Navigator-AI-Incident-War-Room/navigator-backend)**: Express.js server providing API routes, WebSockets, rate limiting, and Groq-powered SRE models.
2. **[`navigator-ui`](file:///C:/Users/11ara/github/Navigator-AI-Incident-War-Room/navigator-ui)**: Next.js frontend providing the visual incident command center.

---

## ⚡ Quick Start (Local Setup)

Follow these steps to get both the frontend and backend running locally in development mode.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A **Groq API Key** (you can get one for free at [console.groq.com](https://console.groq.com))

---

### 2. Backend Setup (`navigator-backend`)

1. Navigate to the backend directory:
   ```bash
   cd navigator-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env.local` file (this is ignored by Git to keep your secrets safe):
   ```env
   # Mandatory: Get a free key at console.groq.com
   GROQ_API_KEY=your_groq_api_key_here

   # Optional: Shared secret between UI and Backend (Defaults to "dev-key" if blank)
   INTERNAL_API_KEY=a21892566d4f45d37a2a5572d35f3b374ccc3b91fe3e12f8a0b7d1d3be726f0e

   # Server Config
   PORT=3001
   NODE_ENV=development
   GROQ_MODEL=llama-3.3-70b-versatile
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will be running at `http://localhost:3001` and WebSocket server on `ws://localhost:3001`.

---

### 3. Frontend Setup (`navigator-ui`)

1. Navigate to the frontend directory:
   ```bash
   cd ../navigator-ui
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   Create a `.env.local` file:
   ```env
   # URL of the navigator-backend
   BACKEND_URL=http://localhost:3001

   # Shared secret matching INTERNAL_API_KEY in the backend
   BACKEND_API_KEY=a21892566d4f45d37a2a5572d35f3b374ccc3b91fe3e12f8a0b7d1d3be726f0e
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The dashboard will be running at `http://localhost:3000`. Open it in your browser to view the incident command center!

---

## 🔧 Operational Modes

### 🔹 Fixtures Mode (Default)
By default, the backend runs in **Fixtures Mode** (`CORAL_LIVE` unset). In this mode, the server uses highly realistic mock SRE incident data and simulated Coral SQL queries. This is ideal for demos and hackathon presentations because **it does not require real PagerDuty, GitHub, or Datadog credentials** to showcase full product capabilities.

### 🔹 Live Mode
To connect the application to real production data:
1. Ensure the `coral` CLI is installed and configured on your system.
2. In `navigator-backend/.env.local`, set:
   ```env
   CORAL_LIVE=true
   ```
3. Set up the respective API tokens for your active providers (PagerDuty, Datadog, GitHub, Sentry, Slack, Linear) in `navigator-backend/.env.local` as described in `.env.example`.

---

## 📡 API Endpoints

All backend endpoints (except `/api/health`) require the `x-api-key` header matching your `INTERNAL_API_KEY`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/api/health` | Backend service health and uptime check |
| **GET** | `/api/incidents` | List active production incidents (simulated or live) |
| **GET** | `/api/investigate/:id` | Run SRE correlation engine and generate incident brief |
| **POST** | `/api/investigate/:id/postmortem` | Generate a comprehensive markdown postmortem |
| **POST** | `/api/investigate/:id/ask` | Chat with the context-aware incident SRE AI |
| **POST** | `/api/slack/post-brief` | Send brief notification directly to the designated Slack channel |
| **GET** | `/api/linear/issues` | Fetch or search associated tickets in Linear |

---

## 🤝 License

MIT License. Developed for modern engineering teams who value robust observability and blazing-fast incident resolution.
