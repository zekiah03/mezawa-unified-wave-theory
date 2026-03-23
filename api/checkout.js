// /api/checkout.js
// Stripe Checkout Session を作成してリダイレクト
// 環境変数: STRIPE_SECRET_KEY (Vercel Project Settings > Environment Variables)

export default async function handler(req, res) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'Stripe secret key not configured' });
  }

  const email =
    (req.method === 'GET' ? req.query.email : req.body?.email) || '';

  const origin =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://mezawa-unified-wave-theory.vercel.app';

  const params = new URLSearchParams();
  params.append('mode', 'subscription');
  params.append('payment_method_types[]', 'card');
  if (email) params.append('customer_email', email);
  params.append('line_items[0][price_data][currency]', 'jpy');
  params.append('line_items[0][price_data][product_data][name]', 'めざわ統一波動理論 プレミアム');
  params.append('line_items[0][price_data][product_data][description]', 'Ψ-生命体育成・習慣トラッキング・AI対話 フルアクセス');
  params.append('line_items[0][price_data][unit_amount]', '980');
  params.append('line_items[0][price_data][recurring][interval]', 'month');
  params.append('line_items[0][quantity]', '1');
  params.append(
    'success_url',
    `${origin}/mezawa_theory_app.html?payment=success&session_id={CHECKOUT_SESSION_ID}`
  );
  params.append(
    'cancel_url',
    `${origin}/mezawa_theory_app.html?payment=cancel`
  );
  // Stripe Customer Portal へのリンクを有効化
  params.append('allow_promotion_codes', 'true');

  try {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Stripe error:', err);
      return res.status(502).json({ error: err.error?.message || 'Stripe error' });
    }

    const session = await response.json();
    return res.redirect(303, session.url);
  } catch (e) {
    console.error('Checkout error:', e);
    return res.status(500).json({ error: e.message });
  }
}
