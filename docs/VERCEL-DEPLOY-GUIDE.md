# Complete Vercel deployment guide (Personal Diary)

Follow these steps in order. Estimated time: **45–60 minutes**.

---

## What you are building

```
Your phone  →  https://your-app.vercel.app  →  Vercel (runs the app)
                                              →  Neon (stores diary data)
```

After deploy, you **Add to Home Screen** on your phone — no App Store needed.

---

## Before you start — checklist

You should already have:

- [ ] A **Neon** account with a project created
- [ ] `.env` on your PC with `DATABASE_URL` and `DIRECT_URL` (Neon URLs)
- [ ] Tables created: `npm run db:push:neon` succeeded once
- [ ] Login created: `npm run setup` succeeded (or you will create user after deploy)

You need:

- [ ] A **GitHub** account (free): https://github.com/signup
- [ ] A **Vercel** account (free): https://vercel.com/signup (sign up with GitHub)

---

## PART 1 — Put your code on GitHub

GitHub stores your code so Vercel can deploy it.

### Step 1.1 — Open terminal in your project

PowerShell in:

`C:\Users\andre\OneDrive\Desktop\Cursor Projects\About Me`

### Step 1.2 — Initialize Git (first time only)

```powershell
git init
git add .
git commit -m "Personal diary app"
```

If Git asks for your name/email the first time:

```powershell
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

Then run `git commit` again.

### Step 1.3 — Create a GitHub repository

1. Go to https://github.com/new  
2. **Repository name:** `personal-diary`  
3. **Private** ← recommended (your private diary)  
4. **Do not** check “Add a README”  
5. Click **Create repository**

### Step 1.4 — Push your code

Replace `YOUR_GITHUB_USERNAME`:

```powershell
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/personal-diary.git
git branch -M main
git push -u origin main
```

Sign in to GitHub if prompted.

**Verify:** Refresh GitHub — you should see your files (no `.env` — it is gitignored).

---

## PART 2 — Prepare Neon for production

Your database is already on Neon. Vercel needs the same connection strings.

### Step 2.1 — Copy connection strings from Neon

1. https://console.neon.tech → your project  
2. Click **Connect**  
3. Copy **Pooled** connection string → this is `DATABASE_URL`  
4. Copy **Direct** connection string → this is `DIRECT_URL`  
5. Add to the end of both (if missing): `&connect_timeout=30`  
6. Remove `channel_binding=require` if present (can cause issues)

### Step 2.2 — Confirm tables exist

On your PC:

```powershell
npm run db:push:neon
```

If it says tables already exist, you are good.

### Step 2.3 — Confirm your login exists

```powershell
$env:SKIP_DB_PUSH="1"
npm run setup
```

Remember `SETUP_EMAIL` and `SETUP_PASSWORD` from your `.env` — you will use them to sign in on Vercel.

---

## PART 3 — Deploy on Vercel

### Step 3.1 — Sign up and import project

1. Go to https://vercel.com  
2. **Sign Up** → **Continue with GitHub**  
3. Authorize Vercel  
4. Click **Add New…** → **Project**  
5. Find **personal-diary** → **Import**

### Step 3.2 — Configure the project (before Deploy)

| Setting | Value |
|---------|--------|
| Framework Preset | Next.js (auto) |
| Root Directory | `./` (default) |
| Build Command | `npm run build` |
| Output Directory | (leave default) |
| Install Command | `npm install` |

**Do not click Deploy yet.**

### Step 3.3 — Add environment variables

Expand **Environment Variables**. Add each row below.

Copy values from your `.env` file on your PC (open it in Cursor).

| Name | Value | Environments |
|------|--------|--------------|
| `DATABASE_URL` | Your Neon **pooled** URL (`-pooler` in hostname) | Production, Preview, Development |
| `DIRECT_URL` | Your Neon **direct** URL (no `-pooler`) | Production, Preview, Development |
| `AUTH_SECRET` | Same as in your `.env` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://placeholder.vercel.app` (fix after deploy) | Production |
| `WEBAUTHN_RP_ID` | Leave empty for now | Production |

**Important:**

- Paste the **full** `postgresql://...` string including password  
- No spaces before/after the `=`  
- Do **not** wrap in extra quotes in the Vercel UI (paste the URL as-is)

For `NEXTAUTH_URL`, you will update it in Step 3.6 after you know your real URL.

### Step 3.4 — Deploy

1. Click **Deploy**  
2. Wait 2–5 minutes  
3. When finished, click **Visit** or **Go to Dashboard**

### Step 3.5 — If the build fails

