import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { db } from "@/lib/db"
import { uploadToCloudinary } from "@/lib/cloudinary-no-types"

export async function GET(req: Request, { params }: { params: { amendmentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const amendment = await db.amendments.findUnique({
      where: { id: params.amendmentId },
      include: {
        amendment_status_history: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!amendment) {
      return new NextResponse("Amendment not found", { status: 404 })
    }

    // Check if user is authorized to view this amendment
    if (amendment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    return NextResponse.json({ amendment })
  } catch (error) {
    console.error("[AMENDMENT_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { amendmentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const status = formData.get("status") as string
    const notes = formData.get("notes") as string
    const paymentAmount = formData.get("paymentAmount") as string
    const receipt = formData.get("receipt") as File | null

    const amendment = await db.amendments.findUnique({
      where: { id: params.amendmentId },
    })

    if (!amendment) {
      return new NextResponse("Amendment not found", { status: 404 })
    }

    // Check if user is authorized to update this amendment
    if (amendment.userId !== session.user.id && session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let receiptUrl = amendment.receiptUrl
    if (receipt) {
      receiptUrl = await uploadToCloudinary(receipt)
    }

    // Update amendment
    const updatedAmendment = await db.amendments.update({
      where: { id: params.amendmentId },
      data: {
        status,
        notes,
        paymentAmount: paymentAmount ? Number.parseFloat(paymentAmount) : undefined,
        receiptUrl,
        updatedAt: new Date(),
      },
    })

    // Create status history entry
    await db.amendment_status_history.create({
      data: {
        id: crypto.randomUUID(),
        amendmentId: params.amendmentId,
        status,
        notes,
      },
    })

    // If status is waiting_for_payment, create an invoice
    if (status === "waiting_for_payment" && paymentAmount) {
      const user = await db.user.findUnique({
        where: { id: amendment.userId },
        include: { business: true },
      })

      if (user) {
        const invoice = await db.invoice.create({
          data: {
            id: crypto.randomUUID(),
            invoiceNumber: `AMD-${Date.now()}`,
            customerName: user.name || "Unknown",
            customerEmail: user.email,
            customerPhone: user.business?.phone || null,
            customerCompany: user.business?.name || null,
            customerAddress: user.business?.address || null,
            amount: Number.parseFloat(paymentAmount),
            status: "pending",
            items: JSON.stringify([
              {
                type: "amendment",
                description: `Amendment: ${amendment.type}`,
                amount: Number.parseFloat(paymentAmount),
              },
            ]),
            userId: user.id,
          },
        })

        // Update amendment with invoice reference
        await db.amendments.update({
          where: { id: params.amendmentId },
          data: {
            notes: `${notes}\nInvoice created: ${invoice.invoiceNumber}`,
          },
        })
      }
    }

    return NextResponse.json({ amendment: updatedAmendment })
  } catch (error) {
    console.error("[AMENDMENT_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

