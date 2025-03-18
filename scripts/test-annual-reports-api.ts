import fetch from "node-fetch"

async function testApi() {
  console.log("Testing annual reports API...")

  try {
    // Test client endpoints
    console.log("\nTesting client endpoints:")

    const clientDeadlinesResponse = await fetch("http://localhost:3000/api/annual-reports/deadlines")
    console.log("Client deadlines status:", clientDeadlinesResponse.status)
    if (clientDeadlinesResponse.ok) {
      const data = await clientDeadlinesResponse.json()
      console.log("Client deadlines data:", data)
    } else {
      console.error("Client deadlines error:", await clientDeadlinesResponse.text())
    }

    const clientFilingsResponse = await fetch("http://localhost:3000/api/annual-reports/filings")
    console.log("Client filings status:", clientFilingsResponse.status)
    if (clientFilingsResponse.ok) {
      const data = await clientFilingsResponse.json()
      console.log("Client filings data:", data)
    } else {
      console.error("Client filings error:", await clientFilingsResponse.text())
    }

    const clientRequirementsResponse = await fetch("http://localhost:3000/api/annual-reports/requirements")
    console.log("Client requirements status:", clientRequirementsResponse.status)
    if (clientRequirementsResponse.ok) {
      const data = await clientRequirementsResponse.json()
      console.log("Client requirements data:", data)
    } else {
      console.error("Client requirements error:", await clientRequirementsResponse.text())
    }

    // Test admin endpoints
    console.log("\nTesting admin endpoints:")

    const adminDeadlinesResponse = await fetch("http://localhost:3000/api/admin/annual-reports/deadlines")
    console.log("Admin deadlines status:", adminDeadlinesResponse.status)
    if (adminDeadlinesResponse.ok) {
      const data = await adminDeadlinesResponse.json()
      console.log("Admin deadlines data:", data)
    } else {
      console.error("Admin deadlines error:", await adminDeadlinesResponse.text())
    }

    const adminFilingsResponse = await fetch("http://localhost:3000/api/admin/annual-reports/filings")
    console.log("Admin filings status:", adminFilingsResponse.status)
    if (adminFilingsResponse.ok) {
      const data = await adminFilingsResponse.json()
      console.log("Admin filings data:", data)
    } else {
      console.error("Admin filings error:", await adminFilingsResponse.text())
    }

    const adminRequirementsResponse = await fetch("http://localhost:3000/api/admin/annual-reports/requirements")
    console.log("Admin requirements status:", adminRequirementsResponse.status)
    if (adminRequirementsResponse.ok) {
      const data = await adminRequirementsResponse.json()
      console.log("Admin requirements data:", data)
    } else {
      console.error("Admin requirements error:", await adminRequirementsResponse.text())
    }

    console.log("\nAPI testing completed")
  } catch (error) {
    console.error("API testing failed:", error)
  }
}

testApi()
  .then(() => console.log("Test script completed"))
  .catch((e) => {
    console.error("Test script failed:", e)
    process.exit(1)
  })

