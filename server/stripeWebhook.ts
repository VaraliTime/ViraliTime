import { Request, Response } from 'express';
import { stripe } from './stripe';
import * as db from './db';

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('[Webhook] Missing stripe-signature header');
    return res.status(400).send('Missing signature');
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log('[Webhook] Test event detected, returning verification response');
    return res.json({
      verified: true,
    });
  }

  console.log('[Webhook] Processing event:', event.type, event.id);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('[Webhook] Checkout session completed:', session.id);

        const userId = parseInt(session.metadata.user_id);
        const ebookIdsStr = session.metadata.ebook_ids;
        const ebookIds = ebookIdsStr.split(',').map((id: string) => parseInt(id));

        // Retrieve line items to get prices
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

        // Create purchase records for each ebook
        for (let i = 0; i < ebookIds.length; i++) {
          const ebookId = ebookIds[i];
          const lineItem = lineItems.data[i];
          const amount = lineItem?.amount_total ? (lineItem.amount_total / 100).toString() : '0';

          await db.createPurchase({
            userId,
            ebookId,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent as string,
            amount,
            purchasedAt: new Date(),
          });
        }

        // Clear user's cart after successful purchase
        await db.clearCart(userId);

        console.log('[Webhook] Purchases created for user:', userId);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('[Webhook] Payment intent succeeded:', paymentIntent.id);
        break;
      }

      default:
        console.log('[Webhook] Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).send('Webhook processing failed');
  }
}
