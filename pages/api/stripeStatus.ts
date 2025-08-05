import connectToDatabase from "@/lib/mongodb";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export default async function handler(req, res) {
  try {
    const { action, email } = req.body;

    if (req.method === "GET") {
      return res.status(200).json({ status: "free" });
    }

    if (!email) return res.status(400).json({ error: "Missing email" });

    const client = await connectToDatabase;
    const db = client.db();

    const user = await db.collection("users").findOne({ email });
    const customerId = user?.stripeCustomerId;
    if (!customerId) return res.status(400).json({ error: "Missing Stripe customer" });

    if (action === "createCheckoutSession") {
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
        mode: "subscription",
        success_url: `${process.env.NEXTAUTH_URL}/get-started`,
        cancel_url: `${process.env.NEXTAUTH_URL}/get-started`,
      });

      return res.status(200).json({ url: session.url });
    }

    if (action === "createBillingPortalSession") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXTAUTH_URL}/get-started`,
      });

      return res.status(200).json({ url: portal.url });
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("stripeStatus error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
