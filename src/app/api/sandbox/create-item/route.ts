import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { PrismaClient } from '@prisma/client';
import { Products } from 'plaid';
import {
  DEFAULT_FINANCIAL_USER_ID,
  ensureDefaultFinancialUser,
  resetStoredFinancialData,
} from '@/lib/plaid/default-user';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { institutionId, overrideUsername = 'user_transactions_dynamic' } = await req.json();
    const userId = DEFAULT_FINANCIAL_USER_ID;

    const publicTokenResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: institutionId || 'ins_109508',
      initial_products: [Products.Transactions],
      options: {
        override_username: overrideUsername,
        override_password: 'pass_good',
      }
    });

    const publicToken = publicTokenResponse.data.public_token;

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    await ensureDefaultFinancialUser(prisma);
    await resetStoredFinancialData(prisma);

    await prisma.plaidItem.create({
      data: {
        userId,
        plaidItemId: itemId,
        accessTokenEncrypted: accessToken,
        institutionId: institutionId || 'ins_109508',
        institutionName: 'First Platypus Bank (Sandbox)',
        status: 'active'
      }
    });

    return NextResponse.json({ success: true, itemId });
  } catch (error: any) {
    console.error('Error in sandbox create item:', error.response?.data || error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
