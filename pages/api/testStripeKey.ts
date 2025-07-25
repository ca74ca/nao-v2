export default function handler(req, res) {
  const key = process.env.STRIPE_SECRET_KEY;
  const exists = !!key;
  res.status(200).json({
    stripeKeyExists: exists,
    stripeKeyStartsWith: key?.slice(0, 10) || null,
  });
}
