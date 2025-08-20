# xilbee-agents-106

Minimal admin backoffice for AI agent billing/usage.

## Tech
- Next.js 14 (App Router, TS), React 18, TailwindCSS
- Prisma 5 (Postgres)
- Auth: Custom cookie JWT (jose), bcryptjs (single admin)
- Node 18+ (Railway)
- Output: `standalone`

---

## Local Setup (VS Code)

```bash
cp .env.example .env
npm i
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
# login: admin@xilbee.com / admin123456
```

### Useful scripts
- `npm run dev` – local dev
- `npm run build` – Next build
- `npm run start` – Next start (binds $PORT)
- `npm run migrate:deploy` – apply Prisma migrations (prod-safe)
- `npm run start:prod` – run migrations then start Next
- `npm run db:seed` – seed admin + demo data

---

## Environment Variables

Set these locally in `.env` and on Railway (Service → Variables):

```
DATABASE_URL=postgresql://...  # Railway Postgres URL
APP_TIMEZONE=Asia/Manila
AUTH_SECRET=replace-with-strong-random-secret

INGEST_SHARED_KEY=replace-with-ingest-key       # header: x-ingest-key
MAKE_SHARED_KEY=replace-with-make-key           # header: x-make-key
MAKE_ELEVENLABS_WATCH_URL=https://hook.us2.make.com/...
MAKE_STRIPE_ONE_TIME_CHARGE_URL=https://hook.us2.make.com/...

ADMIN_EMAIL=admin@xilbee.com
ADMIN_PASSWORD=admin123456
```

---

## Deploy to Railway (via GitHub)

### 1) Push to GitHub
In VS Code terminal:
```bash
git init
git add -A
git commit -m "xilbee-agents-106 initial"
# EITHER using GitHub CLI:
gh repo create xilbee-agents-106 --public --source=. --remote=origin --push
# OR create on GitHub, then:
# git remote add origin https://github.com/<you>/xilbee-agents-106.git
# git branch -M main
# git push -u origin main
```

### 2) Create Railway Project
- Go to **Railway.app → New Project → Deploy from GitHub**
- Select your `xilbee-agents-106` repo

### 3) Add Postgres
- In the Railway project, **Add Plugin → PostgreSQL**
- Copy the generated **DATABASE_URL** into your service **Variables**

### 4) Configure Service
- **Build Command:** `npm run build`
- **Start Command:** `npm run start:prod`  
  (runs `prisma migrate deploy` then `next start -p $PORT`)

> Note: `@prisma/client` and `prisma` are in dependencies; Prisma CLI will be available at runtime.

### 5) Set Variables (Service → Variables)
- Paste your vars from the section above.
- Ensure `AUTH_SECRET` is a long random string.

### 6) Deploy
- Trigger a deploy
- Open the Railway URL → `/login`

### 7) (Optional) Seed in Production
If you didn’t seed locally and want demo data:
- Open a **Shell** in the service and run:
```bash
npm run db:seed
```
(uses `tsx` to run `prisma/seed.ts`)

### 8) Point Make.com Webhooks
Update your Make scenarios to post to your Railway base URL:
- `POST https://<your-app>.up.railway.app/api/ingest/usage`
- `POST https://<your-app>.up.railway.app/api/ingest/summary`
- Webhook receiver: `POST https://<your-app>.up.railway.app/api/webhooks/charge-result`
  - Header: `x-make-key: MAKE_SHARED_KEY`

---

## Health Check
`GET /api/health` → `{ ok: true }`

---

## Notes
- Protected routes are enforced by `src/middleware.ts`.
- Auto-bill is **enabled** when both `cus_*` and `pm_*` are present on a Client.
- Decimal form inputs are accepted as strings and cast to Prisma `Decimal` in API handlers.
- Dates are stored in UTC and rendered with `toLocaleString()`.
