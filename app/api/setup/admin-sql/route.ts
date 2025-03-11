import { NextResponse, type NextRequest } from "next/server"
import { hashPassword } from "@/lib/auth"

// Define a default setup key that will work if no environment variable is set
const DEFAULT_SETUP_KEY = "setup-orizen-admin-sql"

export async function GET(req: NextRequest) {
  // Get the setup key from query parameters
  const setupKey = req.nextUrl.searchParams.get("key")
  const isDevEnvironment = process.env.NODE_ENV === "development"
  const validSetupKey = process.env.ADMIN_SETUP_KEY || DEFAULT_SETUP_KEY

  // Allow access in development or with the correct setup key
  if (!isDevEnvironment && setupKey !== validSetupKey) {
    console.log("Unauthorized setup attempt. Invalid or missing setup key.")
    return NextResponse.json(
      {
        error: "Unauthorized. Please provide a valid setup key as a query parameter: ?key=YOUR_SETUP_KEY",
      },
      { status: 401 },
    )
  }

  try {
    // Generate a hashed password
    const hashedPassword = await hashPassword("p@$$worD1122")
    const adminEmail = "ary5054@gmail.com"

    // Generate SQL scripts
    const checkUserSQL = `SELECT * FROM User WHERE email = '${adminEmail}';`

    const createUserSQL = `
    INSERT INTO User (
      id, 
      email, 
      name, 
      password, 
      role, 
      emailVerified, 
      createdAt, 
      updatedAt
    ) 
    VALUES (
      UUID(), 
      '${adminEmail}', 
      'Super Admin', 
      '${hashedPassword}', 
      'ADMIN', 
      NOW(), 
      NOW(), 
      NOW()
    );
    `

    const updateUserSQL = `
    UPDATE User 
    SET 
      role = 'ADMIN', 
      password = '${hashedPassword}', 
      emailVerified = NOW() 
    WHERE email = '${adminEmail}';
    `

    return NextResponse.json({
      success: true,
      message: "SQL scripts generated successfully",
      scripts: {
        checkUser: checkUserSQL,
        createUser: createUserSQL,
        updateUser: updateUserSQL,
      },
      instructions:
        "1. Run the checkUser SQL to see if the admin exists. 2. If no rows returned, run createUser SQL. 3. If user exists, run updateUser SQL.",
      loginCredentials: {
        email: adminEmail,
        password: "p@$$worD1122",
      },
    })
  } catch (error: any) {
    console.error("Error generating SQL scripts:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An error occurred while generating SQL scripts",
      },
      { status: 500 },
    )
  }
}

