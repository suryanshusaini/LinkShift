# LinkShift v2

LinkShift is a practical, production-oriented URL shortener built as a MERN monorepo. The v2 interface uses a tape-measure visual language: long links go in, compact links come out, with link management and click analytics for signed-in users.

## Stack

- Frontend: React 19, Vite, Tailwind CSS v4, React Router, Lucide
- Backend: Node.js, Express 5, MongoDB/Mongoose
- Auth: JWT, bcrypt, Google Identity Services
- Caching: Redis with graceful MongoDB fallback
- Email: Nodemailer SMTP for password recovery
- Analytics: MongoDB click events with aggregate device, browser, OS and referrer reporting

## Features

- Anonymous URL shortening with abuse/rate limits
- Authenticated link creation and dashboard management
- Custom aliases with availability checking
- Destination editing, enable/disable and expiry
- Soft-delete with undo/restore
- 30-day inactivity retention using a MongoDB TTL index
- Redis redirect caching with expiry-aware TTLs
- Atomic click counting
- Privacy-conscious click analytics without storing visitor IP addresses
- Analytics timeline, referrer, device, browser and OS breakdowns
- QR-code generation
- Email password recovery with hashed, expiring reset tokens
- Google sign-in when configured
- Light/dark theme and responsive mobile UI
- Helmet security headers, CORS allow-list and API rate limiting
- Health endpoint reporting MongoDB and Redis state
- GitHub Actions build/syntax checks

## Local development

### Prerequisites

- Node.js 22+
- MongoDB (local or Atlas)
- Redis is optional; when unavailable, redirects continue through MongoDB
- A Google OAuth client is optional
- SMTP credentials are optional in development

### Backend

~~~bash
cd backend
npm install
cp .env.example .env
npm run dev
~~~

Required backend variables:

~~~env
MONGO_URI=mongodb://localhost:27017/linkshift
JWT_SECRET=use-a-long-random-secret
FRONTEND_URL=http://localhost:5173
~~~

Optional:

~~~env
REDIS_URL=redis://127.0.0.1:6379
GOOGLE_CLIENT_ID=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=LinkShift <no-reply@example.com>
~~~

### Frontend

~~~bash
cd frontend
npm install
cp .env.example .env
npm run dev
~~~

Default frontend variables:

~~~env
VITE_API_URL=http://localhost:8000
VITE_SHORT_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=...
~~~

Open the Vite URL shown in the terminal, normally http://localhost:5173.

## API surface

### Public

- POST /api/shorten
- GET /api/alias/check
- GET /:shortId
- GET /health

### Auth

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/google
- GET /api/auth/me
- POST /api/auth/forgot-password
- POST /api/auth/reset-password
- POST /api/auth/logout
- DELETE /api/auth/account

### Authenticated link management

- GET /api/urls
- GET /api/urls/:id
- GET /api/urls/:id/analytics
- PATCH /api/urls/:id
- DELETE /api/urls/:id
- POST /api/urls/:id/restore

## Production notes

1. Set a strong random JWT_SECRET.
2. Set FRONTEND_URL to the exact production frontend origin.
3. Configure SMTP before enabling production password recovery.
4. Configure Google OAuth with the production client ID if Google sign-in is enabled.
5. Use a managed MongoDB and Redis instance in production.
6. Set VITE_SHORT_BASE_URL to the public short-link origin.
7. Put the backend behind HTTPS and a reverse proxy/load balancer.
8. Keep Redis optional at the application layer; a Redis outage should not make existing links unavailable.

## Verification

~~~bash
cd frontend
npm run build

cd ../backend
node --check server.js
node --check routes/auth.js
node --check routes/url.js
node --check routes/redirect.js
node --check config/redis.js
node --check models/ClickEvent.js
node --check utils/analytics.js
~~~

The feature/linkshift-v2 branch contains the v2 implementation. The main branch is not modified by this work.
