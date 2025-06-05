
import type { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { addPurchasedCredits } from '@/actions/user-credits';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is not set in environment variables.');
    return new Response('Webhook secret not configured. Server error.', { status: 500 });
  }

  const buf = await req.text();
  const sig = headers().get('stripe-signature');

  if (!sig) {
    console.error('Missing stripe-signature header from webhook request.');
    return new Response('Missing stripe-signature header.', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return new Response(`Webhook Error: Signature verification failed. ${errorMessage}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`Processing checkout.session.completed for session ID: ${session.id}`);

      const userId = session.client_reference_id;
      const creditsPurchasedString = session.metadata?.credits_purchased;

      if (!userId) {
        console.error('Webhook Error: Missing userId (client_reference_id) in completed session metadata.');
        // Acknowledge the event to Stripe to prevent retries for this malformed event.
        return new Response(JSON.stringify({ error: 'Missing user ID in session metadata.' }), { status: 200 });
      }

      if (!creditsPurchasedString) {
        console.error(`Webhook Error: Missing credits_purchased in session metadata for user ${userId}.`);
        // Acknowledge to prevent retries.
        return new Response(JSON.stringify({ error: 'Missing credits_purchased in session metadata.' }), { status: 200 });
      }
      
      const creditsToAdd = parseInt(creditsPurchasedString, 10);

      if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
        console.error(`Webhook Error: Invalid credits_purchased value "${creditsPurchasedString}" for user ${userId}.`);
        // Acknowledge to prevent retries.
        return new Response(JSON.stringify({ error: 'Invalid credits_purchased value.' }), { status: 200 });
      }

      try {
        await addPurchasedCredits(userId, creditsToAdd);
        console.log(`Successfully added ${creditsToAdd} credits to user ${userId} via webhook.`);
      } catch (error) {
        const purchaseError = error instanceof Error ? error.message : 'Unknown error adding credits.';
        console.error(`Failed to add credits for user ${userId} via webhook: ${purchaseError}`);
        // Return 500 to Stripe so it retries, as this is an issue on our end (e.g., Clerk API down).
        return new Response(JSON.stringify({ error: 'Failed to process purchase and add credits.', details: purchaseError }), { status: 500 });
      }
      break;
    // Add other event types you want to handle here
    // Example:
    // case 'payment_intent.succeeded':
    //   const paymentIntent = event.data.object;
    //   // Then define and call a function to handle the event payment_intent.succeeded
    //   break;
    default:
      console.warn(`Unhandled Stripe event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true, eventType: event.type }), { status: 200 });
}
