import { db } from "@/lib/db"

/**
 * Safely execute a Prisma query with error handling
 * @param queryFn Function that executes the Prisma query
 * @param defaultValue Default value to return if the query fails
 * @returns Query result or default value
 */
export async function safeQuery<T>(queryFn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await queryFn()
  } catch (error) {
    console.error("Database query error:", error)
    return defaultValue
  }
}

/**
 * Safely execute a raw SQL query with error handling
 * This overload is for template literals
 */
export async function safeRawQuery(sql: TemplateStringsArray, ...values: any[]): Promise<any>

/**
 * Safely execute a raw SQL query with error handling
 * This overload is for string queries with a default value
 */
export async function safeRawQuery<T>(sql: string, defaultValue: T): Promise<T>

/**
 * Implementation of safeRawQuery
 */
export async function safeRawQuery<T>(sql: TemplateStringsArray | string, ...args: any[]): Promise<any> {
  try {
    if (typeof sql === "string") {
      // String query with default value
      const defaultValue = args[0]
      return (await db.$executeRawUnsafe(sql)) || defaultValue
    } else {
      // Template literal query
      return await db.$executeRaw(sql, ...args)
    }
  } catch (error) {
    console.error("Raw SQL query error:", error)
    if (typeof sql === "string") {
      // Return default value for string queries
      return args[0]
    }
    // Return null for template literal queries
    return null
  }
}

