# Personal Diary

A private, mobile-first daily diary web app with rich text, photos, mood tags, day ratings, calendar, search, statistics, and optional biometric login.

## Quick start

```bash
npm install
npm run setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with the email/password from your `.env` file (created by setup).

**Change the default password** in `.env` before deploying anywhere public.

## Features

| Feature | Description |
|---------|-------------|
| Daily entries | One entry per day with TipTap rich text (bold, italic, bullets) |
| Auto-save | Debounced saves while you type |
| Mood tags | Presets + custom tags |
| Day rating | 1–5 emoji scale |
| Photos | Up to 12 per entry, compressed with Sharp, grid + lightbox |
| Calendar | Monthly view with entry indicators and ratings |
| Search | Keywords, mood, rating filters + quick filters |
| Auth | Email/password + optional WebAuthn (Face ID / Touch ID) |
| Export | JSON or ZIP (entries + photos) |
| Stats | Mood trends, monthly averages, photo counts |
| On This Day | Past entries from the same month/day |
| Reminders | Evening banner + browser notifications (opt-in) |
| Theme | Light / dark / system |

## Tech stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** for styling
- **Prisma** + SQLite for the database
- **NextAuth.js** for authentication
- **TipTap** for the rich text editor
- **Sharp** for image compression
- **Framer Motion** for animations
- **@simplewebauthn** for passkeys

## Folder structure

```
src/
├── app/
│   ├── (app)/              # Authenticated routes (with nav shell)
│   │   ├── page.tsx        # Redirects to today's entry
│   │   ├── entry/[date]/   # Daily diary editor
│   │   ├── calendar/       # Monthly calendar
│   │   ├── search/         # Search & filters
│   │   ├── stats/          # Statistics dashboard
│   │   └── settings/       # Passkey, reminders, export
│   ├── login/              # Sign-in page
│   └── api/                # REST API routes
├── components/             # UI components
│   ├── DiaryEditor.tsx     # TipTap rich text editor
│   ├── EntryPage.tsx       # Full entry view (editor + photos + rating)
│   ├── PhotoGrid.tsx       # Photo upload grid
│   ├── Lightbox.tsx        # Full-screen photo viewer
│   ├── CalendarView.tsx    # Monthly calendar
│   ├── SearchPanel.tsx     # Search & filter UI
│   ├── StatsDashboard.tsx  # Charts & monthly tables
│   └── ...
├── hooks/
│   └── useAutoSave.ts      # Debounced auto-save hook
└── lib/
    ├── prisma.ts           # Database client
    ├── entries.ts          # Entry CRUD helpers
    ├── photos.ts           # Image processing & storage
    └── webauthn.ts         # Passkey registration/auth
```

## Key components

- **`EntryPage`** — Orchestrates the diary for a given date: rating, moods, editor, photos, and “On This Day.”
- **`useAutoSave`** — Queues PATCH requests while you edit; flushes on unmount.
- **`DiaryEditor`** — TipTap instance with bold, italic, and bullet list toolbar.
- **`PhotoGrid`** — Multi-upload, square grid, delete, opens `Lightbox`.
- **`CalendarView`** — Fetches `/api/calendar?month=YYYY-MM` and links each day to `/entry/[date]`.

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/entries/[date]` | GET, PATCH | Load / update entry |
| `/api/entries/[date]/photos` | POST | Upload photo |
| `/api/photos/[id]` | GET, DELETE | Serve / delete photo |
| `/api/calendar` | GET | Month summary |
| `/api/search` | GET | Search & filter |
| `/api/stats` | GET | Dashboard data |
| `/api/on-this-day` | GET | Historical same-day entries |
| `/api/export` | GET | JSON or ZIP backup |
| `/api/webauthn/*` | POST | Passkey register / login |

## Data storage

- **Entries, moods, ratings** — SQLite via Prisma (`prisma/dev.db`)
- **Photos** — Compressed files in `uploads/{userId}/{entryId}/` (gitignored)

## Production notes

1. Set strong `AUTH_SECRET` and `SETUP_PASSWORD` in environment variables.
2. Use PostgreSQL by changing `provider` in `prisma/schema.prisma` and `DATABASE_URL`.
3. For HTTPS passkeys, set `NEXTAUTH_URL` and optionally `WEBAUTHN_RP_ID` to your domain.
4. Run `npm run build && npm start` for production.

## Deploy to your phone (anywhere) — Option B

**Full Vercel deploy guide (start here):** [docs/VERCEL-DEPLOY-GUIDE.md](docs/VERCEL-DEPLOY-GUIDE.md)

**Neon + troubleshooting:** [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md)

Covers GitHub, Neon PostgreSQL, Vercel, env vars, phone install, photos, and troubleshooting.

On Vercel, set the build command to `npm run build:vercel` after you add PostgreSQL migrations.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run setup` | Create `.env`, DB, and owner account |
| `npm run build` | Production build |
| `npm run db:studio` | Open Prisma Studio |
