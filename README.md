# Rebooked

Rebooked is a full-stack book-donation platform that connects individual donors with schools and NGOs. Donors publish book collections; recipient organisations find suitable listings, reserve the exact quantity they need, and coordinate pickup through a traceable claim lifecycle.

## What it does

- Email/password registration and login, plus Google Identity Services sign-in.
- Persistent, revocable Mongo-backed browser sessions stored in HTTP-only cookies.
- Role-based access for donors, NGOs, schools, and administrators.
- Donor listings with book details, condition, quantity, photos, and private pickup information.
- Searchable/filterable recipient catalogue with quantity-aware reservations.
- Claim workflow: accepted → pickup scheduled → collected, with safe cancellation and restored stock.
- Donor and recipient dashboards, in-app notifications, profile editing, and admin oversight.
- Privacy by default: public listings expose only the donor’s display name and pickup area. Contact/pickup details are shared only with the accepted recipient.

## Roles and workflow

| Role | Primary actions |
| --- | --- |
| Donor | Create/edit/withdraw listings, see incoming claims, confirm a completed handover. |
| NGO / School | Browse available books, reserve a quantity, view secure pickup details, cancel a claim if plans change. |
| Administrator | Review platform metrics, users, and listings; suspend accounts without deleting history. |

Reservations are atomic. A recipient cannot reserve more copies than remain, and a cancelled reservation restores its quantity. Existing legacy roles (`donar`, `organisation`, and `institute`) are recognized as donor, NGO, and school respectively.

## Stack

- React 18 / Create React App
- Express and Mongoose
- MongoDB
- Google Identity Services + server-side Google ID-token verification
- Cookie sessions, Helmet, CORS allow-listing, CSRF protection, and rate limiting

## Local setup

Prerequisites: Node.js 18+ and a MongoDB instance (local MongoDB or MongoDB Atlas).

1. Create environment files from the examples.

   ```powershell
   Copy-Item .env.example .env
   Copy-Item client\.env.example client\.env
   ```

2. In `.env`, set a real `MONGO_URL` and a high-entropy `JWT_SECRET`. For local development, the supplied `CLIENT_URL=http://localhost:3000` and cookie settings are suitable.

3. Install server and client packages.

   ```powershell
   npm install
   npm install --prefix client
   ```

4. Optionally provision the first administrator after setting `ADMIN_EMAIL` and an `ADMIN_PASSWORD` of at least 12 characters in `.env`.

   ```powershell
   npm run seed:admin
   ```

5. Start both development servers.

   ```powershell
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). The CRA proxy sends `/api/v1` requests to the Express server on port 8080.

## Google sign-in setup

Create a Google OAuth **Web application** client in Google Cloud Console. Add the local and production web origins that will host the React client, then put the exact same client ID in both files:

```ini
# .env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# client/.env
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

No Google client secret is used by this ID-token flow. If the client ID is not configured, the interface keeps email/password sign-in available and explains that Google is unavailable.

For an existing email/password account, entering its current password before clicking Google securely links the account. This prevents an unverified, pre-created local account from being silently taken over through a matching Google email.

## Production build and run

The repository deliberately does **not** keep a compiled `client/build` directory checked in. Always build the current client before starting the production server:

```powershell
npm install
npm install --prefix client
npm run build
$env:NODE_ENV = "production"
npm start
```

The Express server serves the fresh `client/build` output when it exists. In production, set `COOKIE_SECURE=true`, use HTTPS, and set `CLIENT_URL` to the actual client origin. When the frontend is served by this Express app, leave `REACT_APP_BASEURL=/api/v1` for same-origin API calls.

## Verification

```powershell
npm test
npm run build
```

`npm test` covers canonical legacy-role mapping and the privacy-safe public user serializer. The build step compiles the React product surface.

## API overview

All product APIs are under `/api/v1`.

| Area | Key endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/google`, `/auth/logout`; `GET /auth/current-user` |
| Donations | `GET/POST /donations`, `GET /donations/mine`, `GET/PATCH/DELETE /donations/:id` |
| Claims | `POST /donations/:id/claim`, `GET /donations/claims/mine`, `GET /donations/incoming-claims`, `PATCH /donations/claims/:id/collect`, `POST /donations/claims/:id/cancel` |
| Product data | `GET /dashboard`, `GET /notifications`, `PATCH /notifications/read-all` |
| Health | `GET /health` |

Mutating cookie-authenticated endpoints verify a double-submit CSRF token. The React API clients attach it automatically.
