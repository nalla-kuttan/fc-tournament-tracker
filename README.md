# FC Tournament Tracker

A beautiful, modern, and feature-rich tournament tracking application built explicitly for organizing, calculating, and reliving your EA SPORTS FC or FIFA gaming sessions with friends. 

Built on top of a powerful **Next.js** framework with a **Supabase** backend, it features a stunning glassmorphism UI, a comprehensive analytics engine, and deeply integrated **Google Gemini AI** layers.

---

## 🚀 Key Features

### 🏆 Tournament & League Management
- **Multiple Formats**: Supports **League** (Round-Robin) and **Knockout** (Bracket) tournament formats.
- **Dynamic Standings**: Real-time league tables calculating points, goal difference (GF/GA), and win rates.
- **Live Bracket View**: Beautiful tree structures for knockout progressions.
- **Match Tracking**: Enter detailed match data including scores, specific goal minutes, xG, possession, tackles, interceptions, and Man of the Match (MOTM).

### 📊 Comprehensive Global Analytics
- **Global Leaderboards**: Rank every registered player across all-time Top Scorers, Win Rates, xG, Average Possession, and Clean Sheets.
- **Performance Trends**: Track form momentum across a timeline line-chart.
- **Goal Distribution**: A radar/bar chart of exactly what minute goals are being scored.
- **Head-to-Head Analyst (H2H)**: Directly compare the historic rivalry, total encounters, and stats between any two specific players.
- **Deep Player Profiles**: Individual pages showcasing Career Stats, Win/Draw/Loss doughnuts, attribute spider-radars, and historical tournament participation.

### 🤖 Powered by Google Gemini AI
The tracker isn't just a database; it utilizes an integrated AI Sports Pundit to turn raw numbers into engaging storytelling.
- **Tournament Summaries**: Generates a colorful, pundit-style recap of a tournament's progression on the dashboard.
- **Player Scouting Reports**: Acts as a virtual Scout to evaluate a player profile’s career stats, summarizing their core strengths and playstyle.
- **H2H Rivalry Analyst**: Predicts and narrates the dynamic of two players' historical encounters.
- **Post-Match Newspaper**: Dynamically generates sports-journalism headlines and match recaps as soon as you record a final score.
- **AI Stat Oracle**: A natural language search bar on the global dashboard allowing you to ask queries like, *"Who has the highest win rate but the lowest goals per match?"*

### 📱 Premium Glassmorphism UI & PWA
- **App-like Experience**: Configured as a Progressive Web App (PWA). Add it directly to your iOS or Android home screen for native-app immersion.
- **MUI Powered**: Gorgeous blur filters, dynamic colors, elegant animations, and heavily polished mobile-responsive layouts.
- **Smooth Navigation**: Logical back-button hierarchies and fluid layout transitions.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Next.js 15 (App Router), React, Material UI (MUI v6)
- **Backend / Database**: Supabase (PostgreSQL)
- **AI Integration**: `@google/genai` (Gemini 2.5 Flash)
- **Styling & Charts**: MUI Components, Chart.js / `react-chartjs-2`
- **Language**: TypeScript

---

## ⚙️ Getting Started

### Prerequisites
You will need a [Supabase](https://supabase.com/) account/project and a [Google AI Studio](https://aistudio.google.com/) API Key.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nalla-kuttan/fc-tournament-tracker.git
   cd fc-tournament-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file at the root of the project with your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_google_gemini_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Next Steps and Customization

You can freely add new player images or customize team icons. The system relies entirely on the players registered under `src/app/players/page.tsx` or created inline during a new tournament setup!
