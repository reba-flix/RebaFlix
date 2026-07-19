import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2024-10-28.acacia' as any,
  });

  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed.`, err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.client_reference_id) {
          const userId = session.client_reference_id;
          
          await prisma.subscription.create({
            data: {
              userId,
              planName: (session.metadata?.planName) || 'PREMIUM',
              status: 'ACTIVE',
              providerCustomerId: session.customer as string,
              providerReferenceId: session.subscription as string,
              priceCents: session.amount_total || 0,
            }
          });

          await prisma.payment.create({
            data: {
              userId,
              provider: 'STRIPE',
              status: 'PAID',
              amountCents: session.amount_total || 0,
              reference: session.id,
            }
          });
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: {
            providerReferenceId: subscription.id,
          },
          data: {
            status: subscription.status === 'active' ? 'ACTIVE' : (subscription.status === 'past_due' ? 'PAST_DUE' : (subscription.status === 'canceled' ? 'CANCELED' : 'FREE')),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          }
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: {
            providerReferenceId: subscription.id,
          },
          data: {
            status: 'CANCELED',
            canceledAt: new Date(),
          }
        });
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Stripe webhook error:`, error.message);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
