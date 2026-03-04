# Next LMS (Monorepo)

A monorepo for an LMS-style web application built with Next.js and a shared UI/component workspace.

> **Status:** Deprecated — this repository is no longer actively maintained.
> **New project:** https://uyrenai.kz (the product has moved there)

---

## LMS project summary

This codebase is a Learning Management System (LMS) prototype/iteration focused on:

- Course and lesson authoring
- Rich-text editing for educational content
- Authentication and user sessions
- Payments/subscriptions (Stripe)
- Internationalization (multi-language UI)

It is organized as a monorepo so the web app can share UI components and business logic packages.

---

## What’s inside

This repository is a **pnpm workspace** + **Turborepo** monorepo:

- `apps/web` — Next.js web application
- `packages/*` — shared workspace packages (UI, utilities, common logic, etc.)

---

## Tech stack (high-level)

- **Frontend:** Next.js, React, shadcn/ui-style components
- **API:** tRPC
- **Auth:** NextAuth + Firebase (client/admin)
- **Database:** MongoDB + Mongoose
- **Cache/Queue (optional):** Redis (ioredis)
- **Payments:** Stripe
- **i18n:** i18next
- **Editor:** TipTap (plus workspace editor package)

---

## Requirements

- Node.js **>= 20**
- pnpm **10.x**
- (Optional) Docker, if you use the provided `docker/` setup

---

## Getting started

Install dependencies:

```bash
pnpm install
```

Run the development environment (Turborepo):

```bash
pnpm dev
```

Build:

```bash
pnpm build
```

Lint:

```bash
pnpm lint
```

Format:

```bash
pnpm format
```

---

## Notes

- Environment variables are required for services like MongoDB, Firebase, NextAuth, Stripe, etc.
  Check `apps/web` for `.env` usage and configure accordingly.
- Main application entrypoint is `apps/web`.
- Workspace scripts are run from the repository root via Turborepo.

---

## Deprecation notice

This repository is **deprecated** and is kept for reference only.

The actively maintained project is **https://uyrenai.kz**.
