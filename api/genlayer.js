// GenLayer API Proxy — bypasses CORS for browser requests
// Deployed on Vercel, forwards calls to studio.genlayer.com:8443

const GENLAYER_API = 'https://studio.genlayer.com:8443/api';

export default async function handler(req, res) {
  // Allow requests from any origin (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const response = await fetch(GENLAYER_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body),
    });

    const text = await response.text();

    // Try to parse as JSON, fall back to raw text
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { result: text };
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error('GenLayer proxy error:', error.message);
    return res.status(502).json({
      error:   'Could not reach GenLayer API',
      message: error.message,
    });
  }
}
