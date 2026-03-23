import { PlaidDevPageClient } from "@/app/dev/plaid/plaid-dev-page-client";

export default function PlaidDevPage() {
  const initialUserId = `user_${Math.floor(Math.random() * 10000)}`;

  return <PlaidDevPageClient initialUserId={initialUserId} />;
}
