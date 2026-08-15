This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Suggested Accessories

- Customer catalog: `/gear`
- Product details: `/gear/[slug]`
- Supplier and margin research: `lib/accessories/sourcing.ts`
- Recommendation rules: `lib/accessories/recommend.ts`
- Protected sourcing desk: `/admin/accessories`

The sourcing desk is hidden with a 404 until both `ADMIN_ACCESS_USER` and
`ADMIN_ACCESS_PASSWORD` are configured in the server environment. When they
are present, the route uses HTTP Basic authentication. Do not put these values
in a public or `NEXT_PUBLIC_` environment variable.

No accessory is currently marked ready for checkout. A product may move to
`ready` only after its exact one-unit variant, destination shipping, delivery
window, sample quality and landed cost are verified. Real checkout also needs
server-side order storage and verified payment webhooks; browser storage must
never be used for customer orders.

### Supplier verification

The protected admin area now includes a prioritized sample queue and a
copy-ready supplier questionnaire. It requests a true one-unit quote,
destination-specific shipping, tracking, neutral dropship packaging, returns,
consistent SKUs and written image permission for the United States, Thailand,
Canada, the United Kingdom, Australia and Germany. Copying a questionnaire does
not send it or place an order.

### Payment and order infrastructure

Checkout uses Stripe-hosted Checkout and accepts only product IDs whose full
server-side launch assessment passes. Browser-supplied names and prices are
never trusted. A verified Stripe webhook atomically creates an order and its
supplier snapshot in Supabase; replayed events are idempotent.

1. Create a Supabase project and apply
   `supabase/migrations/202608150001_accessory_orders.sql`.
2. Copy `.env.example` to `.env.local` and add the server credentials.
3. Create a Stripe webhook for `/api/stripe/webhook` with these events:
   `checkout.session.completed` and
   `checkout.session.async_payment_succeeded`.
4. Set `APP_URL=https://smartercapture.com` in the production environment.
5. Verify a supplier and sample, then add its approved shipping policy to
   `lib/accessories/commerce.ts`. Only after every launch check passes should
   the product be marked `ready` with a retail price.

All payment and database credentials are server-only. Never prefix the Stripe
secret, webhook signing secret, or Supabase secret key with
`NEXT_PUBLIC_`.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
