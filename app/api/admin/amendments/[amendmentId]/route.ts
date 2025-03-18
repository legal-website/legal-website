import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { PrismaClient } from "@prisma/client"

// Use type assertion to help TypeScript recognize our models
const prisma = db as PrismaClient & {
  amendment: any
  amendmentStatusHistory: any
  user: any
  invoice: any
}

export async function GET(req: Request, { params }: { params: { amendmentId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const amendment = await prisma.amendment.findUnique({
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
    })

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

    const amendment = await prisma.amendment.findUnique({
      where: { id: params.amendmentId },
      include: {
        user: true,
      },
    })

    if (!amendment) {
      return new NextResponse("Amendment not found", { status: 404 })
    }

    // Update amendment
    const updatedAmendment = await prisma.amendment.update({
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
    })

    // Create status history entry
    await prisma.amendmentStatusHistory.create({
      data: {
        amendmentId: params.amendmentId,
        status,
        notes: notes || undefined,
      },
    })

    // If status is waiting_for_payment, create an invoice
    if (status === "waiting_for_payment" && paymentAmount) {
      const user = await prisma.user.findUnique({
        where: { id: amendment.userId },
        include: { business: true },
      })

      if (user) {
        const invoice = await prisma.invoice.create({
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
        await prisma.amendment.update({
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

