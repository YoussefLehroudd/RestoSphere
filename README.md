# RestoSphere

**Smart Restaurant Operating System** — a polished, responsive SaaS for restaurants, built with **HTML, CSS, and Vanilla JavaScript** plus Node.js serverless API and Neon PostgreSQL.

## Features

- Live operations dashboard with revenue, order metrics, analytics and insights
- Interactive floor/table management
- QR-code guest menu and ordering
- Kitchen display board with order lifecycle
- Menu manager and live inventory
- Restaurant booking and staff-friendly operations
- Authentication and restaurant-level data isolation
- Interactive browser demo (no registration required)
- Desktop, tablet and mobile responsive layout

## Run locally

1. Install Node.js 20+, then `npm install`.
2. Create a Neon PostgreSQL database, execute `schema.sql`.
3. Set `DATABASE_URL` in Vercel project environment variables (do not commit credentials).
4. Run `npx vercel dev` to serve both the static frontend and `/api` serverless function.
5. Open localhost and create a restaurant account. Alternatively click **Explore demo** to test the interface without a DB.

The in-browser demo uses localStorage and sample data; real restaurant users, their orders and QR menus require the PostgreSQL-backed API.

## Deployment

The repository is intended for a GitHub-connected Vercel project using `vercel.json` and `api/index.js`. Add a secure `DATABASE_URL` to Production, Preview and Development as needed before deploying.

## Security

Passwords are scrypt-hashed with per-user salt, sessions use random opaque HttpOnly cookies, staff API routes check the signed-in user's organization, and guest prices are computed server-side. Use HTTPS for production. The demo is a prototype; add monitoring, transactional stock accounting, advanced rate limits and payment processing before production-critical usage.

## License

Proprietary prototype by Youssef Lehroud.