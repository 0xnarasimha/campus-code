This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy

```bash
npm install
npm run lint
npm run build
npm start
# or deploy directly:
vercel deploy
vercel --prod
```

Node version: v24.21.0 (use Node 20+; developed and built on Node 24).

## Routes

| Route          | Screen              |
| -------------- | ------------------- |
| `/`            | Campus feed         |
| `/study`       | Study location hub  |
| `/leaderboard` | Campus leaderboard  |
| `/messages`    | Peer messages       |
| `/profile`     | Developer profile   |

## Deploy (Neon + Vercel)

1. Create a [Neon](https://neon.tech) project (PostgreSQL) and copy the
   pooled connection string.
2. Generate the auth secret:

```bash
openssl rand -base64 32
```

3. Put both into `.env.local` (local) and the Vercel project environment
   (Production + Preview):

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
AUTH_SECRET="<output of openssl rand -base64 32>"
```

4. Run migrations and seed:

```bash
npx prisma migrate dev
npm run db:seed
```

5. Seed credential note (dev-only): every seeded user has password
   `devdb1234` (bcrypt cost 12) and email `<handle>@mbu.edu`.
   Change or remove these accounts after testing — never use this
   password in production.

## Google OAuth (optional, fail-soft)

Without `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`, the app is
credentials-only and no Google button renders. To enable
"Continue with Google":

1. Open [Google Cloud console](https://console.cloud.google.com) →
   APIs & Services → Credentials → Create Credentials → OAuth client ID
   (type: Web application).
2. Under Authorized redirect URIs, add:
   - `http://localhost:3001/api/auth/callback/google` (local dev)
   - `https://<your-production-domain>/api/auth/callback/google`
3. Copy the client ID + secret into `.env.local` (local) and the Vercel
   project environment (Production + Preview):

```bash
GOOGLE_CLIENT_ID="<your-client-id>"
GOOGLE_CLIENT_SECRET="<your-client-secret>"
```

4. Redeploy / restart. A Google sign-in with the same verified email as
   an existing credentials account links to that account.
