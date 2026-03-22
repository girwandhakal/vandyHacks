import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/plaid/client';
import { PrismaClient } from '@prisma/client';
import { normalizeTransaction } from '@/lib/plaid/normalization';
import { syncPlaidAccountsForItem } from '@/lib/plaid/accounts';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { itemId } = await req.json();

    const item = await prisma.plaidItem.findUnique({ where: { plaidItemId: itemId } });
    if (!item) throw new Error('Item not found');
    await syncPlaidAccountsForItem(prisma, item);

    let cursor = item.cursor || undefined;
    let added: any[] = [];
    let modified: any[] = [];
    let removed: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: item.accessTokenEncrypted,
        cursor: cursor,
      });

      const data = response.data;
      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    // Save added
    for (const txn of added) {
      const rawTxn = await prisma.plaidTransactionRaw.upsert({
        where: { plaidTransactionId: txn.transaction_id },
        update: {},
        create: {
          userId: item.userId,
          plaidItemId: item.id,
          plaidTransactionId: txn.transaction_id,
          plaidAccountId: txn.account_id,
          amount: txn.amount,
          dateAuthorized: txn.authorized_date ? new Date(txn.authorized_date) : null,
          datePosted: txn.date ? new Date(txn.date) : null,
          name: txn.name,
          merchantName: txn.merchant_name || null,
          pending: txn.pending,
          categoryJson: JSON.stringify(txn.category || []),
          paymentChannel: txn.payment_channel,
          originalJson: JSON.stringify(txn),
        }
      });
      
      const norm = normalizeTransaction(txn.name, txn.amount, txn.category || null, txn.payment_channel);
      
      await prisma.plaidTransactionNormalized.upsert({
        where: { rawTransactionId: rawTxn.id },
        update: {
          normalizedCategory: norm.normalizedCategory,
          cashflowDirection: norm.cashflowDirection,
          essentialityScore: norm.essentialityScore,
          recurringCandidate: norm.recurringCandidate,
          merchantCanonical: norm.merchantCanonical,
          confidence: norm.confidence
        },
        create: {
          userId: item.userId,
          rawTransactionId: rawTxn.id,
          normalizedCategory: norm.normalizedCategory,
          cashflowDirection: norm.cashflowDirection,
          essentialityScore: norm.essentialityScore,
          recurringCandidate: norm.recurringCandidate,
          merchantCanonical: norm.merchantCanonical,
          confidence: norm.confidence
        }
      });
    }

    // Handle modified
    for (const txn of modified) {
      const rawTxn = await prisma.plaidTransactionRaw.update({
        where: { plaidTransactionId: txn.transaction_id },
        data: {
          amount: txn.amount,
          datePosted: txn.date ? new Date(txn.date) : null,
          pending: txn.pending,
          originalJson: JSON.stringify(txn)
        }
      });
      
      const norm = normalizeTransaction(txn.name, txn.amount, txn.category || null, txn.payment_channel);
      await prisma.plaidTransactionNormalized.updateMany({
         where: { rawTransactionId: rawTxn.id },
         data: {
          normalizedCategory: norm.normalizedCategory,
          cashflowDirection: norm.cashflowDirection,
          essentialityScore: norm.essentialityScore,
          recurringCandidate: norm.recurringCandidate,
          merchantCanonical: norm.merchantCanonical,
          confidence: norm.confidence
         }
      });
    }

    // Handle removed
    for (const txn of removed) {
      const rawTxn = await prisma.plaidTransactionRaw.findUnique({
        where: { plaidTransactionId: txn.transaction_id }
      });
      if (rawTxn) {
        await prisma.plaidTransactionNormalized.deleteMany({
          where: { rawTransactionId: rawTxn.id }
        });
        await prisma.plaidTransactionRaw.delete({
          where: { plaidTransactionId: txn.transaction_id }
        });
      }
    }

    // Update cursor
    await prisma.plaidItem.update({
      where: { plaidItemId: itemId },
      data: { cursor: cursor, lastSyncedAt: new Date() }
    });

    return NextResponse.json({ success: true, added: added.length, modified: modified.length, removed: removed.length });
  } catch (error: any) {
    console.error('Error syncing transactions:', error.response?.data || error.message);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
