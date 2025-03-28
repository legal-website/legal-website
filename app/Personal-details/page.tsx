"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface PersonalDetails {
  id: string
  userId: string
  clientName: string
  companyName: string
  currentAddress: string
  businessPurpose: string
  idCardFrontUrl: string
  idCardBackUrl: string
  passportUrl: string
  status: "pending" | "approved" | "rejected"
  adminNotes?: string | null
  isRedirectDisabled: boolean
  createdAt: string
  updatedAt: string
}

export default function PersonalDetailsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({
    idCardFront: 0,
    idCardBack: 0,
    passport: 0,
  })
  const [personalDetails, setPersonalDetails] = useState<PersonalDetails | null>(null)
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

  // Fetch existing personal details on page load
  useEffect(() => {
    fetchPersonalDetails()
  }, [])

  const fetchPersonalDetails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/user/personal-details")
      const data = await response.json()

      if (data.personalDetails) {
        setPersonalDetails(data.personalDetails)

        // If user has already submitted details, populate the form
        setFormData({
          clientName: data.personalDetails.clientName,
          companyName: data.personalDetails.companyName,
          currentAddress: data.personalDetails.currentAddress,
          businessPurpose: data.personalDetails.businessPurpose,
          idCardFrontUrl: data.personalDetails.idCardFrontUrl,
          idCardBackUrl: data.personalDetails.idCardBackUrl,
          passportUrl: data.personalDetails.passportUrl,
        })
      }
    } catch (error) {
      console.error("Error fetching personal details:", error)
      toast({
        title: "Error",
        description: "Failed to load your personal details",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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

    setIsSubmitting(true)

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

      const data = await response.json()
      setPersonalDetails(data.personalDetails)

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
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Loading your information...</p>
      </div>
    )
  }

  // Show status view if user has already submitted details
  if (personalDetails) {
    const getStatusProgress = () => {
      switch (personalDetails.status) {
        case "pending":
          return 33
        case "approved":
          return 100
        case "rejected":
          return 100
        default:
          return 0
      }
    }

    return (
      <div className="container max-w-3xl py-10 mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Personal Details Verification</CardTitle>
            <CardDescription className="text-lg mt-2">
              {personalDetails.status === "pending" && "Your details are being reviewed by our team."}
              {personalDetails.status === "approved" && "Your details have been approved."}
              {personalDetails.status === "rejected" && "Your details have been rejected."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Status</span>
                <span className="font-medium">
                  {personalDetails.status === "pending" && "Pending Review"}
                  {personalDetails.status === "approved" && "Approved"}
                  {personalDetails.status === "rejected" && "Rejected"}
                </span>
              </div>
              <Progress
                value={getStatusProgress()}
                className={`h-2 ${
                  personalDetails.status === "rejected"
                    ? "bg-red-100 [&>div]:bg-red-500"
                    : personalDetails.status === "approved"
                      ? "bg-green-100 [&>div]:bg-green-500"
                      : ""
                }`}
              />
            </div>

            {personalDetails.status === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Verification Successful</p>
                  <p className="text-green-700 mt-1">
                    {personalDetails.isRedirectDisabled
                      ? "Your account has been verified. You can now access the dashboard."
                      : "Your account has been verified, but you still need to wait for admin to enable dashboard access."}
                  </p>
                  {personalDetails.isRedirectDisabled && (
                    <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                      Go to Dashboard
                    </Button>
                  )}
                </div>
              </div>
            )}

            {personalDetails.status === "rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Verification Rejected</p>
                  <p className="text-red-700 mt-1">
                    {personalDetails.adminNotes ||
                      "Your verification was rejected. Please update your information and try again."}
                  </p>
                </div>
              </div>
            )}

            {personalDetails.status === "pending" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-yellow-800">Verification In Progress</p>
                  <p className="text-yellow-700 mt-1">
                    Your details are being reviewed by our team. This process usually takes 1-2 business days.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">Submitted Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Client Name</p>
                  <p className="mt-1">{personalDetails.clientName}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Company Name</p>
                  <p className="mt-1">{personalDetails.companyName}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Current Address</p>
                <p className="mt-1">{personalDetails.currentAddress}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500">Business Purpose</p>
                <p className="mt-1">{personalDetails.businessPurpose}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">ID Card (Front)</p>
                  <div className="mt-1 border rounded-lg overflow-hidden">
                    <img
                      src={personalDetails.idCardFrontUrl || "/placeholder.svg"}
                      alt="ID Card Front"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">ID Card (Back)</p>
                  <div className="mt-1 border rounded-lg overflow-hidden">
                    <img
                      src={personalDetails.idCardBackUrl || "/placeholder.svg"}
                      alt="ID Card Back"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Passport</p>
                  <div className="mt-1 border rounded-lg overflow-hidden">
                    <img
                      src={personalDetails.passportUrl || "/placeholder.svg"}
                      alt="Passport"
                      className="w-full h-auto object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {personalDetails.status === "rejected" && (
              <div className="mt-6">
                <Button onClick={() => setPersonalDetails(null)} className="w-full">
                  Update Information
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show the form for initial submission or updates
  return (
    <div className="container max-w-3xl py-10 mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Personal Details Verification</CardTitle>
          <CardDescription className="text-lg mt-2">
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
                {formData.idCardFrontUrl && (
                  <div className="mt-2 border rounded-lg overflow-hidden h-32">
                    <img
                      src={formData.idCardFrontUrl || "/placeholder.svg"}
                      alt="ID Card Front Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
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
                {formData.idCardBackUrl && (
                  <div className="mt-2 border rounded-lg overflow-hidden h-32">
                    <img
                      src={formData.idCardBackUrl || "/placeholder.svg"}
                      alt="ID Card Back Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
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
                {formData.passportUrl && (
                  <div className="mt-2 border rounded-lg overflow-hidden h-32">
                    <img
                      src={formData.passportUrl || "/placeholder.svg"}
                      alt="Passport Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
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

