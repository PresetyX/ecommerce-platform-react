# ecommerce-platform-react

Full-stack e-commerce platform built with React, Node.js and TypeScript, featuring real-time inventory updates, payment integration (sandbox gateway) and an admin dashboard.

The catalog and orders live in an in-memory repository (`server/src/store.ts`), seeded with sample products. It is the only persistence boundary, so moving to PostgreSQL means re-implementing that class. Payments go through a `PaymentGateway` interface; the bundled `SandboxGateway` behaves like a provider's test mode, and a real provider can be plugged in without touching the routes.

## Features

- Product catalog with search and live stock badges (Server-Sent Events from `/api/inventory/stream`)
- Cart persisted in `localStorage`, checkout form, paid / declined flows
- Checkout validates stock, reserves it before charging and releases it if the payment fails (no overselling)
- Admin dashboard (bearer token): revenue summary, low-stock list, edit stock, recent orders
- Integration tests for catalog, checkout, payment failure, overselling and admin routes

## Getting started

```bash
npm install
ADMIN_TOKEN=change-me npm run dev:server   # http://localhost:3001
npm run dev:client                         # http://localhost:5173
npm test
npm run typecheck
npm run build
```

Without `ADMIN_TOKEN` the server falls back to `dev-admin-token` and prints a warning.
Test payment tokens: `tok_visa` (approved) and `tok_declined`.

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/products?q=&category=` | Catalog |
| GET | `/api/products/:id` | Product details |
| GET | `/api/inventory/stream` | SSE stream of `{ productId, stock }` |
| POST | `/api/orders` | `{ items, customer, paymentToken }` → 201 / 402 / 409 |
| GET | `/api/orders/:id` | Order lookup |
| GET | `/api/admin/summary`, `/api/admin/orders` | Admin (Bearer token) |
| POST | `/api/admin/products` | Create product |
| PATCH | `/api/admin/products/:id` | Edit price / stock / details |
