# 🚀 SpeakLingo Deployment Guide (FREE — 0 ₹)

## Tumhe bas 3 cheezein chahiye:

### 1. GitHub Account (free)
- https://github.com → Sign up (agar nahi hai)
- Tumhara GitHub username chahiye

### 2. Vercel Account (free)
- https://vercel.com → "Login with GitHub"
- Direct GitHub se login karo

### 3. (Optional) Supabase Account (free)
- Sirf agar database chahiye (lessons cache, progress save)
- Bina Supabase ke bhi app chalega — lessons AI se fresh generate hote hain

---

## 📋 Steps (5 minute me live):

### Step 1: GitHub pe code push karo

Tumhara code already git me committed hai. Bas GitHub pe push karna hai:

```bash
# 1. GitHub pe naya repo banao (browser me):
#    https://github.com/new
#    Name: speaklingo
#    Private ya Public (jo chaaho)
#    "Create repository"

# 2. Terminal me ye commands chalao:
cd /home/z/my-project
git remote add origin https://github.com/TUMHARA-USERNAME/speaklingo.git
git branch -M main
git push -u origin main
```

### Step 2: Vercel pe deploy karo

1. https://vercel.com → "Login with GitHub"
2. "New Project" → "Import" your `speaklingo` repo
3. Framework: **Next.js** (auto-detected)
4. Environment Variables (optional):
   - `DATABASE_URL` = (Supabase URL agar database chahiye, warna chhodo)
5. **"Deploy"** dabao → 2 minute me LIVE! ✅

### Step 3: URL milega
- Free subdomain: `speaklingo.vercel.app`
- Ye link share karo WhatsApp/Instagram/YouTube pe!

### Step 4: Custom domain (jab paisa ho)
1. `speaklingo.app` kharido (GoDaddy/Namecheap, ₹800/year)
2. Vercel → Project → Settings → Domains → Add domain
3. DNS update karo (Vercel instructions dega)
4. Free SSL automatic!

---

## 🔄 Update Flow (jab code badlo):

1. Code change karo
2. `git add -A && git commit -m "update" && git push`
3. Vercel auto-build (2 min) → LIVE!
4. PWA users ko auto-update milta hai (service worker `skipWaiting`)

---

## 💰 Cost:

| Item | Cost |
|------|------|
| GitHub | FREE |
| Vercel hosting | FREE (100GB/mo) |
| Vercel subdomain | FREE |
| SSL | FREE |
| Supabase (optional) | FREE (500MB) |
| Custom domain | ₹800/year (optional) |
| **Total (without domain)** | **₹0** |

---

## ⚠️ Database Note:

- **Bina database**: App chalega, lessons AI se fresh generate hote hain, progress localStorage me
- **Supabase ke saath**: Lessons cache hote hain (faster), progress server-side save hota hai

Supabase setup (optional):
1. https://supabase.com → free account
2. New project banao
3. Settings → Database → Connection string copy
4. Vercel environment variables me `DATABASE_URL` set karo
5. `bun run db:push` (local se schema push)
