# Document Management System (DMS) — Backend

A complete NestJS + TypeORM + PostgreSQL backend for a Document Management
System with Admin, Manager, and Employee roles, JWT auth, forced
first-login password changes, folders, documents with versioning and
attachments, search, and role-based dashboards.

This has been built and functionally tested end-to-end (login, first-login
password flow, folder CRUD, document upload/download/versioning/attachments,
soft delete/restore, search, and role/department permission checks) against
a real PostgreSQL instance.

## 1. Requirements

- Node.js 18+
- PostgreSQL 14+

## 2. Setup

```bash
npm install
cp .env.example .env   # edit DB credentials / JWT secret as needed
```

Create the database referenced in `.env` (default `dms_db`):

```sql
CREATE DATABASE dms_db;
```

The app uses `synchronize: true` in `TypeOrmModule.forRootAsync` (see
`src/app.module.ts`), so tables are created automatically on first boot.
**This is for development only** — switch to migrations before production use.

## 3. Seed the database

Creates the 3 roles, 5 departments, the pre-seeded admin account, and 5
default categories.

```bash
npm run seed
```

Pre-seeded admin login: **admin@dms.com / admin123** (does not require a
password change).

## 4. Run

```bash
npm run start:dev     # watch mode
# or
npm run build && npm run start:prod
```

API base URL: `http://localhost:3000/api`

## 5. Typical flow

1. `POST /api/auth/login` as admin.
2. `POST /api/users` to create Manager/Employee accounts (temporary password,
   `must_change_password` is set to `true` automatically).
3. That user logs in — response includes `mustChangePassword: true`. All
   endpoints except `login`, `logout`, `change-password`,
   `force-change-password`, `reset-password*`, and
   `check-password-required` are blocked (403) until they call:
   `PATCH /api/auth/force-change-password` with `{ "newPassword": "..." }`.
4. Admin/Manager create folders (`POST /api/folders`, department-scoped for
   Managers). Admin must supply `departmentId` in the body since they can
   create folders in any department.
5. Any user uploads documents into a folder they can access:
   `POST /api/documents` (multipart form: `file`, `name`, `description`,
   `folderId`, `categoryId`).
6. Downloads, versions, attachments, search, trash/restore, and dashboards
   are available per the endpoint list below.

## 6. Permission model (enforced in the service layer, not just guards)

| Action | Admin | Manager | Employee |
|---|---|---|---|
| Manage users | ✅ | ❌ | ❌ |
| Manage departments | ✅ | ❌ | ❌ |
| Manage categories | ✅ | ❌ | ❌ (read allowed, needed for uploads) |
| Manage folders | ✅ any dept | ✅ own dept only | ❌ view only |
| View documents | ✅ any dept | ✅ own dept | ✅ own dept (read‑only for others' docs) |
| Create/edit/delete own documents | ✅ | ✅ (dept docs) | ✅ (own only) |
| Permanent delete | ✅ | ❌ | ❌ |
| Move document | ✅ (any dept) | ✅ (within dept) | ✅ (own doc, within dept) |

Notes / interpretation calls made where the spec was silent:
- Categories are readable by all authenticated users (needed to pick a
  category when uploading a document); only Admin can create/update/delete
  them.
- Employees may soft-delete/restore documents they own; Managers may
  soft-delete/restore any document in their department; only Admin can
  permanently delete.
- Moving a document across departments is restricted to Admin.
- `POST /api/auth/reset-password` issues a signed, short-lived JWT reset
  token directly in the response instead of emailing it, since no email/SMTP
  service was specified in the requirements. Swap this for a real mailer in
  production.

## 7. Project structure

Matches the structure requested in the spec:

```
src/
├── main.ts, app.module.ts
├── common/{decorators,guards,filters,interceptors,interfaces,utils}
├── config/configuration.ts
├── migrations/seed-database.ts
└── modules/{auth,users,departments,roles,categories,folders,documents,dashboard}
```

Each feature module follows the standard Nest pattern: `*.module.ts`,
`*.controller.ts`, `*.service.ts`, `entities/`, `dto/`.

## 8. Full endpoint list

See the original spec's endpoint table — every endpoint listed there is
implemented, plus a couple of small additions:
- `GET /api/documents/trash` — list soft-deleted documents visible to the
  caller (used by the restore/permanent-delete flows).
- `GET /api/documents/:id/preview` — inline preview (sets `Content-Type`
  and streams the file instead of forcing a download).

## 9. Security implementation notes

- Passwords hashed with bcrypt (10 salt rounds).
- JWT auth via Passport (`passport-jwt`), global `JwtAuthGuard` +
  `RolesGuard` + `PasswordChangeGuard` (see `app.module.ts`), with
  `@Public()` and `@SkipPasswordCheck()` decorators for the auth endpoints
  that must remain reachable before login / before a password change.
- `User.password` is marked `@Exclude()` and stripped from every response
  via a global `ClassSerializerInterceptor`.
- File uploads use `multer` memory storage with a `fileFilter` restricted to
  PDF/JPEG/PNG/Word and a 10MB size limit (configurable via `.env`), then
  written to `./uploads/<documents|attachments>/<documentId>/...` by
  `FileStorageService`.
- Every document/folder read and write goes through explicit permission
  checks in the service layer (`FoldersService`, `DocumentsService`) — not
  just route-level `@Roles()` — so department and ownership rules are
  enforced even when the caller's role would otherwise be allowed to hit the
  endpoint.
