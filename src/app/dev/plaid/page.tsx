'use client';

import { useState } from 'react';
import { PlaidLink } from '@/components/plaid/PlaidLink';

export default function PlaidDevPage() {
  const [userId, setUserId] = useState('user_' + Math.floor(Math.random() * 10000));
  const [itemId, setItemId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [aiContext, setAiContext] = useState<any>(null);

  const [overrideUsername, setOverrideUsername] = useState('user_good');

  const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const handleCreateSandboxItem = async () => {
    log(`Creating sandbox item (${overrideUsername})...`);
    try {
      const res = await fetch('/api/sandbox/create-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, overrideUsername })
      });
      const data = await res.json();
      if (data.itemId) {
        setItemId(data.itemId);
        log(`Success! Item ID: ${data.itemId}`);
      } else {
        log(`Failed: ${data.error}`);
      }
    } catch (e: any) {
      log(`Error: ${e.message}`);
    }
  };

  const handleSync = async () => {
    if (!itemId) return log('No Item ID set!');
    log('Triggering transaction sync...');
    try {
      const res = await fetch('/api/plaid/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId })
      });
      const data = await res.json();
      log(`Sync complete. Added: ${data.added || 0}, Modified: ${data.modified || 0}, Removed: ${data.removed || 0}`);
    } catch (e: any) {
      log(`Error: ${e.message}`);
    }
  };

  const fetchAIContext = async () => {
    log('Fetching AI Context...');
    try {
      const res = await fetch(`/api/dev/ai-context?userId=${userId}`);
      const data = await res.json();
      setAiContext(data);
      log('AI Context generated.');
    } catch (e: any) {
       log(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-mono text-sm">
      <h1 className="text-2xl font-bold mb-6">Plaid Sandbox Dev Panel</h1>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="border p-4 rounded bg-slate-50 text-slate-900">
            <h2 className="font-semibold mb-2">1. User Identity</h2>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
                className="border px-2 py-1 flex-1"
                placeholder="User ID"
              />
            </div>
          </section>

          <section className="border p-4 rounded bg-slate-50 text-slate-900">
            <h2 className="font-semibold mb-2">2. Connect Bank (Sandbox)</h2>
            <div className="flex gap-4 items-center mb-4">
              <button onClick={handleCreateSandboxItem} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 border-none cursor-pointer w-full font-bold">
                Auto-Create user_good Profile
              </button>
            </div>
            <div className="flex items-center gap-4">
               <span className="text-gray-500 text-xs">OR Manual:</span>
               <PlaidLink userId={userId} onSuccess={(id) => { setItemId(id); log(`Linked Item: ${id}`); }} />
            </div>
            {itemId && <p className="mt-2 text-green-600 font-semibold truncate">Active Item ID: {itemId}</p>}
          </section>

          <section className="border p-4 rounded bg-slate-50 space-y-3 text-slate-900">
            <h2 className="font-semibold">3. Actions</h2>
            <button onClick={handleSync} className="w-full px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 border-none cursor-pointer">
              Run /transactions/sync
            </button>
            <button onClick={fetchAIContext} className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 border-none cursor-pointer">
              Generate AI Context JSON
            </button>
          </section>

          <section className="border p-4 rounded bg-black text-green-400 h-64 overflow-y-auto w-full">
             <h2 className="font-semibold text-white mb-2">Logs</h2>
             {logs.map((l, i) => <div key={i}>{l}</div>)}
          </section>
        </div>

        <div>
          <section className="border p-4 rounded bg-slate-50 h-full flex flex-col w-full text-slate-900">
            <h2 className="font-semibold mb-2">AI Context JSON Output</h2>
            <pre className="bg-white border p-4 flex-1 overflow-auto rounded text-xs text-blue-900 shadow-inner w-full max-h-[800px]">
              {aiContext ? JSON.stringify(aiContext, null, 2) : 'No context generated yet. Click "Generate AI Context JSON".'}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
