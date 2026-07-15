import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireUser } from '@/lib/auth'
import { rateLimit } from '@/lib/rate-limit'
import { absoluteUrl } from '@/lib/utils'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 20)
  if (limited) return limited

  const { user, response } = await requireUser()
  if (response) return response
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })

  const { priceId } = await request.json()
  if (!priceId) return NextResponse.json({ error: 'priceId is required' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: absoluteUrl('/profile?checkout=success'),
    cancel_url: absoluteUrl('/profile?checkout=cancelled'),
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: session.url })
}
