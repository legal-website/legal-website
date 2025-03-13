import { NextResponse, type NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret if needed
    // const secret = req.headers.get('x-webhook-secret')
    // if (secret !== process.env.WEBHOOK_SECRET) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const data = await req.json()

    // Store the notification in localStorage for the admin to see when they next load the page
    // Note: This is client-side code that needs to be executed in the browser
    // In a real implementation, you would store this in a database
    if (typeof window !== "undefined") {
      const pendingNotifications = JSON.parse(localStorage.getItem("pendingNotifications") || "[]")

      pendingNotifications.push({
        title: "New Invoice Created",
        description: `Invoice #${data.invoiceNumber} created for ${data.customerName}`,
        source: "invoices",
        time: new Date().toISOString(),
      })

      localStorage.setItem("pendingNotifications", JSON.stringify(pendingNotifications))
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in invoice webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred processing the webhook",
      },
      { status: 500 },
    )
  }
}

