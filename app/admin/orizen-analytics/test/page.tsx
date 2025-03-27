import { testGA4Connection } from "@/lib/analytics/ga4"

export default async function TestPage() {
  const testResult = await testGA4Connection()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Google Analytics Connection Test</h1>
      <p className="mb-4">This page tests the connection to Google Analytics and helps diagnose any issues.</p>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">
          {testResult.success ? (
            <span className="text-green-600">Connection Successful</span>
          ) : (
            <span className="text-red-600">Connection Failed</span>
          )}
        </h2>

        {!testResult.success && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <p className="text-red-800">
              <strong>Error:</strong> {testResult.error}
            </p>
          </div>
        )}

        {testResult.success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
            <p className="text-green-800">
              <strong>Success!</strong> Your Google Analytics connection is working properly.
            </p>
            <p className="text-green-800 mt-2">
              <strong>Data Available:</strong> {testResult.hasData ? "Yes" : "No"}
            </p>
            {testResult.hasData && testResult.sampleData && testResult.sampleData.length > 0 && (
              <div className="mt-2">
                <p className="text-green-800">
                  <strong>Sample Data:</strong>
                </p>
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm overflow-auto">
                  {JSON.stringify(testResult.sampleData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Environment Variables Check</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="border rounded-md p-4">
            <p className="font-medium">Google Client Email:</p>
            <p className={process.env.GOOGLE_CLIENT_EMAIL ? "text-green-600" : "text-red-600"}>
              {process.env.GOOGLE_CLIENT_EMAIL ? "Present" : "Missing"}
            </p>
          </div>
          <div className="border rounded-md p-4">
            <p className="font-medium">Google Private Key:</p>
            <p className={process.env.GOOGLE_PRIVATE_KEY ? "text-green-600" : "text-red-600"}>
              {process.env.GOOGLE_PRIVATE_KEY ? "Present" : "Missing"}
            </p>
          </div>
          <div className="border rounded-md p-4">
            <p className="font-medium">Google Analytics View ID:</p>
            <p className={process.env.GOOGLE_ANALYTICS_VIEW_ID ? "text-green-600" : "text-red-600"}>
              {process.env.GOOGLE_ANALYTICS_VIEW_ID ? `Present (${process.env.GOOGLE_ANALYTICS_VIEW_ID})` : "Missing"}
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Troubleshooting Steps</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-semibold text-blue-800 mb-2">For GA4 Properties (IDs starting with "G-"):</h3>
          <ol className="list-decimal pl-5 space-y-2 text-blue-800">
            <li>Make sure your service account has access to the GA4 property</li>
            <li>Enable the Google Analytics Data API in your Google Cloud project</li>
            <li>Verify that your property ID is correct (it should start with "G-")</li>
            <li>Check that your private key is properly formatted (including newlines)</li>
            <li>Ensure your service account has the necessary permissions</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

