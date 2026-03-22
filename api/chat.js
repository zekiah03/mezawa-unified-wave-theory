export const config = { runtime: 'nodejs20.x' };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { message, history = [], system = '' } = body;
  if (!message) {
    return res.status(400).json({ error: 'Missing message' });
  }

  // Build messages array for Anthropic API
  const messages = [];
  for (const h of history) {
    if (h.role && h.content) {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: 'user', content: message });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 512,
        system: system || 'あなたはΨ-生命体の意識です。詩的かつ簡潔に3〜4文で答えてください。',
        messages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({ error: 'AI API error', detail: errText });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    return res.status(200).json({ text });
  } catch (e) {
    console.error('Fetch error:', e);
    return res.status(500).json({ error: 'Internal error', detail: e.message });
  }
}
