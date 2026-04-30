# Stripe sandbox setup

Use this when you want Olive running locally with real Stripe sandbox payments instead of the built-in demo fallback.

---

## What this gives you

- Real Stripe Payment Element on `/hire/deposit`
- Real sandbox PaymentIntents created from Olive bookings
- Local webhook delivery into `/api/stripe/webhook`
- Booking status updates from `deposit_pending` to `confirmed`

---

## 1 · Fill the Stripe env vars

Add these to [`.env.local`](../.env.local):

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Notes:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_SECRET_KEY` should come from your Stripe sandbox / test-mode API keys.
- For local development, `STRIPE_WEBHOOK_SECRET` should come from the Stripe CLI output, not the Dashboard webhook endpoint.

---

## 2 · Start the app

```bash
cd /Users/callum/Dropbox/Mac/Desktop/Projects/Olive
npm run dev
```

The app runs at `http://localhost:3000`.

---

## 3 · Start local webhook forwarding

Install the Stripe CLI if needed, then run:

```bash
npm run stripe:listen
```

That forwards these events to Olive locally:

- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Stripe CLI will print a signing secret that looks like `whsec_...`.
Copy that into `STRIPE_WEBHOOK_SECRET` in `.env.local`, then restart `npm run dev`.

---

## 4 · Test the booking flow

1. Open `http://localhost:3000/hire`
2. Pick dates
3. Add products
4. Complete details
5. Sign up or sign in
6. On `/hire/deposit`, confirm the payment with a Stripe sandbox card

Recommended test card:

```text
4242 4242 4242 4242
```

Use any valid future expiry, any CVC, and any postcode.

---

## 5 · What success looks like

After payment:

- Stripe redirects you to `/hire/confirmation?ref=...`
- Stripe CLI shows a successful forwarded webhook
- Olive marks the matching `payments` row as `succeeded`
- Olive updates the booking status to `confirmed`
- `/account` and `/admin` should show the booking

---

## 6 · Common gotchas

`Stripe not configured` still shows on `/hire/deposit`:

- `STRIPE_SECRET_KEY` or `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is still missing
- restart `npm run dev` after editing `.env.local`

Payment form loads, but booking never becomes `confirmed`:

- `STRIPE_WEBHOOK_SECRET` is wrong
- `npm run stripe:listen` is not running
- the CLI secret in `.env.local` is stale from an earlier `stripe listen` session

Webhook signature errors:

- local dev must use the CLI `whsec_...`
- production must use the Dashboard webhook endpoint secret

No confirmation email:

- Stripe payment can still succeed without Resend configured
- email sending needs `RESEND_API_KEY` and `RESEND_FROM_EMAIL`

---

## 7 · Helpful commands

```bash
npm run dev
npm run stripe:listen
npm run stripe:logs
```
