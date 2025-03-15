// This is a mock implementation that can be used for testing
// To use it, rename this file to route.ts temporarily

import { type NextRequest, NextResponse } from "next/server"

interface DeleteDocumentsRequest {
  documentIds: string[]
}

export async function DELETE(req: NextRequest) {
  console.log("MOCK DELETE /api/user/documents/business/delete - Request received")

  try {
    // Parse request body
    const text = await req.text()
    console.log("Request body text:", text)

    let body: Partial<DeleteDocumentsRequest> = {}
    let documentIds: string[] = []

    if (text) {
      body = JSON.parse(text) as Partial<DeleteDocumentsRequest>
      documentIds = body.documentIds || []
      console.log(`Parsed document IDs: ${documentIds.join(", ")}`)
    }

    if (!documentIds.length) {
      return NextResponse.json({ error: "No document IDs provided" }, { status: 400 })
    }

    // Simulate successful deletion
    return NextResponse.json({
      success: true,
      message: `${documentIds.length} document(s) deleted successfully`,
      count: documentIds.length,
    })
  } catch (error) {
    console.error("Error in mock delete route:", error)
    return NextResponse.json(
      {
        error: "Failed to delete documents",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

