import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const plan = user.publicMetadata?.plan || "Free";
    const priceId = user.publicMetadata?.priceId || null;

    console.log("User plan API called:", {
      userId,
      plan,
      priceId,
      metadata: user.publicMetadata,
    }); // Debug log

    return NextResponse.json({ plan, priceId });
  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch user plan" },
      { status: 500 }
    );
  }
}
