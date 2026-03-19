# Samaritan Well Website (React + TypeScript + Node.js + SQLite)

Responsive website project for **Santa Shepherds Water (Samaritan Well)** with a React + TypeScript frontend, animated page transitions, and a Node.js + SQLite backend.

## Pages
- Home (`/`)
- Programs (`/programs`)
- Contact Us (`/contact`)
- Admin Orders (`/admin`)

## Features
- Product selection and order summary on the storefront
- Checkout form with customer and payment details
- Backend order API with SQLite persistence
- Admin order queue with live status updates
- React + TypeScript frontend rendered from reusable components
- Animated entrance transitions on the main pages
- Status flow: `pending`, `confirmed`, `dispatched`, `delivered`, `cancelled`

## Run locally
```bash
cd "The samaritan"
npm install
npm run dev
```

Or:
```bash
npm start
```

Build only:
```bash
npm run build
```

Open:
- `http://localhost:8080`

## Deployment
- See [`DEPLOYMENT.md`](./DEPLOYMENT.md)

## Project notes
- `data/*.db` is ignored by git.
- Use a real payment gateway before live card payments.
- Frontend source of truth is now in `src/web/` and `src/main.tsx`.
- Backend source of truth is `src/server.ts`.
- Vite outputs frontend assets into `dist/`.
- TypeScript outputs the backend runtime into `build/`.

## Repository
- https://github.com/chrispinKiplimo/Samaritan-well
