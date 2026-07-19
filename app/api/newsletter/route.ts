import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await prisma.newsletterSubscriber.create({
      data: { email },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2002') {
       return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
