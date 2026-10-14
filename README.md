# StyleHub – Fashion Mini Store

A full-stack fashion demo store built with FastAPI, React, and SQLite.
Users can create an account, browse 20 products, manage their shopping
bag, complete Stripe test payments, and view their order history.

## Tech Stack

- Backend: FastAPI, SQLAlchemy, Pydantic
- Frontend: React, Vite, Tailwind CSS
- Database: SQLite
- Authentication: JWT and bcrypt
- Payments: Stripe PaymentIntents, Payment Element, and verified webhooks

## Features

- Registration, email login, and protected routes
- Responsive homepage and mobile navigation
- Product images, details, size selection, search, and category filters
- Price sorting and paginated product loading
- User-specific cart with quantity updates and removal
- Backend-calculated prices stored in integer paise
- Order creation with stock reservation and idempotency keys
- Stripe test payment success, failure, and retry handling
- Order confirmation and history
- Cancellation with stock restoration
- Loading states, validation, error messages, and notifications

## Project Structure

```text
stylehub/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── cart.py
│   │   │   ├── orders.py
│   │   │   └── payments.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
│   ├── .env.example
│   ├── requirements.txt
│   ├── seed_products.py
│   ├── seed_more_products.py
│   └── update_product_images.py
├── frontend/
│   ├── public/products/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   └── pages/
│   ├── .env.example
│   └── package.json
├── screenshots/
└── README.md
```

## Prerequisites

- Python with virtual environment support
- Node.js and npm
- Stripe CLI
- A Stripe sandbox with test API keys

Development was tested on Windows using Python 3.14 and Node.js 24.

## Backend Setup

Run these commands in Windows CMD from the project root:

```bat
cd backend
python -m venv venv
venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
```

For a fresh setup, edit `backend/.env`:

```env
APP_NAME=StyleHub API
DATABASE_URL=sqlite:///./stylehub.db
JWT_SECRET_KEY=REPLACE_WITH_A_GENERATED_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=REPLACE_WITH_YOUR_SK_TEST_KEY
STRIPE_PUBLISHABLE_KEY=REPLACE_WITH_YOUR_PK_TEST_KEY
STRIPE_WEBHOOK_SECRET=
```

Generate a JWT secret:

```bat
python -c "import secrets; print(secrets.token_hex(32))"
```

Use both Stripe keys from the same sandbox. Never commit `.env`.

Seed the products and connect their local images:

```bat
python seed_products.py
python seed_more_products.py
python update_product_images.py
```

The image files must be present in `frontend/public/products`.
The seed scripts skip existing products with matching names.

Start the backend from the `backend` directory:

```bat
python -m uvicorn app.main:app --reload
```

- Backend: http://127.0.0.1:8000
- Swagger API documentation: http://127.0.0.1:8000/docs

Tables are created automatically. SQLite is stored relative to the
backend working directory.

## Frontend Setup

Open another CMD window from the project root:

```bat
cd frontend
npm ci
copy .env.example .env
```

The frontend `.env` should contain:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the frontend:

```bat
npm run dev
```

Open http://localhost:5173.

The development server uses port 5173. Backend CORS permits this origin.

## Stripe Webhook Setup

In another CMD window:

```bat
stripe login
```

Authorize the same sandbox used by the backend API keys.

Start the listener:

```bat
stripe listen --events payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled --forward-to http://127.0.0.1:8000/api/payments/webhook
```

Copy the listener's `whsec_...` signing secret into
`STRIPE_WEBHOOK_SECRET` in `backend/.env`, then restart the backend.

Keep the listener running during local payment testing.

## Test Checkout

1. Register an account or sign in.
2. Select a product, choose a size, and add it to the bag.
3. Open the bag and continue to checkout.
4. Click Prepare payment.
5. Enter Stripe test card details:
   - Card: `4242 4242 4242 4242`
   - Expiry: any future date
   - CVC: any three digits
6. Submit payment.
7. Confirm the order becomes paid and appears in order history.

Use test card details only. This project is configured for test payments.

## Checkout Behaviour

- Creating an order reserves stock and moves its items out of the cart
  in the same database transaction.
- The order saves product names, sizes, quantities, and prices.
- Retrying with the same checkout key returns the same order.
- PaymentIntent creation reuses the order's existing PaymentIntent.
- Verified Stripe events update payment status.
- Cancellation restores reserved stock once.
- Cancelled order items can be added to the cart again.
- Stock is tracked per product and shared across its sizes.

## Main API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Email/password login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/products` | List, search, filter, and sort |
| GET | `/api/products/{product_id}` | Product details |
| GET | `/api/cart` | View current user's cart |
| POST | `/api/cart/items` | Add an item |
| PATCH | `/api/cart/items/{item_id}` | Update quantity |
| DELETE | `/api/cart/items/{item_id}` | Remove an item |
| POST | `/api/orders` | Create or retrieve an order |
| GET | `/api/orders` | Current user's order history |
| GET | `/api/orders/{order_id}` | Order details |
| POST | `/api/orders/{order_id}/cancel` | Cancel before Stripe setup |
| POST | `/api/payments/orders/{order_id}/intent` | Create or retrieve PaymentIntent |
| POST | `/api/payments/webhook` | Receive signed Stripe events |

Protected endpoints use an `Authorization: Bearer <token>` header.
Order creation also requires a UUID in the `Idempotency-Key` header.

The order cancellation API handles orders without a PaymentIntent.
For local testing, payments with an existing PaymentIntent can be
cancelled through Stripe CLI; the webhook updates the order.

## Validation Completed

- Registration, duplicate email, and incorrect password checks
- JWT-protected access and cart isolation between users
- Product search, filters, sorting, and missing-product handling
- Cart quantity validation, totals, and removal
- Order creation and idempotent retries
- Stripe success, failure, retry, and cancellation
- Webhook rejection of unsigned requests
- Stock restoration and cart cleanup
- Frontend login persistence on refresh
- Responsive layout and mobile navigation
- Complete frontend checkout and order history
- ESLint and production build

Run frontend checks from `frontend`:

```bat
npm run lint
npm run build
```

The production output is generated in `frontend/dist`.

## Demo Scope and Limitations

- Authentication uses sessionStorage and a 30-minute access token.
- Closing the browser tab ends its stored session.
- Checkout recovery uses a checkout key stored in that tab.
- Pending orders reserve stock until paid or cancelled; automatic
  reservation expiry is not implemented.
- Schema migrations, shipping, refunds, and an admin interface are
  outside this project's current scope.
- Local product images are served by the frontend.
- Local payment status updates require the Stripe listener.

## Screenshots

Project screenshots are stored in the `screenshots` directory.

## Author

Pradeepkumar S