Click the failed deployment → **Building** log.

| Error | Fix |
|-------|-----|
| `Environment variable not found: DATABASE_URL` | Add `DATABASE_URL` in Settings → Environment Variables → Redeploy |
| `Environment variable not found: DIRECT_URL` | Add `DIRECT_URL` → Redeploy |
| Prisma / database error during build | Ensure both Neon URLs are correct; wake Neon (SQL Editor → `SELECT 1`) |
| `prisma migrate deploy` failed | Use Build Command `npm run build` (not `build:vercel`) |

To redeploy: **Deployments** → ⋮ on latest → **Redeploy**

### Step 3.6 — Fix NEXTAUTH_URL (required for login)

1. Copy your live URL from the browser, e.g. `https://personal-diary-abc123.vercel.app`  
2. Vercel → your project → **Settings** → **Environment Variables**  
3. Edit `NEXTAUTH_URL` → paste your exact URL (**no** trailing `/`)  
4. Edit `WEBAUTHN_RP_ID` → paste only the domain, e.g. `personal-diary-abc123.vercel.app`  
5. **Deployments** → ⋮ → **Redeploy**

### Step 3.7 — Test on desktop

1. Open your Vercel URL  
2. You should see the **login** page  
3. Sign in with `SETUP_EMAIL` / `SETUP_PASSWORD` from `.env`  
4. Write a test diary entry → refresh → it should still be there  

If login fails, double-check `NEXTAUTH_URL` and redeploy.

---

## PART 4 — Install on your phone

### Step 4.1 — Open the live site on your phone

Use **Safari** (iPhone) or **Chrome** (Android).

Go to: `https://your-app.vercel.app`

Sign in with the same email/password.

### Step 4.2 — Add to home screen

**iPhone (Safari only):**

1. Tap **Share** (□ with arrow)  
2. **Add to Home Screen**  
3. Name it **Diary** → **Add**  

**Android (Chrome):**

1. Tap **⋮** menu  
2. **Install app** or **Add to Home screen**  
3. Confirm  

### Step 4.3 — Use it daily

Open the **Diary** icon on your home screen — not a bookmark in the browser. It runs full-screen like an app.

### Step 4.4 — Optional: Face ID / Touch ID

1. Open app from home screen → sign in  
2. **Settings** → **Register Face ID / Touch ID**  
3. Next time use biometric login  

### Step 4.5 — Optional: reminders

**Settings** → enable **Daily reminder** → allow notifications.

---

## PART 5 — Updating the app later

When you change code on your PC:

```powershell
git add .
git commit -m "Describe your change"
git push
```

Vercel rebuilds automatically (1–3 minutes).

---

## PART 6 — Photos on Vercel (important)

Photo files are stored on disk locally. **Vercel does not keep uploaded photos** between requests.

| What works on Vercel | What may not |
|----------------------|--------------|
| Diary text, moods, ratings | Photo uploads may fail or disappear |

For full photo support in production, you would need cloud storage (e.g. Vercel Blob). Text diary works fully.

---

## PART 7 — Backups

In the app: **Settings** → **Export as JSON** or **ZIP**.

Do this monthly so you have a copy outside Neon.

---

## Quick reference — Vercel environment variables

```
DATABASE_URL     = Neon pooled URL
DIRECT_URL       = Neon direct URL
AUTH_SECRET      = random secret from .env
NEXTAUTH_URL     = https://your-app.vercel.app
WEBAUTHN_RP_ID   = your-app.vercel.app
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't log in on Vercel | Fix `NEXTAUTH_URL`, redeploy |
| "Invalid credentials" | Run `npm run setup` locally with Neon in `.env`, or reset password in `.env` and setup again |
| App works on PC but not phone | Use the **https** Vercel URL, not `localhost` |
| Blank page after deploy | Check Vercel deployment logs for build errors |
| Database empty | Run `npm run db:push:neon` locally; sign in with setup account |

---

## Full checklist

- [ ] Code on GitHub (private repo)  
- [ ] Neon tables created (`npm run db:push:neon`)  
- [ ] User account created (`npm run setup`)  
- [ ] Vercel project imported  
- [ ] All env vars set  
- [ ] Deploy succeeded  
- [ ] `NEXTAUTH_URL` updated and redeployed  
- [ ] Login works in desktop browser  
- [ ] Opened on phone and signed in  
- [ ] Added to home screen  
- [ ] Test entry saved from phone  

---

## Your live URL

After deploy, write it here:

```
https://__________________________.vercel.app
```

That is the link for your phone and for sharing with yourself only.
