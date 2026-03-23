// /api/verify.js
// Stripe Checkout Session の支払い結果を検証してプレミアム情報を返す
// 環境変数: STRIPE_SECRET_KEY

export default async function handler(req, res) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe secret key not configured' });
  }

  const sessionId = req.query.session_id || req.body?.session_id || '';
  if (!sessionId) {
    return res.status(400).json({ error: 'Missing session_id' });
  }

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Stripe verify error:', err);
      return res.status(502).json({ error: err.error?.message || 'Stripe error' });
    }

    const session = await response.json();

    // payment_status: 'paid' or status: 'complete' で支払い成功
    const isPaid =
      session.payment_status === 'paid' || session.status === 'complete';

    return res.status(200).json({
      ok: isPaid,
      email: session.customer_email || '',
      customerId: session.customer || '',
      subscriptionId: session.subscription || '',
      status: session.payment_status,
    });
  } catch (e) {
    console.error('Verify error:', e);
    return res.status(500).json({ error: e.message });
  }
}
