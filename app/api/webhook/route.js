import { NextResponse } from 'next/server';

// POST /api/webhook — Stripe webhook handler
// This will be activated when Stripe keys are configured.
// It processes payment confirmations and updates the database.
export async function POST(request) {
  // TODO: Implement when Stripe is configured
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // const sig = request.headers.get('stripe-signature');
  // const body = await request.text();
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  //
  // switch (event.type) {
  //   case 'checkout.session.completed':
  //     // Update payment/pledge status
  //     break;
  // }

  return NextResponse.json({ received: true });
}
