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

// Helper function to check document ownership
async function getOwnedDocument(docId: string, userDbId: string) {
  const { rows } = await sql`
    SELECT *
    FROM documents
    WHERE id = ${docId} AND user_id = ${userDbId} AND deleted_at IS NULL;
  `;
  return rows[0] || null;
}

// GET /api/documents/[id]
// Fetches a single document by its ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();
  const docId = params.id;

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);
    const document = await getOwnedDocument(docId, userDbId);

    if (!document) {
      return new NextResponse("Not Found or Forbidden", { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// PUT /api/documents/[id]
// Updates a single document's text or title
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();
  const docId = params.id;

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);
    const document = await getOwnedDocument(docId, userDbId);

    if (!document) {
      return new NextResponse("Not Found or Forbidden", { status: 404 });
    }

    const { document_text, title } = await req.json();

    // Use existing values as defaults if new ones aren't provided
    const newTitle = title || document.title;
    const newText = document_text || document.document_text;

    const updatedDocument = await sql`
      UPDATE documents 
      SET 
        title = ${newTitle},
        document_text = ${newText}
      WHERE 
        id = ${docId}
      RETURNING id, title, updated_at;
    `;

    return NextResponse.json(updatedDocument.rows[0]);
  } catch (error) {
    console.error("Error updating document:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// DELETE /api/documents/[id]
// Soft-deletes a single document
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();
  const docId = params.id;

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const userDbId = await getUserDbId(clerkUserId);
    const document = await getOwnedDocument(docId, userDbId); // Check ownership before deleting

    if (!document) {
      return new NextResponse("Not Found or Forbidden", { status: 404 });
    }

    await sql`
      UPDATE documents
      SET deleted_at = NOW()
      WHERE id = ${docId};
    `;

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("Error deleting document:", error);
    if (
      error instanceof Error &&
      error.message === "User not found in database."
    ) {
      return new NextResponse(error.message, { status: 404 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
