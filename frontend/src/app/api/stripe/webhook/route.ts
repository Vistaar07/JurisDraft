import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const planName = session.metadata?.planName;
      const priceId = session.metadata?.priceId;

      if (userId && planName && priceId) {
        // Update user metadata in Clerk
        const client = await clerkClient();
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            plan: planName,
            priceId: priceId,
            subscriptionId: session.subscription,
            customerId: session.customer,
          },
        });

        console.log(`Updated plan for user ${userId} to ${planName}`);
      }
    }

    // Handle subscription cancellation
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Find user by customer ID and reset their plan
      const client = await clerkClient();
      const users = await client.users.getUserList();
      const user = users.data.find(
        (u) => u.publicMetadata?.customerId === customerId
      );

      if (user) {
        await client.users.updateUserMetadata(user.id, {
          publicMetadata: {
            plan: "Free",
            priceId: null,
            subscriptionId: null,
            customerId: customerId,
          },
        });

        console.log(`Reset plan for user ${user.id} to Free`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
