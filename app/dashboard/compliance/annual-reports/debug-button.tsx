"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function DebugButton() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)

  const runDiagnostic = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/debug/filings-diagnostic")
      const data = await response.json()

      setDiagnosticResults(data.diagnosticResults)
      setShowDialog(true)

      toast({
        title: data.diagnosticResults.success ? "Diagnostic Successful" : "Diagnostic Found Issues",
        description: data.diagnosticResults.recommendation || "See details for more information",
        variant: data.diagnosticResults.success ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Error running diagnostic:", error)
      toast({
        title: "Diagnostic Failed",
        description: "Could not run the diagnostic. See console for details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={runDiagnostic} disabled={isLoading}>
        {isLoading ? "Running..." : "Run Diagnostic"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[800px] max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>API Diagnostic Results</DialogTitle>
            <DialogDescription>
              {diagnosticResults?.success
                ? "All diagnostic steps passed successfully."
                : "Issues were found during the diagnostic."}
            </DialogDescription>
          </DialogHeader>

          {diagnosticResults && (
            <div className="space-y-4">
              <div className="p-4 rounded-md bg-muted">
                <h3 className="font-medium mb-2">Summary</h3>
                <p>Total Steps: {diagnosticResults.summary?.totalSteps}</p>
                <p>Successful Steps: {diagnosticResults.summary?.successfulSteps}</p>
                <p>Failed Steps: {diagnosticResults.summary?.failedSteps}</p>
                <p>Error Steps: {diagnosticResults.summary?.errorSteps}</p>
              </div>

              {diagnosticResults.recommendation && (
                <div className="p-4 rounded-md bg-yellow-50 border border-yellow-200">
                  <h3 className="font-medium mb-2">Recommendation</h3>
                  <p>{diagnosticResults.recommendation}</p>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-2">Step Details</h3>
                {Object.entries(diagnosticResults.steps).map(([stepName, stepData]: [string, any]) => (
                  <div
                    key={stepName}
                    className={`p-4 rounded-md mb-2 ${
                      stepData.status === "success"
                        ? "bg-green-50 border border-green-200"
                        : stepData.status === "failed"
                          ? "bg-red-50 border border-red-200"
                          : "bg-yellow-50 border border-yellow-200"
                    }`}
                  >
                    <h4 className="font-medium">{stepName}</h4>
                    <p>Status: {stepData.status}</p>
                    {stepData.error && <p className="text-red-600">Error: {stepData.error}</p>}
                  </div>
                ))}
              </div>

              {diagnosticResults.errors.length > 0 && (
                <div className="p-4 rounded-md bg-red-50 border border-red-200">
                  <h3 className="font-medium mb-2">Errors</h3>
                  {diagnosticResults.errors.map((error: any, index: number) => (
                    <div key={index} className="mb-2">
                      <p>Step: {error.step}</p>
                      <p>Error: {error.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

