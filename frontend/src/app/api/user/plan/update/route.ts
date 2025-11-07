import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plan, priceId } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    // Update user metadata in Clerk
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        plan: plan,
        priceId: priceId || null,
        updatedAt: new Date().toISOString(),
      },
    });

    console.log(`Manually updated plan for user ${userId} to ${plan}`);

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Error updating user plan:", error);
    return NextResponse.json(
      { error: "Failed to update user plan" },
      { status: 500 }
    );
  }
}
