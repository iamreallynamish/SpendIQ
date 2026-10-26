# SpendIQ — Family Financial Dashboard

A standalone, customizable personal and family finance application built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Recharts**.

SpendIQ is designed for multi-currency family expense tracking (e.g., student in Japan on an ICICI Bank Forex Prepaid Card in JPY, managed by parents in India via an Axis Bank Credit Card in INR). It features dual-role permissions (Dad Admin vs. Son Viewer), smart multi-format bank SMS parsing, daily billing calendar breakdowns, automated budget & burn rate forecasting, and multi-device real-time cloud synchronization.

---

## 🌟 Key Features

1. **Dual-Role Session Management**:
   - **Dad (Admin)**: Full control over card balances, reload dates, direct transaction adjustments, category assignment, and shared cloud database management.
   - **Son (Viewer)**: Real-time visibility into available forex balances, daily burn rates, fixed bills, and conbini spend.

2. **Multi-Currency Engine**:
   - Primary currencies: **JPY (Japanese Yen)**, **INR (Indian Rupee)**, and **USD**.
   - Dynamic conversion using real parity ratios (`1 INR ≈ 1.8 JPY`, `1 USD ≈ 152 JPY`).

3. **Smart Bank SMS Parser**:
   - Parses SMS alerts from **ICICI Bank** and **Axis Bank** in diverse date formats (`DD-MMM-YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`, timestamps).
   - Automatically detects merchants (`7-Eleven`, `FamilyMart`, `Lawson`, `Mobile Suica`, `Uniqlo`, `Bic Camera`, etc.).
   - Auto-categorizes expenses across 11 spending buckets (Convenience Store, Food & Dining, Clothing & Apparel, Travel & Transit, Cash Withdrawal, Furniture & Home, Electronics, etc.).
   - Live editable staging table: review, amend, or adjust merchant name, category, card, and available balances before committing to the ledger.
   - Latest-by-date balance anchoring: updates card balances accurately from SMS statements.

4. **Interactive Financial Visualizations**:
   - Donut & pie category distribution chart powered by **Recharts**.
   - Allowance and burn rate calculator with dynamic pocket allowance slider (¥20,000 – ¥200,000) and daily safe burn rate.

5. **Daily Spend Calendar & Day Inspector**:
   - Interactive monthly calendar showing exact daily spend on each date cell.
   - Click-to-inspect drawer revealing every merchant transaction on that day with direct edit triggers.
   - Custom calendar bill notes.

6. **Next Month Plan & Set-Aside Forecast**:
   - 4 KPI forecast widgets: Daily Baseline Total (`¥500 × 30 days = ¥15,000`), Planned Costs Added, Total Needed for Month, and ICICI Reload Top-Up shortfall.
   - 5-field inline expense entry strip.
   - Interactive table with "Set Aside / Skipped" toggles.

7. **Savings Plan & Equity Portfolio**:
   - Month-by-month savings comparisons (September 2026, October 2026, November 2026) with exact net saved figures.
   - Equity holdings tracker with ticker, share count, market value, and unrealized gains.

8. **Shared Cloud Database & Sync**:
   - Default auto-saving to browser `localStorage` (`spendiq_family_db_v3`).
   - Real-time cloud sync with any Firebase Realtime Database or REST JSON endpoint.
   - Instant 1-click **Family Sync Code** (base64 JSON snapshot) for backup or sharing over messaging apps.
   - Webhook URL endpoint support for iOS Shortcuts Automation and Android SMS Forwarders.

---

## 🏗️ Project Architecture

