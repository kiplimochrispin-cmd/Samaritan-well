# Samaritan Well Website (Node.js + SQLite)

Responsive website project for **Santa Shepherds Water (Samaritan Well)** with a storefront checkout flow and an admin orders dashboard.

## Pages
- Home + Shop (`/` or `/index.html`)
- Programs (`/programs.html`)
- Contact Us (`/contact.html`)
- Admin Orders (`/admin.html`)

## Features
- Product selection and order summary on the storefront
- Checkout form with customer and payment details
- Backend order API with SQLite persistence
- Admin order queue with live status updates
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

Open:
- `http://localhost:8080`

## Deployment
- See [`DEPLOYMENT.md`](./DEPLOYMENT.md)

## Project notes
- `data/*.db` is ignored by git.
- Protect `admin.html` before production deployment.
- Use a real payment gateway before live card payments.

## Repository
- https://github.com/chrispinKiplimo/Samaritan-well
