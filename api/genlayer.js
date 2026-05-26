// GenLayer contract reader — uses official genlayer-js SDK
// Runs server-side on Vercel — no CORS issues

// Bypass SSL verification for GenLayer Studio endpoint
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from 'genlayer-js';

const CONTRACT = '0x27Fb0B472dBFFBbcb0774b81022f6c1900BBA148';

// GenLayer Studio testnet chain config
// The online Studio uses https://studio.genlayer.com:8443/api as its RPC
let _client = null;

async function getClient() {
  if (_client) return _client;
  try {
    // Try importing studionet from genlayer-js/chains
    const chains = await import('genlayer-js/chains');
    const chain = chains.studionet ?? chains.localnet ?? {
      id: 61131,
      name: 'GenLayer Studio',
      nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
      rpcUrls: { default: { http: ['https://studio.genlayer.com:8443/api'] } },
    };
    _client = createClient({ chain });
  } catch {
    _client = createClient({
      chain: {
        id: 61131,
        name: 'GenLayer Studio',
        nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
        rpcUrls: { default: { http: ['https://studio.genlayer.com:8443/api'] } },
      },
    });
  }
  return _client;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const { method, args = [] } = req.body ?? {};
  if (!method) return res.status(400).json({ error: 'method is required' });

  try {
    const client = await getClient();
    const result = await client.readContract({
      address: CONTRACT,
      functionName: method,
      args,
      stateStatus: 'accepted',
    });

    const value = typeof result === 'string' ? result : JSON.stringify(result);
    return res.status(200).json({ result: value });

  } catch (err) {
    console.error('GenLayer read error:', err.message);
    return res.status(502).json({
      error: 'Contract read failed',
      message: err.message,
    });
  }
}
