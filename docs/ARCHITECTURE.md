# RebaFlix Architecture

## Layers

- `app/`: Next.js App Router pages and API routes.
- `components/`: reusable UI, content, layout, and player components.
- `hooks/`: client state for auth, favorites, and toasts.
- `lib/`: Prisma, Supabase, validation, rate limiting, catalog queries, recommendations, and storage services.
- `prisma/`: schema, migration SQL, and seed data.

## Core Domains

- Identity: Supabase Auth with mirrored `User`, RBAC `Role`, and `Permission` records.
- Catalog: `Movie`, `Series`, `Season`, `Episode`, `Genre`, `Category`, `Language`, `Subtitle`, and `Person`.
- Live TV: `LiveChannel` and `Schedule` for EPG.
- Engagement: `Favorite`, `WatchLater`, `History`, `Comment`, `Rating`, `Notification`.
- Monetization: `Subscription`, `Payment`, `Advertisement`.
- Intelligence: `Recommendation`, `AnalyticsEvent`, search API, and future embeddings/vector search.

## Production Extensions

- Replace in-memory rate limiting with Redis or Upstash.
- Add Stripe and PayPal webhooks with verified signatures.
- Add signed playback URLs and entitlement checks for premium assets.
- Add a worker pipeline for transcoding uploads into HLS variants.
- Add vector search for AI search and recommendation ranking.
- Add admin CRUD screens for every table exposed in the dashboard.
