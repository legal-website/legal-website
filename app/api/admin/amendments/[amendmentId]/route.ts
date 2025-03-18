import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

// Simple status validation schema to avoid dependency on the full schema
const statusSchema = z.object({
  status: z.string(),
  paymentAmount: z.number().optional(),
  notes: z.string().optional(),
})

export async function PATCH(request: Request, { params }: { params: { amendmentId: string } }) {
  console.log(`PATCH /api/admin/amendments/${params.amendmentId}/status - Start`)

  try {
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
      console.log(`PATCH /api/admin/amendments/${params.amendmentId}/status - Missing amendment ID`)
      return NextResponse.json({ error: "Amendment ID is required" }, { status: 400 })
    }

    // Check if amendment exists
    console.log(`Checking if amendment ${amendmentId} exists`)
    const existingAmendment = await db.amendment.findUnique({
      where: { id: amendmentId },
    })

    if (!existingAmendment) {
      console.log(`Amendment ${amendmentId} not found`)
      return NextResponse.json({ error: "Amendment not found" }, { status: 404 })
    }

    console.log(`Amendment ${amendmentId} found, current status: ${existingAmendment.status}`)

    // Parse form data
    const formData = await request.formData()
    const status = formData.get("status") as string

    if (!status) {
      console.log(`Missing status in request`)
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // Get optional fields
    const paymentAmountStr = formData.get("paymentAmount") as string | null
    const notes = formData.get("notes") as string | null

    console.log(`Additional data - Payment amount: ${paymentAmountStr}, Notes: ${notes}`)

    // Parse payment amount if provided
    let paymentAmount = undefined
    if (paymentAmountStr) {
      const amount = Number.parseFloat(paymentAmountStr)
      if (!isNaN(amount)) {
        paymentAmount = amount
        console.log(`Parsed payment amount: ${paymentAmount}`)
      } else {
        console.log(`Invalid payment amount: ${paymentAmountStr}`)
        return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 })
      }
    }

    // Validate the update data
    try {
      const updateData = {
        status,
        ...(paymentAmount !== undefined ? { paymentAmount } : {}),
        ...(notes ? { notes } : {}),
      }

      // Validate with simple schema to avoid dependency issues
      const validatedData = statusSchema.parse(updateData)
      console.log(`Validated update data:`, validatedData)

      // Add updatedAt field
      const finalUpdateData = {
        ...validatedData,
        updatedAt: new Date(),
      }

      console.log(`Final update data:`, finalUpdateData)

      // Update the amendment
      console.log(`Updating amendment in database`)
      const updatedAmendment = await db.amendment.update({
        where: { id: amendmentId },
        data: finalUpdateData,
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

      console.log(`Amendment updated successfully`)

      // Create a status history entry
      console.log(`Creating status history entry`)
      await db.amendmentStatusHistory.create({
        data: {
          amendmentId,
          status,
          notes,
          updatedBy: session.user.id,
        },
      })

      console.log(`Status history entry created`)

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

      console.log(`Returning formatted amendment`)
      return NextResponse.json(formattedAmendment)
    } catch (validationError) {
      console.error("Validation error:", validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ error: "Validation error", details: validationError.errors }, { status: 400 })
      }
      throw validationError
    }
  } catch (error) {
    console.error("Error updating amendment status:", error)
    return NextResponse.json(
      { error: "Failed to update amendment status: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

