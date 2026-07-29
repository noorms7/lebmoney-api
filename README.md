# LEBMONEY API

NestJS + Prisma backend implementing the real double-entry ledger, auth, wallet, transactions, KYC, and now the full Admin Dashboard API.

## Run it

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run start:dev
```

Listens on `http://localhost:3001` by default (see `.env`).

> **Windows users**: if `npm install` previously failed with an `EPERM: operation not permitted, rmdir` error, that was caused by `@nestjs/cli`'s own nested dependency tree (`@angular-devkit/schematics`) hitting Windows path/file-lock issues — it's been removed entirely (the app doesn't need it; plain `tsc`/`ts-node-dev` build and run it just as well). If you still hit install issues: run from a short, non-synced path (avoid folders under XAMPP/OneDrive), and delete `node_modules` + `package-lock.json` fully before retrying.

> **If you previously saw `Prisma schema validation` errors about enums**: SQLite (used here for local dev) doesn't support native Prisma enums at all — that was a real bug in the schema, now fixed. Every field that would've been an enum is a validated `String` instead, with allowed values defined once in `src/common/enums.ts`.

> **If you previously saw `Cannot find module '@/common/...'`**: the `@/` path alias needed extra tooling to resolve at runtime, which `@nestjs/cli` was quietly providing before. All imports are now plain relative paths (`../common/...`) — no extra tooling needed, and this class of error can't recur.

> **Note**: `prisma generate` needs to download a query-engine binary from `binaries.prisma.sh`. If you're behind a restrictive network/proxy, this is the most common thing to check first.

## Customer-facing endpoints (used by lebmoney-mobile)

| Endpoint | Purpose |
|---|---|
| `POST /auth/otp/request` | Send (mock) OTP to a phone number |
| `POST /auth/otp/verify` | Verify OTP, issues a JWT, creates the user + Tier 0 wallet on first login |
| `GET /users/me` | Current user profile |
| `PATCH /users/me` | Update name/email |
| `GET /wallet/balances` | Multi-currency balances (derived live from ledger entries, never a stored field) |
| `POST /wallet/currencies` | Add a currency account |
| `POST /transactions/send` | Send money — real double-entry ledger write, fee routed to the platform account |
| `GET /transactions/history` | Ledger-entry history for the current user |
| `POST /kyc/submit` | Submit a Tier 1/2 upgrade request |

All of the above (except `/auth/*`) require `Authorization: Bearer <token>`.

## Admin endpoints (used by lebmoney-admin)

All admin endpoints require `x-admin-key: <ADMIN_API_KEY>` (see `.env`; defaults to `dev-only-admin-key`). Pass `x-admin-email` too — it's attributed to every audit log entry as the acting admin (a placeholder for real SSO-based identity).

| Endpoint | Purpose |
|---|---|
| `GET /admin/overview` | Dashboard KPIs |
| `GET /admin/users?q=` | Search/list users |
| `GET /admin/users/:id` | User detail + balances |
| `PATCH /admin/users/:id/status` | Freeze/unfreeze/close an account |
| `GET /admin/transactions?flagged=true` | Transaction monitoring feed |
| `GET /admin/transactions/:id` | Transaction detail |
| `PATCH /admin/transactions/:id` | `{ action: "clear_flag" \| "reverse" }` |
| `POST /admin/transactions/:id/annotate` | `{ note }` — recorded in the audit log |
| `GET /admin/tickets` / `GET /admin/tickets/:id` | Support ticket queue + detail |
| `POST /admin/tickets/:id/reply` | `{ text }` |
| `POST /admin/tickets/:id/resolve` | Mark resolved |
| `GET /kyc/admin/pending` | KYC review queue |
| `POST /kyc/admin/:id/review` | `{ approve: boolean }` — actually updates the user's `kycTier` on approval |
| `GET /admin/billers` / `POST /admin/billers` / `PATCH /admin/billers/:id/toggle` | Biller management |
| `GET /admin/perks` / `POST /admin/perks` / `PATCH /admin/perks/:id/toggle` | Perks/offers management |
| `GET /admin/roles` / `POST /admin/roles` / `PATCH /admin/roles/:id` | Internal role assignment |
| `GET /admin/audit-log` | Full audit trail — every mutating admin action above writes here |

## Known simplifications (flagged, not hidden)
- **Fee/FX accounting**: only simple balanced transfers + a flat platform fee are modeled. Real fee-tiering, FX suspense accounts, and reversal-with-re-ledgering are follow-up work — see `LedgerService`'s doc comment.
- **Admin auth**: a static API key + a self-reported email header, not real SSO/session-based identity. `AdminAccount`/roles exist as data but aren't yet enforced (e.g. a Support Agent can currently call every admin endpoint, same as a Super Admin).
- **OTP delivery**: logged to the server console, not sent via a real SMS provider.
- **JWT**: 15-minute expiry, no refresh-token flow yet.

## Seed data
`npm run seed` creates:
- `@system` — platform fee-revenue account
- `@rami` (+96131234567) — seeded with a $500 USD balance
- `@layal` (+96170555123)
- 3 billers, 2 perks, 2 admin accounts, 1 open support ticket, 1 flagged demo transaction
