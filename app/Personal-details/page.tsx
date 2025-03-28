"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"

export default function PersonalDetailsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    idCardFront: 0,
    idCardBack: 0,
    passport: 0,
  })
  const [formData, setFormData] = useState({
    clientName: "",
    companyName: "",
    currentAddress: "",
    businessPurpose: "",
    idCardFrontUrl: "",
    idCardBackUrl: "",
    passportUrl: "",
  })

  const idCardFrontRef = useRef<HTMLInputElement>(null)
  const idCardBackRef = useRef<HTMLInputElement>(null)
  const passportRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileType", fileType)

      // Update progress state based on fileType
      const progressKey =
        fileType === "idCardFront" ? "idCardFront" : fileType === "idCardBack" ? "idCardBack" : "passport"

      setUploadProgress((prev) => ({ ...prev, [progressKey]: 10 }))

      const response = await fetch("/api/user/upload-document", {
        method: "POST",
        body: formData,
      })

      // Simulate progress
      setUploadProgress((prev) => ({ ...prev, [progressKey]: 50 }))

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const data = await response.json()

      setUploadProgress((prev) => ({ ...prev, [progressKey]: 100 }))

      // Update form data with file URL
      const urlKey =
        fileType === "idCardFront" ? "idCardFrontUrl" : fileType === "idCardBack" ? "idCardBackUrl" : "passportUrl"

      setFormData((prev) => ({ ...prev, [urlKey]: data.fileUrl }))

      toast({
        title: "File uploaded successfully",
        description: `Your ${fileType} has been uploaded.`,
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      const progressKey =
        fileType === "idCardFront" ? "idCardFront" : fileType === "idCardBack" ? "idCardBack" : "passport"
      setUploadProgress((prev) => ({ ...prev, [progressKey]: 0 }))
      toast({
        title: "Error uploading file",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.idCardFrontUrl || !formData.idCardBackUrl || !formData.passportUrl) {
      toast({
        title: "Missing documents",
        description: "Please upload all required documents.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/user/personal-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to submit personal details")
      }

      setIsSubmitted(true)
      toast({
        title: "Submission successful",
        description: "Your personal details have been submitted for review.",
      })
    } catch (error) {
      console.error("Error submitting personal details:", error)
      toast({
        title: "Error submitting details",
        description: "There was an error submitting your personal details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardHeader>
            <CardTitle>Verification in Progress</CardTitle>
            <CardDescription>Your personal details have been submitted and are pending approval.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Status</span>
                <span>Pending Review</span>
              </div>
              <Progress value={33} className="h-2" />
            </div>
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p>
                Our team will review your submission as soon as possible. You will be notified once your account is
                verified.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Personal Details Verification</CardTitle>
          <CardDescription>
            Please provide your personal details and upload the required documents to verify your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Full Name</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  placeholder="Enter your full name"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="Enter your company name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAddress">Current Address</Label>
                <Textarea
                  id="currentAddress"
                  name="currentAddress"
                  placeholder="Enter your current address"
                  value={formData.currentAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPurpose">Business Purpose</Label>
                <Textarea
                  id="businessPurpose"
                  name="businessPurpose"
                  placeholder="Describe the purpose of your business"
                  value={formData.businessPurpose}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Document Upload</h3>

              <div className="space-y-2">
                <Label htmlFor="idCardFront">ID Card (Front)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="idCardFront"
                    ref={idCardFrontRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "idCardFront")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => idCardFrontRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.idCardFrontUrl ? "Change File" : "Upload ID Card Front"}
                  </Button>
                  {uploadProgress.idCardFront > 0 && uploadProgress.idCardFront < 100 && (
                    <div className="w-full">
                      <Progress value={uploadProgress.idCardFront} className="h-2" />
                    </div>
                  )}
                  {formData.idCardFrontUrl && <span className="text-sm text-green-600">Uploaded</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCardBack">ID Card (Back)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="idCardBack"
                    ref={idCardBackRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "idCardBack")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => idCardBackRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.idCardBackUrl ? "Change File" : "Upload ID Card Back"}
                  </Button>
                  {uploadProgress.idCardBack > 0 && uploadProgress.idCardBack < 100 && (
                    <div className="w-full">
                      <Progress value={uploadProgress.idCardBack} className="h-2" />
                    </div>
                  )}
                  {formData.idCardBackUrl && <span className="text-sm text-green-600">Uploaded</span>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="passport">Passport</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="passport"
                    ref={passportRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, "passport")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => passportRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {formData.passportUrl ? "Change File" : "Upload Passport"}
                  </Button>
                  {uploadProgress.passport > 0 && uploadProgress.passport < 100 && (
                    <div className="w-full">
                      <Progress value={uploadProgress.passport} className="h-2" />
                    </div>
                  )}
                  {formData.passportUrl && <span className="text-sm text-green-600">Uploaded</span>}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit for Verification"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

