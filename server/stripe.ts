import Stripe from 'stripe';
import type { Stripe as StripeType } from 'stripe';
import { ENV } from './_core/env';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession(params: {
  ebookIds: number[];
  ebookTitles: string[];
  amounts: number[];
  userId: number;
  userEmail: string;
  userName: string;
  origin: string;
}) {
  const { ebookIds, ebookTitles, amounts, userId, userEmail, userName, origin } = params;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = ebookIds.map((id, index) => ({
    price_data: {
      currency: 'eur',
      product_data: {
        name: ebookTitles[index],
      },
      unit_amount: Math.round(amounts[index] * 100), // Convert to cents
    },
    quantity: 1,
  }));

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    customer_email: userEmail,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: userEmail,
      customer_name: userName,
      ebook_ids: ebookIds.join(','),
    },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    allow_promotion_codes: true,
  });

  return session;
}
