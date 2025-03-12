import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  // Simply redirect to the signin endpoint
  const body = await req.json()

  const response = await fetch(new URL("/api/auth/signin", req.url), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

