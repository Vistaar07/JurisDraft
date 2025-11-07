import { sql, db } from "@/lib/db";
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

// POST /api/compliance
// Creates a new compliance report and all its associated child records
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);

    // Expect a full report object in the body
    const {
      document_id, // Can be null
      document_type,
      overall_risk_score,
      risk_level,
      summary,
      compliance_checks, // Array of check objects
      loopholes, // Array of loophole objects
      recommendations, // Array of recommendation objects
    } = await req.json();

    // Validate required fields
    if (!document_type || !overall_risk_score || !risk_level) {
      return new NextResponse("Missing required report fields", {
        status: 400,
      });
    }

    // Normalize risk_level to lowercase for database enum compatibility
    const normalizedRiskLevel = risk_level.toLowerCase();

    // Use a transaction to ensure all or nothing is written
    const client = await db.connect();

    try {
      await client.sql`BEGIN`;

      // 1. Insert the main report
      const reportRes = await client.sql`
        INSERT INTO compliance_reports (
          user_id, document_id, document_type, overall_risk_score, risk_level, summary
        )
        VALUES (
          ${userDbId}, ${
        document_id || null
      }, ${document_type}, ${overall_risk_score}, 
          ${normalizedRiskLevel}, ${summary || ""}
        )
        RETURNING id;
      `;
      const reportId = reportRes.rows[0].id;

      // 2. Insert all compliance checks
      if (compliance_checks && compliance_checks.length > 0) {
        for (const check of compliance_checks) {
          await client.sql`
            INSERT INTO compliance_checks (
              compliance_report_id, requirement, status, details, relevant_acts, remediation
            )
            VALUES (
              ${reportId}, ${check.requirement}, ${check.status}, ${
            check.details || ""
          },
              ${JSON.stringify(check.relevant_acts || [])}, ${
            check.remediation || null
          }
            );
          `;
        }
      }

      // 3. Insert all loopholes
      if (loopholes && loopholes.length > 0) {
        for (const loophole of loopholes) {
          // Normalize loophole risk_level to lowercase
          const loopholeRiskLevel = loophole.risk_level
            ? loophole.risk_level.toLowerCase()
            : "low";

          await client.sql`
            INSERT INTO loopholes (
              compliance_report_id, title, description, risk_level, clause_reference, recommendation
            )
            VALUES (
              ${reportId}, ${loophole.title}, ${
            loophole.description
          }, ${loopholeRiskLevel},
              ${loophole.clause_reference || null}, ${
            loophole.recommendation || null
          }
            );
          `;
        }
      }

      // 4. Insert all recommendations
      if (recommendations && recommendations.length > 0) {
        for (const rec of recommendations) {
          // Skip recommendations with null or empty text
          if (
            !rec.recommendation_text ||
            rec.recommendation_text.trim() === ""
          ) {
            continue;
          }

          await client.sql`
            INSERT INTO recommendations (
              compliance_report_id, recommendation_text, priority
            )
            VALUES (
              ${reportId}, ${rec.recommendation_text}, ${rec.priority || 0}
            );
          `;
        }
      }

      await client.sql`COMMIT`;

      return NextResponse.json({ id: reportId }, { status: 201 });
    } catch (txError) {
      await client.sql`ROLLBACK`;
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating compliance report:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// GET /api/compliance
// Fetches all compliance reports (summary level) for the logged-in user
export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);

    const reports = await sql`
      SELECT 
        cr.id, 
        cr.document_type, 
        cr.overall_risk_score, 
        cr.risk_level, 
        cr.created_at,
        d.title AS document_title
      FROM compliance_reports cr
      LEFT JOIN documents d ON cr.document_id = d.id
      WHERE 
        cr.user_id = ${userDbId}
        AND cr.deleted_at IS NULL
      ORDER BY cr.created_at DESC;
    `;

    return NextResponse.json(reports.rows);
  } catch (error) {
    console.error("Error fetching compliance reports:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
