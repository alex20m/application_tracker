## 🚀 Application Tracker MVP - Quick Start Guide

**Status**: ✅ MVP ready to deploy  
**Last Built**: 20 May 2026  
**Build Status**: Passing

---

## What You Have

A **complete, production-ready MVP** for a cross-device job application tracker:

✅ **Next.js 16** with App Router + TypeScript + Tailwind  
✅ **Supabase** backend (Postgres + Auth + RLS)  
✅ **Installable PWA** for iPhone and desktop  
✅ **Real-time sync** across devices in one account  
✅ **Sankey visualization** of application status flow  
✅ **Full CRUD** for job applications  
✅ **Email/password + 6-digit OTP auth** ready to go  

---

## 🎯 Next Steps (In Order)

### Step 1: Create Supabase Project (5 min)

1. Go to [supabase.com](https://supabase.com) → Sign up/login
2. Click **"New Project"** → Choose region, set password
3. Wait for project to initialize (~1 min)

### Step 2: Connect Supabase to GitHub (2 min)

1. In Supabase dashboard, open your project
2. Go to **GitHub integration**
3. Connect your GitHub account + select this repo
4. Confirm auto-deploy of migrations is enabled

### Step 3: Set Up Supabase Database as Code (10 min)

1. Install Supabase CLI (if needed):
   - macOS (Homebrew): `brew install supabase/tap/supabase`
2. From repo root, initialize local Supabase config:
   - `supabase init`
3. Link local project to your hosted Supabase project:
   - `supabase link --project-ref <your-project-ref>`
4. This repo already includes the initial migration:
   - `supabase/migrations/20260520000100_init_schema.sql`
5. Apply it to your linked Supabase project:
   - `npm run db:push`
6. Commit and push to GitHub. Supabase will deploy any future migrations automatically.
7. For future DB changes, always create a new migration file:
   - `supabase migration new <change_name>`
   - then commit + push

### Step 4: Configure Supabase Auth (5 min)

1. Go to **Authentication** → **Providers**
2. Confirm **Email** is enabled (toggle on)
3. Click **Email/Password** → toggle **"Confirm email"** OFF (for MVP)
4. Go to **URL Configuration**
5. Add under **Redirect URLs**: `http://localhost:3000/auth/callback`
6. If deploying to Vercel later, also add: `https://your-domain.vercel.app/auth/callback`

### Step 5: Get Supabase Credentials (2 min)

1. In Supabase dashboard → **Project Settings** → **API**
2. Copy:
   - **Project URL** (shown at top)
   - **Anon Public Key**

### Step 6: Configure App Environment (2 min)

1. Open `.env.local` in the repo root
2. Replace with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save file

### Step 7: Run Locally (2 min)

```bash
cd /Users/alexm/Kodning/application_tracker
npm run dev
```

Open http://localhost:3000 → You'll see the login page.

**Test Sign-Up Flow:**
1. Click "Use Password" on login
2. Enter any email + password
3. Click "Sign In" → You're logged in!
4. Click "+ Add Application" → Fill form → See it listed
5. Click app to edit/delete
6. Go to "Sankey" page → See diagram as you add more apps

---

## 📱 Install on iPhone

1. Open app in **Safari** at http://your-ip:3000
   - (Or deploy to internet-accessible URL first)
2. Tap **Share** icon (bottom middle)
3. Select **"Add to Home Screen"**
4. Name: "App Tracker"
5. Tap **"Add"**
6. App now on home screen with icon!

---

## 🖥 Install on Mac

1. Open app in **Chrome/Edge** at http://localhost:3000
2. Look for **install icon** in address bar (or menu)
3. Click → App opens in standalone window
4. Works like a desktop app

---

## 🚀 Deploy to Vercel (Production)

### One-Click Deploy

1. Push repo to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **"Add New" → "Project"**
4. Select your GitHub repo
5. In **Environment Variables**, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...your-anon-key...
   NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
   ```
6. Click **"Deploy"**
7. Done! App is live at the URL shown.

### Update Supabase Auth Redirect

After deploying to Vercel:
1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Add: `https://your-app.vercel.app/auth/callback`

---

## 📂 Project Structure

```
src/
├── app/
│   ├── api/auth/callback/      # Email confirmation callback
│   ├── login/                  # Sign-in page
│   ├── dashboard/              # Dashboard home
│   ├── applications/           # App list & CRUD
│   ├── sankey/                 # Sankey visualization
│   └── layout.tsx              # Root layout
├── components/
│   ├── app-shell.tsx           # Header + nav
│   ├── application-form.tsx    # Form for adding/editing
│   ├── sankey-chart.tsx        # Sankey diagram
│   └── ...
├── lib/
│   ├── supabase/               # Client/server/middleware
│   ├── auth.ts                 # Auth helpers
│   ├── statuses.ts             # Status types
│   └── ...
└── middleware.ts               # Session middleware
```

---

## 🔑 Key Features

### ✨ Cross-Device Sync

- Sign in on iPhone **and** Mac with same email
- Add app on phone → See it on Mac instantly
- Update status on desktop → Changes sync to phone
- All via Supabase RLS (Row-Level Security)

### 📊 Sankey Visualization

- See how applications flow through statuses
- Updated in real-time as you add/change apps
- Helps identify bottlenecks (e.g., lots rejected at screening?)

### 🔐 Security

- **RLS** ensures users only see their own data
- **Email/password auth** with optional 6-digit email OTP sign-in
- Credentials never sent to client
- Session stored in secure httpOnly cookies

### 📲 Installable

- Works on iPhone, Mac, desktop browsers
- Offline support via service worker (basic)
- Can add to home screen = looks like native app

---

## 🛠 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot find module '@supabase/...'" | Run `npm install` |
| "supabase: command not found" | Install Supabase CLI, then restart terminal |
| Login fails silently | Check `.env.local` has correct Supabase URL + key |
| Auth callback doesn't redirect | Ensure `NEXT_PUBLIC_APP_URL` matches your domain |
| RLS error on fetch | Check your latest migration was deployed successfully |
| Can't install on iPhone | Must use Safari, not Chrome; ensure `manifest.webmanifest` exists |

---

## 📋 Checklist for Going Live

- [ ] Created Supabase project
- [ ] Applied initial migration (`npm run db:push`)
- [ ] Added and pushed migration files in `supabase/migrations/`
- [ ] Configured auth providers (email + password + OTP)
- [ ] Set `.env.local` with correct credentials
- [ ] Tested locally: sign up, create app, view sankey
- [ ] Tested iPhone PWA install
- [ ] Pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Updated Supabase redirect URLs with Vercel domain
- [ ] Tested production: sign up, create apps, sync between devices

---

## 🎨 Customization Ideas (Future)

- Add interview reminders / calendar integration
- Salary tracking per application
- Export to CSV / PDF reports
- Dark mode toggle
- Collaborative mode (share tracker with friend)
- Native iOS/Android apps (React Native)

---

## 📞 Support

- **Supabase docs**: https://supabase.com/docs
- **Next.js docs**: https://nextjs.org/docs
- **Tailwind docs**: https://tailwindcss.com/docs

---

**You're ready to track job applications like a pro!** 🎉
