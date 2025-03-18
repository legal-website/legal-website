import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import type { AmendmentModel } from "@/lib/prisma-types"

export async function PATCH(request: Request, { params }: { params: { amendmentId: string } }) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "SUPPORT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const amendmentId = params.amendmentId

    // Check if amendment exists
    const existingAmendment = await db.amendment.findUnique({
      where: { id: amendmentId },
    })

    if (!existingAmendment) {
      return NextResponse.json({ error: "Amendment not found" }, { status: 404 })
    }

    // Parse form data
    const formData = await request.formData()
    const status = formData.get("status") as string

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Get optional fields
    const paymentAmountStr = formData.get("paymentAmount") as string | null
    const notes = formData.get("notes") as string | null

    // Parse payment amount if provided
    let paymentAmount = undefined
    if (paymentAmountStr) {
      const amount = Number.parseFloat(paymentAmountStr)
      if (!isNaN(amount)) {
        paymentAmount = amount
      }
    }

    // Update amendment
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    if (paymentAmount !== undefined) {
      updateData.paymentAmount = paymentAmount
    }

    if (notes) {
      updateData.notes = notes
    }

    // Update the amendment
    const updatedAmendment = (await db.amendment.update({
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
    })) as AmendmentModel

    // Create status history entry
    await db.amendmentStatusHistory.create({
      data: {
        amendmentId,
        status,
        notes,
        updatedBy: session.user.id,
      },
    })

    // Format the amendment for the frontend
    const formattedAmendment = {
      id: updatedAmendment.id,
      userId: updatedAmendment.userId,
      userName: updatedAmendment.user.name || "Unknown",
      userEmail: updatedAmendment.user.email,
      type: updatedAmendment.type,
      details: updatedAmendment.details,
      status: updatedAmendment.status,
      createdAt: updatedAmendment.createdAt.toISOString(),
      updatedAt: updatedAmendment.updatedAt.toISOString(),
      documentUrl: updatedAmendment.documentUrl,
      receiptUrl: updatedAmendment.receiptUrl,
      paymentAmount: updatedAmendment.paymentAmount
        ? Number.parseFloat(updatedAmendment.paymentAmount.toString())
        : undefined,
      notes: updatedAmendment.notes,
    }

    return NextResponse.json({ amendment: formattedAmendment })
  } catch (error) {
    console.error("Error updating amendment:", error)
    return NextResponse.json({ error: "Failed to update amendment" }, { status: 500 })
  }
}

