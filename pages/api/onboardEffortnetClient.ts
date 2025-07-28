// /pages/api/onboardEffortnetClient.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "@/lib/stripe";
import { connectToDatabase } from "@/lib/db";
import { nanoid } from "nanoid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { email, companyName } = req.body;

    if (!email || !companyName) {
      return res.status(400).json({ error: "Missing email or companyName" });
    }

    // 1. Create Stripe Customer
    const customer = await stripe.customers.create({
      email,
      name: companyName,
      description: "EffortNet API client",
    });

    // 2. Create Subscription
    const priceId = process.env.STRIPE_METERED_PRICE_ID;
    if (!priceId) throw new Error("Missing STRIPE_METERED_PRICE_ID in env");

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      collection_method: "charge_automatically",
    });

    // 3. Generate API key
    const apiKey = `effortnet_live_${nanoid(24)}`;

    // 4. Save to Mongo
    const { db } = await connectToDatabase();
    await db.collection("effortnetClients").insertOne({
      email,
      companyName,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      apiKey,
      createdAt: new Date(),
    });

    // 5. Respond
    return res.status(200).json({
      message: "Client onboarded",
      apiKey,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
    });
  } catch (err: any) {
    console.error("❌ Onboarding error:", err.message);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
