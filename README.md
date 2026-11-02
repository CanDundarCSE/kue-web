# Kue Web

The web client for **Kue**, an all-in-one entertainment tracking and social platform for movies, TV series, anime, manga, and video games.

Kue keeps everything you consume in one catalog: format-aware progress, statuses, ratings, reviews, curated lists, statistics, and friend activity. The web app is built with Next.js and talks to the [Kue Backend API](https://github.com/CanDundarCSE/kue-backend) through server-side route handlers.

---

## Key Features

### Unified Media Catalog

- Browse and search five formats in one interface:
  - Movies and TV series from TMDB
  - Anime and manga from AniList
  - Video games from IGDB
- Media detail pages with scores, rating distributions, similar titles, and reviews.

### Personal Library

- Track statuses: `watching`, `reading`, `playing`, `completed`, `on_hold`, `dropped`, `planned`.
- Format-aware progress tracking, decimal ratings, favorites, and personal notes.
- Continue-watching rows and a dashboard built around current activity.
- Import existing libraries from supported external sources.

### Reviews and Custom Lists

- Write reviews with spoiler-safe text.
- Create ranked or themed lists with public or private visibility.
- Browse public profiles, reviews, favorites, and lists.

### Social Features

- Mutual friend requests, friend activity, and friend-gated profiles.
- Real-time notifications over SignalR.
- Privacy controls for profiles, libraries, and ratings.

### Statistics

- Activity heatmap, streaks, time spent, genre breakdown, and rating overview.
- Per-medium and per-year summaries.

### Mini Games

- Poster guessing, higher-or-lower, media quiz, and genre sprint.
- Points wallet and leaderboards backed by the API.

### Administration

- Admin dashboard, user management, ban controls, and media catalog synchronization.

### Accounts and Legal

- Registration, login, password reset, and session refresh.
- Versioned Privacy Policy, Terms of Service, and Cookie Policy with re-acceptance flow.

---

## Technology Stack

| Component            | Technology                                   |
| -------------------- | -------------------------------------------- |
| Framework            | Next.js 16 (App Router, React Server Components) |
| Language             | TypeScript 5                                 |
| UI                   | React 19, Tailwind CSS 4, Radix UI           |
| Data Fetching        | Next.js server route handlers, fetch cache   |
| Real-Time            | Microsoft SignalR client                     |
| Theming              | next-themes (light / dark / system)          |
| Icons                | Lucide React                                 |
| Package Manager      | pnpm                                         |
| Deployment           | Vercel                                       |

---

## Project Structure

```
kue-web/
├── app/
│   ├── (auth)/              # Login, registration, password reset
│   ├── (app)/               # Signed-in application shell
│   │   ├── home/            # Dashboard and search
│   │   ├── library/         # Personal library
│   │   ├── discover/        # Catalog discovery
│   │   ├── media/           # Media detail pages
│   │   ├── reviews/         # Reviews
│   │   ├── mini-games/      # Games and leaderboards
│   │   ├── friends/         # Friend activity
│   │   ├── stats/           # Statistics
│   │   ├── import/          # Library import
│   │   ├── settings/        # Account, add-on, and app settings
│   │   └── admin/           # Admin dashboard
│   ├── api/                 # Next.js route handlers proxying the backend
│   ├── features/            # Feature UI and client logic
│   ├── components/          # Shared app and landing components
│   └── globals.css          # Design tokens and global styles
├── lib/                     # API clients, session, helpers
├── public/                  # Static assets and mobile update manifest
└── next.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 20 or newer
- [pnpm](https://pnpm.io/installation)
- A running [Kue Backend API](https://github.com/CanDundarCSE/kue-backend)

### 1. Clone and Install

```bash
git clone https://github.com/CanDundarCSE/kue-web.git
cd kue-web
pnpm install
```

### 2. Configure the API

```bash
cp .env.example .env.local
```

Set both values to the backend origin:

```env
KUE_API_URL=http://localhost:5148
NEXT_PUBLIC_KUE_API_URL=http://localhost:5148
```

`KUE_API_URL` is used by server-side route handlers. Its public twin lets the browser open the SignalR hub directly. Do not append `/api/v1`; the route handlers add the versioned prefix themselves.

### 3. Run the App

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Checks

```bash
pnpm lint
pnpm build
```

---

## Related Repositories

| Repository                                                      | Description                     |
| --------------------------------------------------------------- | ------------------------------- |
| [kue-backend](https://github.com/CanDundarCSE/kue-backend)       | .NET API, SignalR, PostgreSQL   |
| [kue-mobile](https://github.com/CanDundarCSE/kue-mobile)         | Android Expo client             |
| [kue-web](https://github.com/CanDundarCSE/kue-web)               | This repository                 |

---

## License

Personal, non-commercial project. See the repository for details.
