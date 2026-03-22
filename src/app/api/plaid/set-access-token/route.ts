import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { publicToken, userId } = await req.json();

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

    // Save item to DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      // For dev/sandbox testing, if user doesn't exist, create a dummy one
      await prisma.user.create({
        data: { id: userId, name: 'Test User', email: `${userId}@test.com` }
      });
    }

    await prisma.plaidItem.create({
       data: {
          userId: userId,
          plaidItemId: itemId,
          accessTokenEncrypted: accessToken, // not really encrypted for now
          institutionId: institutionId,
          institutionName: institutionName,
          status: 'active'
       }
    });

    return NextResponse.json({ success: true, itemId });
  } catch (error: any) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
