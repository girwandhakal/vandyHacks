import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { PrismaClient } from '@prisma/client';
import { syncPlaidAccountsForItem } from '@/lib/plaid/accounts';
import {
  DEFAULT_FINANCIAL_USER_ID,
  ensureDefaultFinancialUser,
  resetStoredFinancialData,
} from '@/lib/plaid/default-user';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { publicToken } = await req.json();
    const userId = DEFAULT_FINANCIAL_USER_ID;

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;
    
    // Quick get institution data
    const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
    const institutionId = itemResponse.data.item.institution_id;
    
    let institutionName = 'Sandbox Bank';
    if (institutionId) {
      const instResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US' as any],
      });
      institutionName = instResponse.data.institution.name;
    }

    await ensureDefaultFinancialUser(prisma);
    await resetStoredFinancialData(prisma);

    const storedItem = await prisma.plaidItem.create({
       data: {
          userId: userId,
          plaidItemId: itemId,
          accessTokenEncrypted: accessToken, // not really encrypted for now
          institutionId: institutionId,
          institutionName: institutionName,
          status: 'active'
       }
    });
    await syncPlaidAccountsForItem(prisma, storedItem);

    return NextResponse.json({ success: true, itemId });
  } catch (error: any) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
