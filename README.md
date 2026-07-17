# MODÉ e-commerce storefront

A Next.js storefront with an Express API, MongoDB persistence, and JWT authentication. The API has **no in-memory demo catalogue, carts, users, or orders**: all application records are read from and written to MongoDB.

## Setup

### 1. Configure MongoDB and secrets

Create `backend/.env` from the example, then set a reachable MongoDB connection string and a long random JWT secret.

```bash
cp backend/.env.example backend/.env
```

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/mode-market
JWT_SECRET=use-a-random-secret-at-least-32-characters-long
CORS_ORIGIN=http://localhost:3000
```

For MongoDB Atlas, use the Atlas connection string for `MONGODB_URI`. Never commit `backend/.env`.

### 2. Install packages

```bash
npm run install:all
```

### 3. Run the application

Use two terminals:

```bash
npm run api       # Express API at http://localhost:4000
npm run dev --prefix frontend  # Next.js storefront at http://localhost:3000
```

Or run both from the root:

```bash
npm run dev
```

If the frontend and API are deployed on separate hosts, set `NEXT_PUBLIC_API_URL` in the frontend environment to the public API URL and include the frontend URL in `CORS_ORIGIN`.

## Authentication and authorization

- `/signup` creates an account in MongoDB with a bcrypt password hash and returns a seven-day JWT.
- `/login` validates the account and restores authenticated access.
- The browser stores the JWT locally and sends it as a bearer token; protected routes are enforced again by the API.
- Cart, wishlist, checkout, order history, and account pages require authentication.
- The admin API and `/admin` require a MongoDB user with `role: "admin"`.

To make the initial store owner an administrator, put their address in `ADMIN_EMAILS` **before they sign up**:

```dotenv
ADMIN_EMAILS=owner@example.com
```

Alternatively, set the role for an existing user in MongoDB:

```javascript
db.users.updateOne({ email: "owner@example.com" }, { $set: { role: "admin" } })
```

Or use the bundled script to create a fresh administrator (or promote an
existing account) without touching Mongo directly. Run it from the `backend/`
folder with your `.env` in place:

```bash
cd backend
npm run create:admin -- --email owner@example.com --password 'S3cure!pass' --name 'Store Owner'
```

Environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`) are
supported as an alternative to CLI flags.

## API documentation (Swagger)

Start the backend, then open the interactive Swagger UI:

- **Swagger UI:** http://localhost:4000/api-docs
- **OpenAPI JSON:** http://localhost:4000/api-docs.json

The documentation describes every public, authenticated, and administrator endpoint. For protected endpoints, call `signup` or `login`, copy the returned `token`, click **Authorize** in Swagger UI, and enter the token (the Bearer scheme is added automatically). The source contract is `backend/openapi.js`.

## MongoDB-backed API

### Public

- `GET /api/health`
- `GET /api/products`, `GET /api/products/:id`
- `POST /api/auth/signup`, `POST /api/auth/login`
- `POST /api/newsletter`

### Authenticated

- `GET /api/auth/me`
- `GET/POST /api/cart`, `PATCH/DELETE /api/cart/:productId`
- `GET/POST /api/wishlist`, `DELETE /api/wishlist/:productId`
- `GET/POST /api/orders`

### Administrator only

- `GET /api/admin/metrics`, `GET /api/admin/orders`
- `POST /api/admin/products`
- `PATCH/DELETE /api/admin/products/:id`

The catalogue begins empty. Sign up as an administrator and add live products through the admin console; they are then immediately available in the storefront.
