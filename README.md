# LinkShift

A clean, blue-themed URL shortener built with React, Vite, Tailwind CSS, Node.js, Express and MongoDB. This repository's `main` UI remains the design source of truth.

## Features

- Short links for guests and signed-in users
- Custom aliases with reserved-name validation
- Owner-scoped link management
- URL validation that rejects local/private/reserved destinations
- Email OTP verification for new password-based signups
- Google sign-in when configured
- HTTP-only cookie sessions with server-side revocation
- CSRF protection for authenticated state-changing requests
- Single-use password reset links with expiry
- Password changes revoke existing sessions
- Credentialed CORS allow-list and Helmet security headers
- Rate limiting for authentication, verification and link creation
- Backend security regression tests and GitHub Actions CI

## Local development

Prerequisites: Node.js 22+, MongoDB running locally or a MongoDB Atlas URI. SMTP and Google OAuth are optional for local development.

### Backend

```bash
cd backend
npm ci
cp .env.example .env
npm run dev
```

Set these values in `backend/.env`:

```dotenv
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/linkshift
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
FRONTEND_URL=http://localhost:5173
SHORT_BASE_URL=http://localhost:8000
REDIS_URL=redis://127.0.0.1:6379
```

Generate a local secret with `openssl rand -base64 48`. Never commit real secrets.

### Frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

For local testing, `frontend/.env` should contain:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Open the URL printed by Vite, normally http://localhost:5173. If you change an environment file, restart Vite.

### Email verification and password recovery

SMTP is optional in development. When SMTP is not configured, OTPs and reset tokens are returned only in development responses for local testing. Production requires `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, and preferably `SMTP_FROM`.

### Production deployment

- Configure `FRONTEND_URL` to the exact deployed frontend origin (comma-separated origins only when deliberately needed).
- Configure SMTP before deploying; email is required for signup verification and recovery.
- Configure `VITE_API_URL` to the deployed API base URL.
- Use HTTPS for both frontend and API. Production session cookies are `Secure`, `HttpOnly`, and `SameSite=None`.
- Vercel and Render default hostnames are cross-site. Browser third-party-cookie restrictions can prevent sessions from working reliably across them. Prefer a same-site custom-domain setup or a same-origin API proxy, and verify browser behavior before release.
- Do not configure wildcard CORS for credentialed requests.
- Update production environment variables before enabling the new authentication routes.

## API highlights

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/csrf`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `POST /api/auth/logout`
- `DELETE /api/auth/account`
- `POST /api/shorten`
- `GET /api/urls`
- `DELETE /api/:id`
- `GET /:shortId`

## Verification

```bash
cd backend
npm ci
npm test
node --check server.js
node --check routes/auth.js
node --check routes/url.js

cd ../frontend
npm ci
npm run build
npm run lint
```
