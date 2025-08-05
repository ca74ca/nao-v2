import connectToDatabase from "@/lib/mongodb";
import Stripe from "stripe";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth/next";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
});

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({ status: "free" });
    }

    const { action, email } = req.body;

    const session = await getServerSession(req, res, authOptions);
    const userEmail = email || session?.user?.email;

    if (!userEmail) {
      return res.status(400).json({ error: "Missing email" });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({ email: userEmail });

    const customerId = user?.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({ error: "Missing Stripe customer" });
    }

    if (action === "createCheckoutSession") {
      const checkout = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
        mode: "subscription",
        success_url: `${process.env.NEXTAUTH_URL}/get-started`,
        cancel_url: `${process.env.NEXTAUTH_URL}/get-started`,
      });

      return res.status(200).json({ url: checkout.url });
    }

    if (action === "createBillingPortalSession") {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${process.env.NEXTAUTH_URL}/get-started`,
      });

      return res.status(200).json({ url: portal.url });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (err) {
    console.error("stripeStatus error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
