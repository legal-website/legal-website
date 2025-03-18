import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// Define types for our amendments
interface AmendmentUser {
  id: string
  name: string | null
  email: string
  business?: {
    name: string | null
    phone: string | null
    address: string | null
  } | null
}

interface AmendmentStatusHistory {
  id: string
  amendmentId: string
  status: string
  createdAt: Date
  notes: string | null
}

interface Amendment {
  id: string
  userId: string
  type: string
  details: string
  status: string
  createdAt: Date
  updatedAt: Date
  documentUrl: string | null
  receiptUrl: string | null
  paymentAmount: number | null
  notes: string | null
  user: AmendmentUser
  statusHistory: AmendmentStatusHistory[]
}

export async function GET(req: Request, { params }: { params: { amendmentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Use type assertion to help TypeScript
    const amendment = (await (db as any).amendment.findUnique({
      where: { id: params.amendmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    })) as Amendment | null

    if (!amendment) {
      return new NextResponse("Amendment not found", { status: 404 })
    }

    // Format the amendment to include user name and email
    const formattedAmendment = {
      ...amendment,
      userName: amendment.user.name || "Unknown",
      userEmail: amendment.user.email,
    }

    return NextResponse.json({ amendment: formattedAmendment })
  } catch (error) {
    console.error("[ADMIN_AMENDMENT_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { amendmentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const formData = await req.formData()
    const status = formData.get("status") as string
    const notes = formData.get("notes") as string
    const paymentAmount = formData.get("paymentAmount") as string

    // Use type assertion to help TypeScript
    const amendment = (await (db as any).amendment.findUnique({
      where: { id: params.amendmentId },
      include: {
        user: true,
      },
    })) as Amendment | null

    if (!amendment) {
      return new NextResponse("Amendment not found", { status: 404 })
    }

    // Update amendment
    const updatedAmendment = (await (db as any).amendment.update({
      where: { id: params.amendmentId },
      data: {
        status,
        notes: notes || undefined,
        paymentAmount: paymentAmount ? Number.parseFloat(paymentAmount) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })) as Amendment

    // Create status history entry
    await (db as any).amendmentStatusHistory.create({
      data: {
        amendmentId: params.amendmentId,
        status,
        notes: notes || undefined,
      },
    })

    // If status is waiting_for_payment, create an invoice
    if (status === "waiting_for_payment" && paymentAmount) {
      const user = (await (db as any).user.findUnique({
        where: { id: amendment.userId },
        include: { business: true },
      })) as AmendmentUser

      if (user) {
        const invoice = await (db as any).invoice.create({
          data: {
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
        await (db as any).amendment.update({
          where: { id: params.amendmentId },
          data: {
            notes: `${notes || ""}\nInvoice created: ${invoice.invoiceNumber}`,
          },
        })
      }
    }

    // Format the amendment to include user name and email
    const formattedAmendment = {
      ...updatedAmendment,
      userName: updatedAmendment.user.name || "Unknown",
      userEmail: updatedAmendment.user.email,
    }

    return NextResponse.json({ amendment: formattedAmendment })
  } catch (error) {
    console.error("[ADMIN_AMENDMENT_PATCH]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

