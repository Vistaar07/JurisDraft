import { sql } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get our internal user ID from Clerk ID
async function getUserDbId(clerkUserId: string) {
  const { rows } =
    await sql`SELECT id FROM users WHERE clerk_id = ${clerkUserId}`;
  if (rows.length === 0) {
    throw new Error("User not found in database.");
  }
  return rows[0].id;
}

// GET /api/compliance/[id]
// Fetches a single, detailed compliance report with all its children
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  const { id: reportId } = await params;

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);

    // 1. Get the main report and check ownership
    const reportRes = await sql`
      SELECT *
      FROM compliance_reports
      WHERE id = ${reportId} AND user_id = ${userDbId} AND deleted_at IS NULL;
    `;

    if (reportRes.rows.length === 0) {
      return new NextResponse("Not Found or Forbidden", { status: 404 });
    }
    const report = reportRes.rows[0];

    // 2. Get all child records in parallel
    const [checksRes, loopholesRes, recommendationsRes] = await Promise.all([
      sql`SELECT * FROM compliance_checks WHERE compliance_report_id = ${reportId} ORDER BY created_at ASC;`,
      sql`SELECT * FROM loopholes WHERE compliance_report_id = ${reportId} ORDER BY created_at ASC;`,
      sql`SELECT * FROM recommendations WHERE compliance_report_id = ${reportId} ORDER BY priority ASC, created_at ASC;`,
    ]);

    // 3. Assemble the full report object
    const fullReport = {
      ...report,
      compliance_checks: checksRes.rows,
      loopholes: loopholesRes.rows,
      recommendations: recommendationsRes.rows,
    };

    return NextResponse.json(fullReport);
  } catch (error) {
    console.error("Error fetching compliance report:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/compliance/[id]
// Soft-deletes a single compliance report
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  const { id: reportId } = await params;

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);

    // Check ownership before deleting
    const { rowCount } = await sql`
      UPDATE compliance_reports
      SET deleted_at = NOW()
      WHERE id = ${reportId} AND user_id = ${userDbId};
    `;

    if (rowCount === 0) {
      return new NextResponse("Not Found or Forbidden", { status: 404 });
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Error deleting compliance report:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
