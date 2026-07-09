# Ledger — DMS Frontend

A Next.js 14 (App Router, TypeScript) frontend for the NestJS Document
Management System backend. Every request goes through the native `fetch`
API in `lib/api.ts` — no axios, no data-fetching library, just a small
typed wrapper per endpoint in `lib/endpoints.ts`.

This has been built and verified end-to-end: `npm run build` compiles
clean (TypeScript strict-enough mode + Next's production build), and every
route was smoke-tested against a live instance of the NestJS backend
(login screen, dashboard, users, departments, categories, folders,
documents, trash, and the dynamic document detail page all render without
server errors).

## 1. Requirements

- Node.js 18+
- The DMS backend running (see the backend's own README) — default
  `http://localhost:3000/api`

## 2. Setup

```bash
npm install
cp .env.local.example .env.local   # edit if your API isn't on localhost:3000
npm run dev
```

Visit `http://localhost:3000` (or whatever port you choose — the backend
also defaults to 3000, so run the frontend on a different port, e.g.
`npm run dev -- -p 3001`, if you're running both locally).

## 3. How auth works

- `POST /auth/login` response (`accessToken`, `mustChangePassword`, `user`)
  is stored in `localStorage` by `lib/auth-context.tsx`.
- Every `fetch` call in `lib/api.ts` attaches `Authorization: Bearer <token>`
  automatically.
- A 401 response anywhere clears the session and hard-redirects to `/login`.
- `components/RequireAuth.tsx` wraps every protected page: it redirects to
  `/login` if there's no session, and to `/force-change-password` if the
  backend says `mustChangePassword: true` — mirroring the backend's
  `PasswordChangeGuard`.
- Role-gated pages (`/users`, `/departments`) pass `allow={['Admin']}` to
  `RequireAuth`, which shows an "Access restricted" message for other
  roles instead of the page content. (The backend enforces this for real —
  the frontend gate is just UX, not the security boundary.)

**Note:** storing the JWT in `localStorage` is the simplest approach for a
fetch-driven SPA and is fine for this project's scope. For a production
deployment you'd likely move to an httpOnly cookie + Next.js middleware
instead, to protect against XSS token theft.

## 4. Pages

| Route | Purpose |
|---|---|
| `/login` | Sign in |
| `/force-change-password` | First-login forced password reset |
| `/` | Role-specific dashboard (Admin / Manager / Employee) |
| `/documents` | Browse + search + upload documents, filter by folder |
| `/documents/[id]` | Metadata, versions (upload/download/restore), attachments, move, delete |
| `/documents/trash` | Restore or permanently delete (Admin) soft-deleted documents |
| `/folders` | Folder tree — create/rename/delete (Admin any dept, Manager own dept) |
| `/categories` | List (everyone) / manage (Admin) |
| `/departments` | Admin only |
| `/users` | Admin only — create accounts, assign role/department, disable, force password reset |

## 5. Project structure

```
app/                  Next.js App Router pages (all client components)
components/           Shared UI: AppShell, RequireAuth, Modal, ConfirmDialog, FileDrop, EmptyState
lib/
  api.ts              Core fetch wrapper (auth header, error handling, file download)
  endpoints.ts         One typed function per backend endpoint
  auth-context.tsx     Session state (token, user, mustChangePassword)
  toast-context.tsx    Lightweight notification system
  types.ts             Types mirroring the backend entities
  format.ts             formatBytes / formatDate / initials / fileTypeLabel helpers
```

## 6. Design

A "filing ledger" visual identity distinct from generic AI-generated
defaults: deep ink-green + brass accents, a serif display face (Fraunces)
for headings paired with Inter for UI text and IBM Plex Mono for
timestamps/data, folder-tab shaped active nav + document cards with a
paper corner-fold detail. All from `app/globals.css` as CSS custom
properties — no CSS framework.

## 7. Known simplifications

- No pagination on document/user lists (matches the backend, which doesn't
  paginate either).
- Password-reset-by-email is stubbed on the backend (returns the token
  directly rather than emailing it) — the frontend doesn't have a
  "forgot password" screen wired up since there's no email delivery to
  demo it against; the backend endpoints exist if you want to add one.
- Folder view only shows a client-side tree from `GET /folders/tree`; large
  department hierarchies aren't virtualized.
