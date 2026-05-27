# Option B: Deploy to Vercel (use diary on your phone anywhere)

This guide walks you through putting your Personal Diary online with **Vercel** so you can open it from your phone on cellular data, not only at home on Wi‑Fi.

**Time:** about 45–60 minutes the first time  
**Cost:** free tiers on GitHub, Neon, and Vercel are enough for personal use

---

## Before you start (important)

Your app currently uses:

| Feature | Local dev | Vercel production |
|---------|-----------|-------------------|
| Database (SQLite file) | Works | **Does not work** — serverless has no persistent disk |
| Photos (`uploads/` folder) | Works | **Does not work** — files are deleted between requests |

So for Option B you will:

1. Move the database to **Neon** (free hosted PostgreSQL).
2. Choose how to handle **photos** (see [Part 6](#part-6-photo-storage-choose-one-path)).
3. Deploy the app on **Vercel** and install it on your phone from the live URL.

---

## Part 1: Create a GitHub repository

Vercel deploys from Git. If the project is not on GitHub yet:

### 1.1 Install Git (if needed)

Download from https://git-scm.com/download/win

### 1.2 Initialize the repo (in your project folder)

Open PowerShell in:

`C:\Users\andre\OneDrive\Desktop\Cursor Projects\About Me`

```powershell
git init
git add .
git commit -m "Initial commit: personal diary app"
```

### 1.3 Create repo on GitHub

1. Go to https://github.com/new  
2. Repository name: e.g. `personal-diary`  
3. **Private** (recommended — this is your private diary)  
4. Do **not** add README, .gitignore, or license (you already have them)  
5. Click **Create repository**

### 1.4 Push your code

Replace `YOUR_USERNAME` with your GitHub username:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/personal-diary.git
git branch -M main
git push -u origin main
```

Sign in with GitHub when prompted (browser or credential manager).

---

## Part 2: Set up Neon (production database)

### 2.1 Create a Neon account

1. Go to https://neon.tech  
2. Sign up (GitHub login is fine)  
3. Create a new **Project**  
   - Name: `personal-diary`  
   - Region: pick one close to you (e.g. US East)  
   - PostgreSQL version: default (16) is fine  

### 2.2 Copy the connection string

1. In the Neon dashboard, open your project  
2. Go to **Dashboard** or **Connection details**  
3. Copy the **connection string** that looks like:

   ```
   postgresql://user:password@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. Keep this secret — anyone with it can access your database.

### 2.3 Switch Prisma from SQLite to PostgreSQL

Open `prisma/schema.prisma` and change the datasource block from:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

to:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Save the file.

### 2.4 Create tables on Neon (from your PC)

**If you get `P1001: Can't reach database server`** — this is usually Neon waking from sleep. See [Fix P1001](#fix-p1001-cant-reach-database-server) below.

1. In the **Neon dashboard**, open your project and click **SQL Editor** → run `SELECT 1;` (wakes the database).
2. In Neon → **Connect**, copy **both** connection strings:
   - **Pooled** → `DATABASE_URL` (hostname has `-pooler`)
   - **Direct** → `DIRECT_URL` (no `-pooler`)
3. Add to the end of each URL: `&connect_timeout=30`

Put both in your `.env` file (do not rely only on `$env:DATABASE_URL` in PowerShell — Prisma also reads `.env`).

```powershell
npx prisma db push
```

If that works, then create a migration:

```powershell
npx prisma migrate dev --name init_postgres
```

If Prisma asks to reset the database, choose **yes** (Neon is empty).

This creates a `prisma/migrations` folder. Commit it:

```powershell
git add prisma/
git commit -m "Add PostgreSQL migrations for production"
git push
```

### 2.5 Create your login account on Neon

Still with `DATABASE_URL` set to Neon (or put the Neon URL in a temporary `.env` file):

```powershell
# In .env, set:
# DATABASE_URL="postgresql://..."
# SETUP_EMAIL="your-real-email@example.com"
# SETUP_PASSWORD="YourStrongPasswordHere!"
# SETUP_NAME="Your Name"

npm run setup
```

Use a **strong password** you will use on your phone.

> **Tip:** After setup, your local `.env` can keep the Neon URL for production seeding, or switch `DATABASE_URL` back to `file:./dev.db` for local-only dev with SQLite.

---

## Part 3: Generate production secrets

You need two secrets for auth.

### 3.1 AUTH_SECRET

In PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output — this is your `AUTH_SECRET`.

### 3.2 NEXTAUTH_URL (set after first deploy)

You will set this to your Vercel URL, e.g.:

```
https://personal-diary-abc123.vercel.app
```

You can update it after the first deployment (Part 5).

---

## Part 4: Deploy on Vercel

### 4.1 Create a Vercel account

1. Go to https://vercel.com  
2. Sign up with **GitHub** (same account as your repo)

### 4.2 Import the project

1. Click **Add New…** → **Project**  
2. **Import** your `personal-diary` repository  
3. Framework Preset: **Next.js** (should auto-detect)  
4. Root Directory: `.` (default)  
5. Build Command: `npm run build` (default)  
6. Install Command: `npm install` (default)  

**Do not click Deploy yet** — add environment variables first.

### 4.3 Environment variables on Vercel

Expand **Environment Variables** and add:

| Name | Value | Environments |
|------|--------|----------------|
| `DATABASE_URL` | Your Neon connection string (`postgresql://...`) | Production, Preview, Development |
| `AUTH_SECRET` | The base64 string from Part 3.1 | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://YOUR-PROJECT.vercel.app` (use the URL Vercel shows, or update after first deploy) | **Production only** first |
| `SETUP_EMAIL` | Your diary login email | Production (optional, for re-running setup) |
| `SETUP_PASSWORD` | Your strong password | Production (optional) |
| `SETUP_NAME` | Your display name | Production (optional) |

For **Preview** deployments, also set `NEXTAUTH_URL` to the preview URL pattern if you use preview branches (optional for personal use).

### 4.4 Deploy

1. Click **Deploy**  
2. Wait 2–5 minutes for the build  
3. When it finishes, click **Visit** to open the site  

### 4.5 Fix NEXTAUTH_URL if login fails

1. Copy your live URL from the browser (e.g. `https://personal-diary.vercel.app`)  
2. Vercel → your project → **Settings** → **Environment Variables**  
3. Edit `NEXTAUTH_URL` to match **exactly** (no trailing slash)  
4. **Redeploy:** Deployments → ⋮ on latest → **Redeploy**

### 4.6 Verify on desktop

1. Open the Vercel URL in a browser  
2. Sign in with the email/password from `npm run setup` (Part 2.5)  
3. Write a test entry and confirm it saves after refresh  

---

## Part 5: Install on your phone (production URL)

1. On your phone, open **Safari** (iPhone) or **Chrome** (Android)  
2. Go to your Vercel URL: `https://your-app.vercel.app`  
3. Sign in  
4. Add to home screen:

   **iPhone (Safari)**  
   - Share → **Add to Home Screen** → Add  

   **Android (Chrome)**  
   - Menu ⋮ → **Install app** or **Add to Home screen**  

5. Open the **Diary** icon — it should run full-screen like an app  

### Face ID / Touch ID on phone (production)

1. Sign in with password on the phone  
2. Open **Settings** in the app  
3. Tap **Register Face ID / Touch ID**  
4. Next time, use biometric login on the login screen  

> WebAuthn requires **HTTPS** (Vercel provides this). Your passkey is tied to your domain (`your-app.vercel.app`).

Optional: in Vercel env vars, set:

```
WEBAUTHN_RP_ID=your-app.vercel.app
```

(no `https://`, no path)

---

## Part 6: Photo storage (choose one path)

Local photo uploads **do not persist on Vercel**. Pick one:

### Path A — Use Vercel without photos (simplest)

- Use the diary for **text, moods, and ratings** only on Vercel  
- Photo upload may fail or disappear after redeploy  
- Good if you rarely attach photos  

### Path B — Vercel Blob (photos on Vercel)

1. Vercel dashboard → your project → **Storage** → **Create Database / Store** → **Blob**  
2. Connect Blob to the project (Vercel adds `BLOB_READ_WRITE_TOKEN` automatically)  
3. **Code change required:** photo save/read must use `@vercel/blob` instead of the `uploads/` folder  
   - If you want this implemented in the repo, ask to add “Vercel Blob photo storage”  

### Path C — Keep photos on Railway, app on Vercel (split)

Not recommended for beginners — use Path D instead.

### Path D — Deploy everything on Railway (easiest if you need photos today)

Railway gives a persistent disk so **SQLite + uploads work without code changes**:

1. https://railway.app → New Project → Deploy from GitHub  
2. Select your repo  
3. Add variables: `AUTH_SECRET`, `NEXTAUTH_URL` (Railway URL), `DATABASE_URL=file:./dev.db`  
4. Add a **Volume** mounted at `/app/uploads` (see Railway docs)  

This is not Vercel, but it satisfies “use on phone anywhere” with photos intact.

---

## Part 7: Custom domain (optional)

1. Buy a domain (Namecheap, Cloudflare, Google Domains, etc.)  
2. Vercel → Project → **Settings** → **Domains** → Add domain  
3. Follow DNS instructions (usually a CNAME to `cname.vercel-dns.com`)  
4. Update environment variables:  
   - `NEXTAUTH_URL=https://diary.yourdomain.com`  
   - `WEBAUTHN_RP_ID=diary.yourdomain.com`  
5. Redeploy  

---

## Part 8: Backups (recommended)

Your data lives in Neon, not on your phone.

### Export from the live app

1. Sign in on desktop or phone  
2. **Settings** → **Export as JSON** or **Export as ZIP**  
3. Save files to cloud storage (iCloud, Google Drive) periodically  

### Neon backups

Neon free tier includes point-in-time recovery on paid plans; on free tier, rely on app export + occasional manual dumps:

```powershell
# With Neon URL in DATABASE_URL — advanced
npx prisma db pull
```

---

## Part 9: Updating the app later

After you change code locally:

```powershell
git add .
git commit -m "Describe your change"
git push
```

Vercel automatically rebuilds and deploys from `main`.

---

## Fix P1001: Can't reach database server

Neon **pauses** inactive databases. Prisma often times out before Neon wakes up.

1. **Rotate your password** in Neon → Settings → Reset password (if you shared the connection string anywhere).
2. Open **Neon dashboard** → **SQL Editor** → run `SELECT 1;` and wait until it succeeds.
3. Use the **Direct** connection string for migrations (Neon → Connect → **Direct connection**).
4. Add timeout to the URL:
   ```
   ...?sslmode=require&connect_timeout=30
   ```
5. In `.env`, set **both** (see `.env.example`):
   - `DATABASE_URL` = pooled string (for the app)
   - `DIRECT_URL` = direct string (for Prisma CLI)
6. Comment out or remove the old SQLite line: `# DATABASE_URL="file:./dev.db"`
7. Retry:
   ```powershell
   npx prisma db push
   ```
8. If it still fails: disable VPN, allow Node.js through Windows Firewall, try again after 30 seconds.

---

## Part 10: Troubleshooting

| Problem | Fix |
|---------|-----|
| **P1001 on Neon** | See [Fix P1001](#fix-p1001-cant-reach-database-server) above |
| **Build fails on Vercel** | Open the deployment log; often a missing env var or Prisma migrate. Ensure `prisma/migrations` is committed. |
| **“Invalid credentials”** | Re-run `npm run setup` locally with Neon `DATABASE_URL`, or check email/password. |
| **Login works locally but not on Vercel** | `NEXTAUTH_URL` must exactly match the site URL. Redeploy after changing. |
| **Session drops immediately** | `AUTH_SECRET` must be set on Vercel and must not change between deploys. |
| **Photos upload then vanish** | Expected on Vercel without Blob/Railway — see Part 6. |
| **Biometric login fails** | Use HTTPS URL; register passkey again on production after deploy. |
| **Database connection error** | Neon string must include `?sslmode=require`. Check IP allowlist (Neon allows all by default). |
| **Prisma migrate errors** | Run `npx prisma migrate deploy` in Vercel build — add to `package.json`: `"build": "prisma migrate deploy && prisma generate && next build"` |

### Recommended build command on Vercel

In Vercel → Project → **Settings** → **General** → **Build Command**, set:

```
npm run build:vercel
```

Or override **Build Command** to: `prisma migrate deploy && prisma generate && next build`

So Vercel applies migrations on each deploy (after you complete Part 2.4).

---

## Checklist (print this)

- [ ] Code pushed to GitHub (private repo)  
- [ ] Neon project created; connection string copied  
- [ ] `prisma/schema.prisma` uses `postgresql`  
- [ ] `npx prisma migrate dev` run against Neon  
- [ ] `npm run setup` run with production email/password  
- [ ] `AUTH_SECRET` generated  
- [ ] Vercel project imported from GitHub  
- [ ] All env vars set on Vercel  
- [ ] Deploy succeeded  
- [ ] `NEXTAUTH_URL` matches live URL; redeployed if needed  
- [ ] Login tested in browser  
- [ ] Phone: opened URL, signed in, added to home screen  
- [ ] Passkey registered on phone (optional)  
- [ ] Photo strategy chosen (Part 6)  
- [ ] First JSON/ZIP backup exported  

---

## Quick reference: environment variables

| Variable | Example | Required |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://...@neon.tech/neondb?sslmode=require` | Yes |
| `AUTH_SECRET` | random base64 string | Yes |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Yes |
| `WEBAUTHN_RP_ID` | `your-app.vercel.app` | Optional (passkeys) |
| `SETUP_EMAIL` | `you@example.com` | Setup only |
| `SETUP_PASSWORD` | strong password | Setup only |
| `BLOB_READ_WRITE_TOKEN` | (auto on Vercel) | Only if using Vercel Blob |

---

## Need help?

- Vercel docs: https://vercel.com/docs  
- Neon docs: https://neon.tech/docs  
- Prisma Postgres: https://www.prisma.io/docs/orm/overview/databases/postgresql  

If you want the repo updated for you (Postgres build script, Vercel Blob photos, one-click deploy), say which parts to implement.
