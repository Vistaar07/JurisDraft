import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Use the server-side auth helper

// Initialize Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

// Get your Price IDs from environment variables
const BASIC_PLAN_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_BASIC_PLAN_ID!;
const PRO_PLAN_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_ID!;

export async function POST(request: NextRequest) {
  // 1. Get the currently logged-in user ID from Clerk
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 2. Get the plan the user wants to buy from the request body
  const { plan } = await request.json();

  let priceId: string;

  if (plan === "basic") {
    priceId = BASIC_PLAN_PRICE_ID;
  } else if (plan === "pro") {
    priceId = PRO_PLAN_PRICE_ID;
  } else {
    return new NextResponse("Invalid plan requested", { status: 400 });
  }

  const origin = request.headers.get("origin") || "http://localhost:3000";

  try {
    // 3. Create a new Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription", // Assuming these are subscriptions
      success_url: `${origin}/legal-chat`, // Redirect to chat page on success
      cancel_url: `${origin}/`, // Redirect to home page on cancel

      // 4. THIS IS THE MOST IMPORTANT PART
      // Pass the Clerk User ID to the webhook
      client_reference_id: userId,
    });

    // 5. Return the session URL to the client
    if (session.url) {
      return NextResponse.json({ url: session.url });
    } else {
      return new NextResponse("Error creating Stripe session", { status: 500 });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe session creation error:", errorMessage);
    return new NextResponse(`Error: ${errorMessage}`, { status: 500 });
  }
}
