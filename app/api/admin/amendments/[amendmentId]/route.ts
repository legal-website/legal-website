import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(request: Request, { params }: { params: { amendmentId: string } }) {
  try {
    console.log(`PATCH /api/admin/amendments/${params.amendmentId}/status - Start`)

    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session) {
      console.log(`PATCH /api/admin/amendments/${params.amendmentId}/status - Unauthorized`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      console.log(`PATCH /api/admin/amendments/${params.amendmentId}/status - Forbidden`)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the amendment ID from the URL
    const { amendmentId } = params

    if (!amendmentId) {
      return NextResponse.json({ error: "Amendment ID is required" }, { status: 400 })
    }

    // Parse form data
    const formData = await request.formData()
    const status = formData.get("status") as string

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    console.log(`PATCH /api/admin/amendments/${amendmentId}/status - Updating status to ${status}`)

    // Get optional fields
    const paymentAmountStr = formData.get("paymentAmount") as string | null
    const notes = formData.get("notes") as string | null

    // Parse payment amount if provided
    const paymentAmount = paymentAmountStr ? Number.parseFloat(paymentAmountStr) : undefined

    // Update the amendment
    const updateData: any = { status }

    if (paymentAmount !== undefined) {
      updateData.paymentAmount = paymentAmount
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update the amendment
    const updatedAmendment = await db.amendment.update({
      where: { id: amendmentId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create a status history entry
    await db.amendmentStatusHistory.create({
      data: {
        amendmentId,
        status,
        notes,
        updatedBy: session.user.id,
      },
    })

    console.log(`PATCH /api/admin/amendments/${amendmentId}/status - Updated successfully`)

    // Format the response
    const formattedAmendment = {
      id: updatedAmendment.id,
      userId: updatedAmendment.userId,
      userName: updatedAmendment.user?.name || "Unknown",
      userEmail: updatedAmendment.user?.email || "unknown@example.com",
      type: updatedAmendment.type,
      details: updatedAmendment.details,
      status: updatedAmendment.status,
      createdAt: updatedAmendment.createdAt.toISOString(),
      updatedAt: updatedAmendment.updatedAt.toISOString(),
      documentUrl: updatedAmendment.documentUrl,
      receiptUrl: updatedAmendment.receiptUrl,
      paymentAmount: updatedAmendment.paymentAmount
        ? Number.parseFloat(updatedAmendment.paymentAmount.toString())
        : null,
      notes: updatedAmendment.notes,
    }

    return NextResponse.json(formattedAmendment)
  } catch (error) {
    console.error("Error updating amendment status:", error)
    return NextResponse.json({ error: "Failed to update amendment status" }, { status: 500 })
  }
}

