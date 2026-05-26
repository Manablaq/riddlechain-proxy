// GenLayer API Proxy — bypasses CORS for browser requests
// Tries multiple GenLayer endpoints in order

const ENDPOINTS = [
  'https://studio.genlayer.com:8443/api',
  'https://studio.genlayer.com/api',
  'https://rpc-bradbury.genlayer.com',
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  let lastError = '';

  for (const endpoint of ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { result: text }; }

      // Success — return the result
      return res.status(200).json(data);

    } catch (err) {
      lastError = `${endpoint}: ${err.message}`;
      console.warn('Endpoint failed:', lastError);
      continue;
    }
  }

  // All endpoints failed
  return res.status(502).json({
    error: 'All GenLayer endpoints unreachable',
    tried: ENDPOINTS,
    lastError,
  });
}
