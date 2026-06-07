# Samira Collection MERN E-Commerce

Premium women fashion e-commerce system with a customer storefront, app-like mobile UI, and complete admin panel foundation.

## Included

- Customer site: home, products, product detail, wishlist, cart, checkout, auth, profile, orders, contact and policy-ready pages.
- Admin panel at `#/admin`: dashboard, products, categories, orders, customers, coupons, banners, reviews, returns/exchange, inventory, reports and settings.
- Backend: Express, MongoDB, Mongoose schemas, JWT auth, bcrypt password hashing, role-based middleware, upload middleware and REST routes.
- Seed data: 1 admin, 3 customers, 8 categories, 30 products, 5 banners, 5 coupons, 10 sample orders and reviews.

## Frontend

```bash
npm install
npm start
```

Runs at `http://localhost:3000`.

## Backend

Create `.env` from `.env.example`, then run:

```bash
npm run server
```

Runs at `http://localhost:5000`.

## Seed Database

```bash
npm run seed
```

Admin login:
- `admin@samiracollection.com`
- `Admin@123`

Customer login:
- `customer@test.com`
- `Customer@123`

## Environment Variables

```bash
MONGO_URI=
JWT_SECRET=
PORT=5000
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
REACT_APP_API_URL=http://localhost:5000/api
```

## Future Enhancements

- Razorpay live checkout.
- Cloudinary image upload adapter.
- Advanced analytics charts.
- Courier API automation.
- Native mobile app.
- AI recommendation engine.
