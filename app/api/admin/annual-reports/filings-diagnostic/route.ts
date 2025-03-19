import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { UserRole } from "@/lib/db/schema"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
  console.log("Filings Diagnostic API: Starting comprehensive diagnosis")

  const diagnosticResults: Record<string, any> = {
    timestamp: new Date().toISOString(),
    steps: {},
    errors: [],
    success: false,
  }

  try {
    // Step 1: Check authentication
    diagnosticResults.steps.authentication = { status: "pending" }
    try {
      const session = await getServerSession(authOptions)

      if (!session?.user) {
        diagnosticResults.steps.authentication = {
          status: "failed",
          error: "No session found",
        }
        return NextResponse.json(
          {
            error: "Unauthorized",
            diagnosticResults,
          },
          { status: 401 },
        )
      }

      if ((session.user as any).role !== UserRole.ADMIN) {
        diagnosticResults.steps.authentication = {
          status: "failed",
          error: "User is not an admin",
          userRole: (session.user as any).role,
        }
        return NextResponse.json(
          {
            error: "Unauthorized",
            diagnosticResults,
          },
          { status: 401 },
        )
      }

      diagnosticResults.steps.authentication = {
        status: "success",
        userId: session.user.id,
        userRole: (session.user as any).role,
      }
    } catch (authError) {
      diagnosticResults.steps.authentication = {
        status: "error",
        error: (authError as Error).message,
        stack: (authError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "authentication",
        error: (authError as Error).message,
        stack: (authError as Error).stack,
      })
      return NextResponse.json(
        {
          error: "Authentication error",
          diagnosticResults,
        },
        { status: 500 },
      )
    }

    // Step 2: Test database connection
    diagnosticResults.steps.databaseConnection = { status: "pending" }
    try {
      const connectionTest = await prisma.$queryRaw`SELECT 1 as connection_test`
      diagnosticResults.steps.databaseConnection = {
        status: "success",
        result: connectionTest,
      }
    } catch (dbConnError) {
      diagnosticResults.steps.databaseConnection = {
        status: "error",
        error: (dbConnError as Error).message,
        stack: (dbConnError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "databaseConnection",
        error: (dbConnError as Error).message,
        stack: (dbConnError as Error).stack,
      })
      return NextResponse.json(
        {
          error: "Database connection error",
          diagnosticResults,
        },
        { status: 500 },
      )
    }

    // Step 3: Check if AnnualReportFiling table exists
    diagnosticResults.steps.tableCheck = { status: "pending" }
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'AnnualReportFiling'
      `

      const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0

      if (!tableExists) {
        diagnosticResults.steps.tableCheck = {
          status: "failed",
          error: "AnnualReportFiling table does not exist",
          result: tableCheck,
        }
        return NextResponse.json(
          {
            error: "Table not found",
            diagnosticResults,
          },
          { status: 500 },
        )
      }

      diagnosticResults.steps.tableCheck = {
        status: "success",
        result: tableCheck,
      }
    } catch (tableCheckError) {
      diagnosticResults.steps.tableCheck = {
        status: "error",
        error: (tableCheckError as Error).message,
        stack: (tableCheckError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "tableCheck",
        error: (tableCheckError as Error).message,
        stack: (tableCheckError as Error).stack,
      })
    }

    // Step 4: Check table columns
    diagnosticResults.steps.columnsCheck = { status: "pending" }
    try {
      const columns = await prisma.$queryRaw`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'AnnualReportFiling'
      `

      diagnosticResults.steps.columnsCheck = {
        status: "success",
        columns,
      }
    } catch (columnsCheckError) {
      diagnosticResults.steps.columnsCheck = {
        status: "error",
        error: (columnsCheckError as Error).message,
        stack: (columnsCheckError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "columnsCheck",
        error: (columnsCheckError as Error).message,
        stack: (columnsCheckError as Error).stack,
      })
    }

    // Step 5: Try to get filings count
    diagnosticResults.steps.filingsCount = { status: "pending" }
    try {
      const count = await prisma.annualReportFiling.count()
      diagnosticResults.steps.filingsCount = {
        status: "success",
        count,
      }
    } catch (countError) {
      diagnosticResults.steps.filingsCount = {
        status: "error",
        error: (countError as Error).message,
        stack: (countError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "filingsCount",
        error: (countError as Error).message,
        stack: (countError as Error).stack,
      })
    }

    // Step 6: Try to get filings without includes
    diagnosticResults.steps.basicFilings = { status: "pending" }
    try {
      const basicFilings = await prisma.annualReportFiling.findMany({
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      })

      diagnosticResults.steps.basicFilings = {
        status: "success",
        count: basicFilings.length,
        sample: basicFilings.slice(0, 2),
      }
    } catch (basicFilingsError) {
      diagnosticResults.steps.basicFilings = {
        status: "error",
        error: (basicFilingsError as Error).message,
        stack: (basicFilingsError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "basicFilings",
        error: (basicFilingsError as Error).message,
        stack: (basicFilingsError as Error).stack,
      })
    }

    // Step 7: Try to get user data
    diagnosticResults.steps.userCheck = { status: "pending" }
    try {
      const users = await prisma.user.findMany({
        take: 2,
        select: {
          id: true,
          name: true,
          email: true,
        },
      })

      diagnosticResults.steps.userCheck = {
        status: "success",
        count: users.length,
        sample: users,
      }
    } catch (userCheckError) {
      diagnosticResults.steps.userCheck = {
        status: "error",
        error: (userCheckError as Error).message,
        stack: (userCheckError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "userCheck",
        error: (userCheckError as Error).message,
        stack: (userCheckError as Error).stack,
      })
    }

    // Step 8: Try to get deadline data
    diagnosticResults.steps.deadlineCheck = { status: "pending" }
    try {
      const deadlines = await prisma.annualReportDeadline.findMany({
        take: 2,
        select: {
          id: true,
          title: true,
          dueDate: true,
        },
      })

      diagnosticResults.steps.deadlineCheck = {
        status: "success",
        count: deadlines.length,
        sample: deadlines,
      }
    } catch (deadlineCheckError) {
      diagnosticResults.steps.deadlineCheck = {
        status: "error",
        error: (deadlineCheckError as Error).message,
        stack: (deadlineCheckError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "deadlineCheck",
        error: (deadlineCheckError as Error).message,
        stack: (deadlineCheckError as Error).stack,
      })
    }

    // Step 9: Try to get filings with minimal includes
    diagnosticResults.steps.minimalIncludes = { status: "pending" }
    try {
      const filings = await prisma.annualReportFiling.findMany({
        take: 2,
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      diagnosticResults.steps.minimalIncludes = {
        status: "success",
        count: filings.length,
        sample: filings,
      }
    } catch (minimalIncludesError) {
      diagnosticResults.steps.minimalIncludes = {
        status: "error",
        error: (minimalIncludesError as Error).message,
        stack: (minimalIncludesError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "minimalIncludes",
        error: (minimalIncludesError as Error).message,
        stack: (minimalIncludesError as Error).stack,
      })
    }

    // Step 10: Try to get filings with deadline includes
    diagnosticResults.steps.deadlineIncludes = { status: "pending" }
    try {
      const filings = await prisma.annualReportFiling.findMany({
        take: 2,
        include: {
          deadline: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      })

      diagnosticResults.steps.deadlineIncludes = {
        status: "success",
        count: filings.length,
        sample: filings,
      }
    } catch (deadlineIncludesError) {
      diagnosticResults.steps.deadlineIncludes = {
        status: "error",
        error: (deadlineIncludesError as Error).message,
        stack: (deadlineIncludesError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "deadlineIncludes",
        error: (deadlineIncludesError as Error).message,
        stack: (deadlineIncludesError as Error).stack,
      })
    }

    // Step 11: Try to get filings with both includes
    diagnosticResults.steps.fullIncludes = { status: "pending" }
    try {
      const filings = await prisma.annualReportFiling.findMany({
        take: 2,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          deadline: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              fee: true,
              lateFee: true,
              status: true,
            },
          },
        },
      })

      diagnosticResults.steps.fullIncludes = {
        status: "success",
        count: filings.length,
        sample: filings,
      }
    } catch (fullIncludesError) {
      diagnosticResults.steps.fullIncludes = {
        status: "error",
        error: (fullIncludesError as Error).message,
        stack: (fullIncludesError as Error).stack,
      }
      diagnosticResults.errors.push({
        step: "fullIncludes",
        error: (fullIncludesError as Error).message,
        stack: (fullIncludesError as Error).stack,
      })
    }

    // Final diagnosis
    diagnosticResults.success = diagnosticResults.errors.length === 0

    // Provide a summary of findings
    diagnosticResults.summary = {
      totalSteps: Object.keys(diagnosticResults.steps).length,
      successfulSteps: Object.values(diagnosticResults.steps).filter((step: any) => step.status === "success").length,
      failedSteps: Object.values(diagnosticResults.steps).filter((step: any) => step.status === "failed").length,
      errorSteps: Object.values(diagnosticResults.steps).filter((step: any) => step.status === "error").length,
      totalErrors: diagnosticResults.errors.length,
    }

    // Provide a recommendation
    if (diagnosticResults.errors.length > 0) {
      const firstErrorStep = diagnosticResults.errors[0].step

      if (firstErrorStep === "databaseConnection") {
        diagnosticResults.recommendation =
          "Check your database connection string and ensure the database server is running."
      } else if (firstErrorStep === "tableCheck") {
        diagnosticResults.recommendation =
          "The AnnualReportFiling table does not exist. Run your migrations or create the table."
      } else if (firstErrorStep === "columnsCheck") {
        diagnosticResults.recommendation =
          "There may be an issue with the table schema. Check if all required columns exist."
      } else if (firstErrorStep === "filingsCount" || firstErrorStep === "basicFilings") {
        diagnosticResults.recommendation =
          "There may be an issue with the AnnualReportFiling model in Prisma. Check your schema.prisma file."
      } else if (firstErrorStep === "userCheck") {
        diagnosticResults.recommendation =
          "There may be an issue with the User model in Prisma. Check your schema.prisma file."
      } else if (firstErrorStep === "deadlineCheck") {
        diagnosticResults.recommendation =
          "There may be an issue with the AnnualReportDeadline model in Prisma. Check your schema.prisma file."
      } else if (firstErrorStep === "minimalIncludes") {
        diagnosticResults.recommendation =
          "There may be an issue with the relation between AnnualReportFiling and User. Check your schema.prisma file."
      } else if (firstErrorStep === "deadlineIncludes") {
        diagnosticResults.recommendation =
          "There may be an issue with the relation between AnnualReportFiling and AnnualReportDeadline. Check your schema.prisma file."
      } else if (firstErrorStep === "fullIncludes") {
        diagnosticResults.recommendation =
          "There may be an issue with the combined relations. Try simplifying your query."
      }
    } else {
      diagnosticResults.recommendation =
        "All diagnostic steps passed successfully. The issue may be in the processing of the data after fetching or in the client-side code."
    }

    return NextResponse.json({
      diagnosticResults,
      message: "Diagnostic completed",
    })
  } catch (error) {
    console.error("Unhandled error in diagnostic API:", error)

    diagnosticResults.errors.push({
      step: "unhandled",
      error: (error as Error).message,
      stack: (error as Error).stack,
    })

    return NextResponse.json(
      {
        error: "Diagnostic failed with unhandled error",
        diagnosticResults,
      },
      { status: 500 },
    )
  }
}

