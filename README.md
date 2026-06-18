# FC Tournament Tracker

A polished tournament tracker for EA SPORTS FC/FIFA nights with friends. Create leagues, knockout brackets, and cups; record match results and rich stats; follow live standings; and turn the whole history into player profiles, rivalry pages, leaderboards, and Gemini-powered match stories.

Built with **Next.js**, **React**, **Material UI**, **Supabase**, and **Google Gemini**.

---

## Features

### Tournament Management

- League, knockout, and cup tournament formats.
- Round-robin schedule generation, live standings, and knockout bracket progression.
- Match result entry with scorelines, goal minutes, xG, possession, tackles, interceptions, and Man of the Match data.
- Tournament-level admin PINs for protected match and settings updates.
- Supabase Realtime updates for matches, goals, and players.

### Analytics

- Global dashboards for all-time player performance.
- Tournament-specific standings, bracket, player, and match views.
- Head-to-head comparison pages for rivalries.
- Player profile pages with career stats, form, radar charts, and W/D/L breakdowns.
- Hall of Fame, power rankings, fun facts, awards, and leaderboard components.

### AI Summaries

Gemini integrations add a pundit layer on top of the raw numbers:

- Tournament summaries.
- Player scouting reports.
- Head-to-head rivalry analysis.
- Post-match reports.
- Natural-language stat questions.

### App Experience

- Responsive glassmorphism UI built with MUI.
- Progressive Web App support.
- Optional SwiftUI macOS shell that launches and wraps the local Next.js app.
- In-app music track support via Supabase.

---

## Tech Stack

- **Web app:** Next.js 16 App Router, React 19, TypeScript
- **UI:** Material UI 7, Emotion, Framer Motion
- **Data:** Supabase/PostgreSQL, Supabase SSR helpers, SWR
- **Charts:** Chart.js, react-chartjs-2
- **AI:** `@google/genai`
- **Desktop shell:** SwiftUI macOS package

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- A Supabase project
- A Google AI Studio API key for Gemini features
- Xcode, only if you want to run the macOS shell

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

Open the Supabase SQL editor for your project and run:

```sql
-- contents of supabase-schema.sql
```

The schema creates the core tables, RLS policies, realtime publication entries, the `standings` view, and helper functions for atomic match saves and bracket advancement.

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
```

`SUPABASE_SERVICE_ROLE_KEY` is required by server-side API routes that create tournaments, save match results, manage players, and update brackets. Keep it server-only and never expose it in client-side code.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

```bash
npm run dev        # Start the Next.js development server
npm run build      # Build the production web app
npm run start      # Start the production Next.js server
npm run lint       # Run ESLint
npm run mac:dev    # Build and launch the SwiftUI macOS wrapper
npm run mac:build  # Compile the Swift package only
```

---

## macOS App

The repository includes a native SwiftUI shell in `macos/`. It starts the local Next.js app when needed and presents it in a desktop window.

```bash
npm run mac:dev
```

Optional environment variables:

```env
INNER_CELESTIAL_PORT=3000
INNER_CELESTIAL_WEB_ROOT=/absolute/path/to/inner-celestial
```

Use `INNER_CELESTIAL_WEB_ROOT` when launching the macOS app from outside the repository and you need to point it at this web project.

---

## Project Layout

```text
src/app/                 Next.js routes, pages, layouts, and API handlers
src/components/          UI components grouped by feature
src/contexts/            Shared React context providers
src/lib/                 Supabase clients, algorithms, guards, types, and analytics helpers
macos/                   SwiftUI macOS wrapper
script/                  Local helper scripts
supabase-schema.sql      Supabase schema, policies, views, and database functions
```

---

## Typical Workflow

1. Register global players from the players screen.
2. Create a tournament, select players, assign teams, and set an admin PIN.
3. Generate the schedule or bracket.
4. Enter match results with the tournament PIN.
5. Review standings, brackets, player profiles, analytics, and AI reports.

---

## Notes

- Tournament PINs are hashed with bcrypt before storage.
- Public reads are enabled through Supabase RLS policies; writes go through protected server API routes.
- Gemini features require `GEMINI_API_KEY`. The rest of the tracker can still run without AI responses, but AI endpoints will return configuration errors until the key is present.
- Player images and visual mappings live in `src/lib/player-images.ts` and related player components.