```
/
├── index.html                   # HTML entry point with Plus Jakarta Sans & JetBrains Mono
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & scripts
├── vite.config.ts               # Vite configuration with React & Tailwind plugins
├── tsconfig.json                # TypeScript compiler configuration
└── src/
    ├── main.tsx                 # React entry point
    ├── App.tsx                  # Main layout container & view router
    ├── index.css                # Global Tailwind CSS, obsidian gradients & theme tokens
    ├── types/
    │   └── finance.ts           # Core TypeScript types & data contracts
    ├── constants/
    │   └── initialData.ts       # Verified default ledger & seed data
    ├── context/
    │   └── FinanceContext.tsx   # Global finance state, persistence, sync, and CRUD
    ├── utils/
    │   ├── currency.ts          # Multi-currency conversions & tabular formatters
    │   └── smsParser.ts         # Regex SMS extraction, merchant normalization, categorization
    └── components/
        ├── common/
        │   ├── Header.tsx       # Top bar (month filter, currency switcher, quick actions)
        │   ├── Sidebar.tsx      # Navigation drawer, role switcher & user profile
        │   └── Toast.tsx        # Floating notification banner
        ├── dashboard/
        │   ├── BankCard.tsx     # ICICI Forex & Axis Bank cards
        │   ├── TransactionsTable.tsx # Transaction ledger with filters & actions
        │   ├── FixedExpensesSection.tsx # Recurring expense cards with toggles
        │   └── DashboardView.tsx # Aggregated main dashboard
        ├── subscriptions/
        │   └── SubscriptionsView.tsx # Active digital mandates & subscriptions
        ├── expenses/
        │   └── ExpensesView.tsx # Recharts pie visualization & burn rate calculator
        ├── calendar/
        │   └── BillingCalendarView.tsx # Daily calendar grid & day inspector drawer
        ├── nextmonth/
        │   └── NextMonthView.tsx # 4 KPI widgets & next-month forecast planner
        ├── savings/
        │   └── SavingsView.tsx  # Monthly savings math & equity portfolio
        ├── integrations/
        │   └── IntegrationsView.tsx # Apple Pay, Suica & cloud database guide
        └── modals/
            ├── BulkSmsModal.tsx # Multi-SMS parser & editable staged preview
            ├── CardBalancesModal.tsx # Admin card balance & billing date override
            ├── EditTransactionModal.tsx # Full transaction field editor
            ├── CloudDbModal.tsx # Firebase DB sync, webhook URL & Family Sync Code
            └── AddFixedItemModal.tsx # Modal to add fixed expenses or stock holdings
```

---

## 🚀 Getting Started & Local Development

### 1. Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### 2. Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd spendiq-finance-tracker

# Install dependencies
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```
This produces a compiled, optimized static bundle in the `dist/` directory ready for deployment.

---

## ☁️ Deployment to Vercel or GitHub Pages

### Deploy to Vercel (1-Click)
1. Push this repository to GitHub.
2. In the [Vercel Dashboard](https://vercel.com/new), select **Import Project** and pick your repository.
3. Configure the build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Click **Deploy**. Your app is immediately live with HTTPS.

### Deploy as a Static Site (GitHub Pages / Netlify / Cloudflare Pages)
Run `npm run build` and upload the generated `dist/` folder to any static hosting provider.

---

## 🔄 Data Migration & Backup Instructions

### Migrating from the Google Sites Embedded Tracker
1. **Initial Seed**: SpendIQ loads pre-configured with the verified October 2026 transactions from your Google Sites embed.
2. **Transferring In-Flight Data via Family Sync Code**:
   - In the Google Sites version, open **Cloud DB & Sync** and copy the **Family Sync Code**.
   - In your new standalone app, open **Cloud DB & Sync**, paste the code into the text area, and click **Load Sync Code & Save**.
3. **Connecting Shared Firebase Realtime Database**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a free project.
   - Navigate to **Build > Realtime Database > Create Database**.
   - Under **Rules**, set `.read: true` and `.write: true`.
   - Copy your database URL (`https://<project-id>-default-rtdb.firebaseio.com/`).
   - In SpendIQ, open **Cloud DB & Sync**, paste the URL into the field, and click **Connect & Sync Now**.
   - Both Dad and Son will now see real-time updates across India and Japan.

---

## 📄 License
Apache-2.0
