import { db } from "@/lib/db"

/**
 * Safely execute a database operation with error handling
 * @param operation Function that performs the database operation
 * @param errorMessage Message to log if the operation fails
 * @returns True if the operation succeeded, false otherwise
 */
export async function safeDbOperation(
  operation: () => Promise<any>,
  errorMessage = "Database operation failed",
): Promise<boolean> {
  try {
    await operation()
    return true
  } catch (error) {
    console.error(`${errorMessage}:`, error)
    return false
  }
}

/**
 * Check if a table exists in the database
 * @param tableName Name of the table to check
 * @returns True if the table exists, false otherwise
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await db.$queryRaw`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = ${tableName}
      ) as exists;
    `
    return (result as any)[0].exists === 1
  } catch (error) {
    console.error(`Failed to check if table ${tableName} exists:`, error)
    return false
  }
}

/**
 * Check if a column exists in a table
 * @param tableName Name of the table
 * @param columnName Name of the column
 * @returns True if the column exists, false otherwise
 */
export async function columnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await db.$queryRaw`
      SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = DATABASE() 
        AND table_name = ${tableName} 
        AND column_name = ${columnName}
      ) as exists;
    `
    return (result as any)[0].exists === 1
  } catch (error) {
    console.error(`Failed to check if column ${columnName} exists in table ${tableName}:`, error)
    return false
  }
}

