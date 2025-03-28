import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { Role } from "@/lib/enums"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { status } = await req.json()

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    // When approving a conversion, set it to PENDING status
    // This ensures it's added to the current balance
    const finalStatus = status === "APPROVED" ? "PENDING" : status

    // Update the conversion
    const conversion = await db.affiliateConversion.update({
      where: { id: params.id },
      data: { status: finalStatus },
    })

    // Fetch the related data separately
    const link = await db.affiliateLink.findUnique({
      where: { id: conversion.linkId },
    })

    let user = null
    if (link) {
      user = await db.user.findUnique({
        where: { id: link.userId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      })
    }

    return NextResponse.json({
      conversion: {
        ...conversion,
        link: {
          ...link,
          user,
        },
      },
    })
  } catch (error) {
    console.error("Error updating affiliate conversion:", error)
    return NextResponse.json({ error: "Failed to update conversion" }, { status: 500 })
  }
}

