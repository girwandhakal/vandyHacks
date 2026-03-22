import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { CountryCode, Products } from 'plaid';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId || 'test_user_id',
      },
      client_name: 'ClearPath Health',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Error creating Plaid link token:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}
