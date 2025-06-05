
'use server';

import { stripe } from '@/lib/stripe';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

interface CreateCheckoutSessionResponse {
  sessionId?: string;
  url?: string | null;
  error?: string;
}

export async function createCheckoutSession(priceId: string): Promise<CreateCheckoutSessionResponse> {
  const { userId } = await auth();

  if (!userId) {
    return { error: 'User not authenticated. Please log in to make a purchase.' };
  }

  if (!priceId) {
    return { error: 'Price ID is missing.' };
  }

  const client = await clerkClient()

  const user = await client.users.getUser(userId);
  const customerEmail = user.primaryEmailAddress?.emailAddress;

  const origin = (await headers()).get('origin');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:9002';
  const successUrl = `${appUrl}/profile?payment_success=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${appUrl}/buy-credits?payment_cancelled=true`;

  let creditsPurchased = '0';
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_15_CREDITS) {
    creditsPurchased = '15';
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_25_CREDITS) {
    creditsPurchased = '25';
  }

  if (creditsPurchased === '0' && !priceId.includes('placeholder')) {
      console.error(`Error: Price ID ${priceId} did not match known credit packages or is a non-placeholder unconfigured ID.`);
      return { error: `Invalid or unconfigured Price ID. Please contact support or check Stripe configuration.` };
  }


  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      client_reference_id: userId, // Used to identify the user in webhooks
      metadata: {
        credits_purchased: creditsPurchased,
        userId: userId, // Storing userId in metadata can be helpful for direct lookup in Stripe dashboard
      },
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    if (error instanceof Error) {
        return { error: `Stripe error: ${error.message}` };
    }
    return { error: 'Failed to create checkout session. Please try again.' };
  }
}
