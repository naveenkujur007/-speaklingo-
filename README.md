# 🗣️ SpeakLingo — AI Spoken Language Teacher

> Talk with an AI language teacher that catches your mistakes and helps you improve. Voice in, voice out, real-time corrections. Structured A1–C2 curriculum, spaced repetition, pronunciation scoring, role-play scenarios, achievements.

![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-production-success)
![Stack](https://img.shields.io/badge/stack-Next.js%2016%2B%20Supabase%2B%20Tailwind-orange)

## ✨ Features

- 🎙️ **Voice-first** — speak to the AI teacher, get spoken replies with lip-sync robot avatar
- 🌍 **8 languages** — English, Hindi, Spanish, French, German, Japanese, Chinese, Arabic
- 📚 **A1–C2 curriculum** — 36 lessons per language (6 levels × 6 lessons)
- 🧠 **Spaced repetition** — SM-2 algorithm for vocab/phrase reviews
- 🎯 **Pronunciation scoring** — Levenshtein-based similarity, per-word feedback
- 💬 **Real-time corrections** — grammar, spelling, word choice
- 🏆 **20 achievements** — badges, streaks, daily goals
- 📖 **Dictionary** — full word entries with synonyms, antonyms, examples
- 🗂️ **Vocabulary Vault** — 20 categories × 25 words per language
- 🔁 **Live Translate** — voice input → translation + meaning
- 🌐 **12 hint languages** — meanings shown in user's native language
- 💰 **Country-based pricing** — India ₹99, USA $9.99, etc. with UPI QR + PayPal
- 📱 **PWA** — installable on laptop + mobile, auto-updates

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| State | Zustand |
| Animations | Framer Motion |
| Database | Supabase PostgreSQL (Prisma ORM) |
| AI / LLM | z-ai-web-dev-sdk (chat, ASR, TTS) |
| Voice TTS | Native SpeechSynthesis + Google Translate proxy |
| Payments | Razorpay + PayPal + UPI QR |
| Deploy | Vercel |

## 📦 Local Setup (5 min)

```bash
git clone https://github.com/naveenkujur007/-speaklingo-.git
cd -speaklingo-
npm install
```

Create `.env` (copy from `.env.example` and fill values):

```bash
cp .env.example .env
```

Required env vars (see `.env.example`):

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Supabase pooler URL (port 6543, pgbouncer) |
| `DIRECT_URL` | Supabase direct URL (port 5432, for migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret key (server-only) |

Run database setup:

```bash
npm run db:push    # Creates all tables on Supabase
npm run db:generate  # Regenerates Prisma Client (also runs on postinstall)
```

Start dev:

```bash
npm run dev
# → http://localhost:3000
```

## ☁️ Deploy to Vercel (3 min)

### One-time setup (already done for this repo)
1. Push code to GitHub (done)
2. Create Supabase project (done — see env vars above)
3. Run `npm run db:push` locally once to create tables (done)

### Deploy steps
1. Go to https://vercel.com → Login with GitHub
2. **"Add New Project"** → Import `-speaklingo-` repo
3. **Configure Environment Variables** — add all 5 vars from above (Production + Preview + Development)
4. **Deploy** — Vercel auto-detects Next.js, runs `npm install` (triggers `postinstall` → `prisma generate`) and `next build`
5. Live in ~2 minutes!

### Auto-deploys
After the first deploy, every `git push origin main` triggers an automatic redeploy on Vercel.

## 📂 Project Structure

```
├── prisma/
│   └── schema.prisma          # 10 models: Session, Message, Mistake, Lesson,
│                              # LearnedItem, Review, Progress, Streak,
│                              # Achievement, PronunciationAttempt
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker (skipWaiting auto-updates)
│   └── icons/                 # PWA icons (192, 256, 384, 512)
├── src/
│   ├── app/
│   │   ├── api/               # 21 API routes (chat, lesson, TTS, payments, etc.)
│   │   ├── page.tsx           # Main app shell (11 sections)
│   │   └── layout.tsx         # Root layout with PWA metadata
│   ├── components/
│   │   ├── sections/          # Practice, Dictionary, Vocab Vault, etc.
│   │   ├── teacher/           # Robot avatar, voice button, paywall, payments
│   │   └── ui/                # shadcn/ui base components
│   ├── hooks/                 # useAppStore, useChatStore, useToast
│   └── lib/
│       ├── curriculum.ts      # 36 lessons per language, 20 achievements
│       ├── teacher-config.ts  # Lesson prompt builder (9 sections)
│       ├── pricing.ts         # Country → pricing + hint language detection
│       ├── speak.ts           # 3-tier TTS fallback chain
│       └── db.ts              # Prisma client singleton
└── .env.example               # Template for env vars (real .env is gitignored)
```

## 🔐 Owner Mode (Free Premium)

Secret code: `SPEAKLINGO-OWNER-2026`
- Unlocks premium features without payment
- Use sparingly (the code is in `src/lib/owner-mode.ts`)

## 💳 Payment Setup

Country-based pricing is auto-detected via timezone. Override:
- India: ₹99/month, ₹499/year, ₹1999/lifetime
- USA: $9.99/month, $49/year, $199/lifetime
- Other countries: similar tiered pricing

Payment methods:
- **UPI QR** (India): `naveenkujur077-3@okaxis` — user scans, pays, enters transaction ID
- **PayPal** (international): `naveenkujur077@gmail.com`
- **Razorpay** (optional, requires KYC)

To change payment details, edit `src/lib/payment-config.ts`.

## 🚀 Performance Tips

- Lessons are cached by language + level + topic + hintLanguage (first load 12s, cached 0.01s)
- Word of Day cached by language + hintLanguage + date
- Vocab Vault cached by language + category
- TTS uses native browser voices first, then Google proxy, then cloud AI
- Service worker caches static assets

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to Supabase (creates/updates tables) |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:migrate` | Create + apply migration |
| `npm run db:reset` | ⚠️ Reset DB (deletes all data) |

## 🗄️ Database Schema Overview

10 tables, all in PostgreSQL on Supabase:

```
Session 1───* Message
Session 1───* Mistake
Lesson (standalone)
LearnedItem 1───1 Review
Progress (unique per language+nodeId)
Streak (unique per language)
Achievement (unique per code+language)
PronunciationAttempt
```

## 📞 Support

- **Owner:** Naveen Kujur
- **Email:** naveenkujur077@gmail.com
- **GitHub:** https://github.com/naveenkujur007/-speaklingo-

## 📝 License

MIT — feel free to fork and learn from this project. Don't resell as-is.

---

**Made with ❤️ by Naveen Kujur**
