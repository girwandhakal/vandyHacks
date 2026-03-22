import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { itemId, amount, description, datePosted } = await req.json();

    const item = await prisma.plaidItem.findUnique({ where: { plaidItemId: itemId } });
    if (!item) throw new Error('Item not found');

    // We use a raw fetch to /sandbox/transactions/create as not all SDK versions type it
    const res = await fetch('https://sandbox.plaid.com/sandbox/transactions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.PLAID_CLIENT_ID,
        secret: process.env.PLAID_SECRET,
        access_token: item.accessTokenEncrypted,
        transactions: [
          {
            amount: amount,
            date_posted: datePosted || new Date().toISOString().split('T')[0],
            date_transacted: datePosted || new Date().toISOString().split('T')[0],
            description: description || 'Injected Transaction',
            iso_currency_code: 'USD',
          }
        ]
      })
    });

    const data = await res.json();
    
    if (!res.ok) {
        throw new Error(JSON.stringify(data));
    }

    // Now we should trigger a fetch to webhook if desired, or let the user hit /sync manual
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error in sandbox inject transaction:', error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
