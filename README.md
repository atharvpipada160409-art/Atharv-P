# CashFlowIQ — AI-Powered Cash Flow Management & Financial Intelligence Platform

CashFlowIQ is an end-to-end, production-grade, AI-powered financial intelligence platform engineered for individuals, freelancers, and small-to-medium businesses (SMBs). It eliminates cash flow unpredictability and financial vulnerability through dynamic running ledgers, 30/60/90-day predictive balance projections, interactive "What-If" scenario simulations, statistical burn anomaly alerts, and structured CFO-grade advisory coaching powered by Google's Gemini 2.5 Flash model.

---

## 🌟 Key Capabilities

1. **Dynamic Ledger & Multi-Vault Management:**
   - Real-time tracking of operating accounts, yield reserves, and merchant clearing pools.
   - Running balance calculations, categorization, and scheduled recurring transaction tracking.
2. **Predictive Cash Flow Forecasting (30, 60, 90 Days):**
   - Algorithmic daily and monthly balance projections based on historical daily velocity and scheduled recurring commitments.
   - Interactive Recharts area visualization with confidence bounds and zero-balance insolvency lines.
3. **AI Financial Advisory & Health Audits:**
   - Powered by `@google/genai` utilizing the `gemini-2.5-flash` model with strict JSON schema response compliance (`HealthAuditResponseSchema`).
   - Interactive virtual CFO chat providing contextual strategic recommendations directly cited from live ledger metrics.
4. **Burn Rate & Anomaly Detection:**
   - Real-time monthly burn rate and runway day tracking.
   - Statistical spike detection (>2.0 standard deviations or >15% of monthly spend) and category surge alerts (>40% MoM increase).
5. **Scenario Planning ("What-If" Modeling):**
   - Simulate capital allocation decisions (new hires, hardware outlays, debt facilities, revenue dips) and measure immediate impact on operational runway.
6. **Runway Safety Thresholds & Emergency Playbooks:**
   - User-configurable safety thresholds (default: 30 days) with automated operational playbooks for emergency cost preservation.
7. **Strict Row-Level Security & Isolation:**
   - Server-side JWT authorization middleware verifying every request.
   - Every database query strictly scoped with parameterized `WHERE user_id = $1`.

---

## 🏗️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts.
- **Backend:** Node.js, Express.js (TypeScript), Helmet, CORS, JWT, Bcrypt.js, Zod.
- **AI Model:** Google Gemini 2.5 Flash (`@google/genai`).
- **Database:** PostgreSQL (`pg`) with automatic embedded isolated fallback engine for zero-setup execution.

---

## 🚀 Getting Started

### 1. Installation
Install dependencies across root, server, and client:
```bash
npm run install:all
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cashflowiq
JWT_SECRET=super-secret-jwt-key-replace-in-production-cashflowiq-2025
GEMINI_API_KEY=your-gemini-api-key-here
SESSION_SECRET=super-secret-session-key-cashflowiq-2025
CLIENT_ORIGIN=http://localhost:5173
```

> **Note:** If `DATABASE_URL` is unavailable or PostgreSQL is not running locally, CashFlowIQ automatically activates its resilient embedded SQL storage engine without crashing. If `GEMINI_API_KEY` is not yet configured, the system seamlessly applies its algorithmic financial diagnostics engine.

### 3. Launching Application
Run both frontend and backend concurrently:
```bash
npm run dev
```

Or run separately:
```bash
# Terminal 1 (Backend on http://localhost:5000)
npm run dev:server

# Terminal 2 (Frontend on http://localhost:5173)
npm run dev:client
```

### 4. Pre-Configured Demo Account
- **Email:** `demo@cashflowiq.com`
- **Password:** `password123`
*(A quick "Auto-Fill Demo" button is available directly on the `/auth/login` page)*

---

## 🔒 Security & Data Isolation
- Parameterized SQL queries eliminate SQL injection vulnerabilities.
- Data isolation is strictly enforced at the query level using authenticated user tokens.
- Sensitive environment variables and error traces are masked from client responses.
"# Atharv_trial" 
