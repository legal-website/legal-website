import type { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Check if required environment variables are set
  const requiredEnvVars = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "EMAIL_SERVER_HOST",
    "EMAIL_SERVER_PORT",
    "EMAIL_SERVER_USER",
    "EMAIL_SERVER_PASSWORD",
    "EMAIL_FROM",
  ]

  const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

  if (missingEnvVars.length > 0) {
    console.error("Missing required environment variables:", missingEnvVars)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The application is missing required configuration. Please check your environment variables.
          </p>
          {process.env.NODE_ENV === "development" && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mt-4">
              <p className="text-sm text-red-600 dark:text-red-400">Missing variables: {missingEnvVars.join(", ")}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  try {
    // Get the session
    const session = await getServerSession(authOptions)

    // Check if user is authenticated
    if (!session || !session.user) {
      redirect("/login?callbackUrl=/admin")
    }

    // Check if user has admin role
    const userRole = (session.user as any).role
    if (userRole !== "ADMIN") {
      redirect("/dashboard")
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    )
  } catch (error) {
    console.error("Error in admin layout:", error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">Error Loading Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was a problem loading the admin dashboard. Please try logging in again.
          </p>
          <a
            href="/login?callbackUrl=/admin"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }
}

