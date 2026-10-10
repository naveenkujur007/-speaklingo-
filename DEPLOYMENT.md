# 🚀 SpeakLingo Deployment Guide

Complete step-by-step guide to deploy SpeakLingo from scratch.

## 📋 Prerequisites

1. **GitHub account** — https://github.com
2. **Vercel account** — https://vercel.com (free)
3. **Supabase account** — https://supabase.com (free)

All three accounts can be created with GitHub login — no separate passwords.

---

## Step 1: Create Supabase Project (3 min)

1. Go to https://supabase.com → **"Start your project"** → **"Sign up with GitHub"**
2. Create a new project:
   - **Name:** `speaklingo`
   - **Database Password:** Generate strong password (NOTE IT DOWN somewhere safe — Supabase can't recover it)
   - **Region:** `Singapore (ap-southeast-1)` ⚠️ **must be Singapore for this repo's hardcoded URL**
   - **Plan:** Free
3. Wait 2-3 min for provisioning to complete
4. Once ready, go to **Project Settings** (⚙️ gear, bottom-left) → **API**:
   - Copy **Project URL** → e.g., `https://dynqrmcwhbkcvdsvyjal.supabase.co`
   - Copy **Project API keys** → both `publishable` and `secret` keys

> **Note:** For other regions (Mumbai, US, EU), the database URL in `.env` will differ. Use the Connection String from Supabase Dashboard → Project Settings → Database.

---

## Step 2: Create GitHub Repo (1 min)

If you're starting fresh (no existing repo):

1. Go to https://github.com/new
2. **Repository name:** `-speaklingo-` (with dashes — matches existing)
3. **Visibility:** Private (recommended) or Public
4. **Initialize:** Don't tick anything (we'll push existing code)
5. **Create repository** — copy the URL, e.g., `https://github.com/yourname/-speaklingo-.git`

---

## Step 3: Push Code to GitHub (2 min)

```bash
cd /path/to/speaklingo
git remote add origin https://github.com/YOURNAME/-speaklingo-.git
git push -u origin main
```

If prompted for credentials, generate a GitHub Personal Access Token (PAT):
- GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
- Generate new token → Tick `repo` scope → Generate
- Use the token as your password when git prompts

---

## Step 4: Create .env File Locally (1 min)

```bash
cp .env.example .env
```

Edit `.env` with the values from Step 1:

```env
DATABASE_URL="postgresql://postgres.[YOUR-REF]:[URL-ENCODED-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[YOUR-REF]:[URL-ENCODED-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_XXXXXXX"
SUPABASE_SERVICE_ROLE_KEY="sb_secret_XXXXXXX"
```

**Important:** URL-encode the password (e.g., `@` → `%40`, `/` → `%2F`).

---

## Step 5: Create Tables on Supabase (30 sec)

```bash
npm install
npm run db:push
```

This runs `prisma db push` which reads `prisma/schema.prisma` and creates all 10 tables on Supabase.

**Verify:** Go to Supabase Dashboard → **Table Editor** — you should see 10 tables (Session, Message, Mistake, Lesson, LearnedItem, Review, Progress, Streak, Achievement, PronunciationAttempt).

---

## Step 6: Test Locally (30 sec)

```bash
npm run dev
```

Open http://localhost:3000 → try a lesson → check Supabase **Table Editor** → data should appear in `Session` table.

---

## Step 7: Deploy to Vercel (3 min)

1. Go to https://vercel.com → **Login with GitHub**
2. **"Add New Project"** → import `-speaklingo-` repo
3. **Configure:**
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `next build` (default)
   - Install Command: `npm install` (default)
4. **Environment Variables** — add ALL 5 (same as your `.env`):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   
   ⚠️ Tick **Production**, **Preview**, **Development** for each variable.
5. **Deploy** — wait 2-3 min for build
6. Live at `https://-speaklingo-.vercel.app` (or whatever name Vercel gives)

---

## Step 8: Verify Production (1 min)

1. Open your Vercel URL
2. Login / try a lesson / save a word
3. Check Supabase **Table Editor** → data should appear

If anything fails:
- Vercel dashboard → **Logs** → check for errors
- Common issues: missing env var, wrong DATABASE_URL, password not URL-encoded

---

## 🔄 Updating the App

Every `git push origin main` triggers automatic Vercel redeploy. No manual action needed.

```bash
# Make changes
git add .
git commit -m "your message"
git push origin main
# → Vercel auto-deploys in 2-3 min
```

---

## 🆘 Troubleshooting

### "Database connection failed"
- Verify `DATABASE_URL` is correct in Vercel env vars
- Password must be URL-encoded (e.g., `@` → `%40`)
- Region in URL must match your Supabase project region

### "Tables don't exist"
- Run `npm run db:push` locally — this creates tables on Supabase
- Verify in Supabase **Table Editor**

### "Build fails on Vercel"
- Check Vercel logs
- Common: missing env var, TS error (we set `ignoreBuildErrors: true` so should not happen)
- Try running `npm run build` locally first

### "Service worker / PWA not updating"
- Service worker has `skipWaiting` — should auto-update on next visit
- Hard refresh: Ctrl+Shift+R / Cmd+Shift+R
- Check `/sw.js` is being served with `no-cache` header (already configured in `vercel.json`)

### "App is slow"
- First lesson generation takes ~12s (LLM call)
- Cached lessons load in 0.01s
- Word of Day cached by language + date
- Vocab Vault cached by language + category

---

## 📞 Need Help?

- GitHub Issues: https://github.com/naveenkujur007/-speaklingo-/issues
- Email: naveenkujur077@gmail.com
