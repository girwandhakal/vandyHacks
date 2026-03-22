'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidLinkProps {
  userId: string;
  onSuccess?: (itemId: string) => void;
}

export function PlaidLink({ userId, onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      setLinkToken(data.link_token);
    }
    fetchToken();
  }, [userId]);

  const onPlaidSuccess = useCallback(async (public_token: string) => {
    const res = await fetch('/api/plaid/set-access-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicToken: public_token, userId }),
    });
    const data = await res.json();
    if (data.success && onSuccess) {
      onSuccess(data.itemId);
    }
  }, [userId, onSuccess]);

  const { open, ready } = usePlaidLink({
    token: linkToken!,
    onSuccess: onPlaidSuccess,
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready || !linkToken}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
    >
      Connect Bank Account
    </button>
  );
}
