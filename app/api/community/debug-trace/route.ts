import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const logs: string[] = []
  const addLog = (message: string) => {
    console.log(message)
    logs.push(message)
  }

  try {
    addLog("Debug trace started")
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "published"

    addLog(`Requested status: ${status}`)

    // Step 1: Check if we can connect to the database
    addLog("Step 1: Testing database connection")
    try {
      await db.$queryRaw`SELECT 1+1 as result`
      addLog("Database connection successful")
    } catch (dbError) {
      addLog(`Database connection error: ${String(dbError)}`)
      throw new Error(`Database connection failed: ${String(dbError)}`)
    }

    // Step 2: Check if Post table exists
    addLog("Step 2: Checking if Post table exists")
    try {
      const tableCheck = await db.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'Post'
      `
      addLog(`Post table check result: ${JSON.stringify(tableCheck)}`)
    } catch (tableError) {
      addLog(`Error checking Post table: ${String(tableError)}`)
    }

    // Step 3: Get all distinct status values
    addLog("Step 3: Getting all distinct status values")
    try {
      const statusValues = await db.$queryRawUnsafe(`
        SELECT DISTINCT status FROM Post
      `)
      addLog(`Found status values: ${JSON.stringify(statusValues)}`)
    } catch (statusError) {
      addLog(`Error getting status values: ${String(statusError)}`)
    }

    // Step 4: Try to fetch posts with the given status
    addLog(`Step 4: Fetching posts with status = '${status}'`)
    try {
      const posts = await db.$queryRawUnsafe(
        `
        SELECT id, title, status FROM Post
        WHERE status = ?
        LIMIT 5
      `,
        status,
      )

      addLog(`Query successful, found ${posts.length} posts`)
      addLog(`Sample posts: ${JSON.stringify(posts)}`)
    } catch (queryError) {
      addLog(`Error in posts query: ${String(queryError)}`)
      throw new Error(`Posts query failed: ${String(queryError)}`)
    }

    // Step 5: Try the full query from the posts route
    addLog("Step 5: Testing the full query from posts route")
    try {
      const fullQuery = `
        SELECT 
          p.id, p.title, p.content, p.status, p.authorId, p.createdAt, p.updatedAt,
          u.id as userId, u.name as userName, u.image as userImage,
          COUNT(DISTINCT l.id) as likeCount,
          COUNT(DISTINCT c.id) as commentCount
        FROM Post p
        LEFT JOIN User u ON p.authorId = u.id
        LEFT JOIN \`Like\` l ON l.postId = p.id
        LEFT JOIN Comment c ON c.postId = p.id
        WHERE p.status = ?
        GROUP BY p.id, u.id
        LIMIT 5
      `

      addLog(`Executing full query: ${fullQuery}`)
      const fullQueryResult = await db.$queryRawUnsafe(fullQuery, status)

      addLog(`Full query successful, found ${fullQueryResult.length} results`)
    } catch (fullQueryError) {
      addLog(`Error in full query: ${String(fullQueryError)}`)
      throw new Error(`Full query failed: ${String(fullQueryError)}`)
    }

    return NextResponse.json({
      success: true,
      logs,
      message: "Debug trace completed successfully",
    })
  } catch (error) {
    addLog(`Fatal error: ${String(error)}`)

    return NextResponse.json(
      {
        success: false,
        logs,
        error: String(error),
        message: "Debug trace encountered an error",
      },
      { status: 500 },
    )
  }
}

