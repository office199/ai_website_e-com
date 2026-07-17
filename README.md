# MODÉ e-commerce storefront

A responsive Next.js fashion storefront with customer and admin dashboard concepts, plus an Express REST API.

## Run it

```bash
npm install
npm run dev       # Next.js storefront at http://localhost:3000
npm run api       # Express API at http://localhost:4000
```

## Pages

- `/` — fashion storefront, category discovery, products, bag/wishlist interactions and newsletter
- `/account` — customer dashboard with order tracking and wishlist preview
- `/admin` — store management dashboard: revenue KPIs, recent orders, sales visualization and stock alerts

## API

The Express server provides in-memory demo APIs for products, carts, wishlists, orders and administrative product/inventory management. Start it with `npm run api`.

- `GET /api/products`, `GET /api/products/:id`
- Cart CRUD: `/api/cart/:userId`
- Wishlist CRUD: `/api/wishlist/:userId`
- `GET/POST /api/orders`
- Admin: `GET /api/admin/metrics`, `GET /api/admin/orders`, and product CRUD at `/api/admin/products`

For production, replace in-memory data with a database and add authentication/role authorization middleware to the API.
