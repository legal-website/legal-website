import { NextResponse } from "next/server"
import { Role } from "@prisma/client"

export async function GET() {
  // Create mock user data
  const mockUsers = [
    {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      role: Role.ADMIN,
      status: "Active",
      company: "Acme Inc",
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      phone: "555-1234",
      address: "123 Main St",
      profileImage: null,
    },
    {
      id: "2",
      name: "Jane Smith",
      email: "jane@example.com",
      role: Role.CLIENT,
      status: "Active",
      company: "XYZ Corp",
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      phone: "555-5678",
      address: "456 Oak Ave",
      profileImage: null,
    },
    {
      id: "3",
      name: "Bob Johnson",
      email: "bob@example.com",
      role: Role.SUPPORT,
      status: "Pending",
      company: "Support Team",
      createdAt: new Date().toISOString(),
      lastActive: null,
      phone: "555-9012",
      address: "789 Pine St",
      profileImage: null,
    },
  ]

  return NextResponse.json({
    users: mockUsers,
    success: true,
    message: "Test users retrieved successfully",
    timestamp: new Date().toISOString(),
  })
}

