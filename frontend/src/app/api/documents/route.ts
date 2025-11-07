import { sql } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// Helper function to get our internal user ID from Clerk ID
async function getUserDbId(clerkUserId: string) {
  const { rows } =
    await sql`SELECT id FROM users WHERE clerk_id = ${clerkUserId}`;
  if (rows.length === 0) {
    // This is a critical issue. For now, we'll throw an error.
    // In a complete setup, a Clerk webhook (user.created)
    // should have already created this user.
    throw new Error("User not found in database.");
  }
  return rows[0].id;
}

// POST /api/documents
// Creates a new document
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);

    const {
      document_type,
      document_text,
      title,
      status,
      checklist_items_included,
      governing_acts,
      metadata,
    } = await req.json();

    // Validate required fields
    if (!document_type || !document_text) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const newDocument = await sql`
      INSERT INTO documents (
        user_id, document_type, document_text, title, status, 
        checklist_items_included, governing_acts, metadata
      )
      VALUES (
        ${userDbId}, ${document_type}, ${document_text}, ${title}, ${
      status || "draft"
    }, 
        ${checklist_items_included || 0}, ${JSON.stringify(
      governing_acts || []
    )}, ${JSON.stringify(metadata || {})}
      )
      RETURNING id, title, document_type, created_at, status;
    `;

    return NextResponse.json(newDocument.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// GET /api/documents
// Fetches all documents for the logged-in user
export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);

    const documents = await sql`
      SELECT id, title, document_type, status, created_at, updated_at
      FROM documents
      WHERE user_id = ${userDbId}
        AND deleted_at IS NULL
      ORDER BY created_at DESC;
    `;

    return NextResponse.json(documents.rows);
  } catch (error) {
    console.error("Error fetching documents:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
