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
import { Loader2, Upload, CheckCircle, XCircle, AlertCircle, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Member {
  id?: string
  memberName: string
  idCardFrontUrl: string
  idCardBackUrl: string
  passportUrl?: string
  isOpen: boolean
}

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
  members: Member[]
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
  const [members, setMembers] = useState<Member[]>([])
  const [memberUploadProgress, setMemberUploadProgress] = useState<{ [key: string]: { [key: string]: number } }>({})
  const [progressValue, setProgressValue] = useState(33) // For animated progress bar

  const idCardFrontRef = useRef<HTMLInputElement>(null)
  const idCardBackRef = useRef<HTMLInputElement>(null)
  const passportRef = useRef<HTMLInputElement>(null)
  const memberFileRefs = useRef<{ [key: string]: { [key: string]: HTMLInputElement | null } }>({})

  // Fetch existing personal details on page load
  useEffect(() => {
    fetchPersonalDetails()

    // Set up background refresh every 10 seconds
    const intervalId = setInterval(() => {
      fetchPersonalDetails(true) // true = silent refresh (no loading state)
    }, 10000)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  // Animate progress bar when status is pending
  useEffect(() => {
    let animationInterval: NodeJS.Timeout | null = null

    if (personalDetails?.status === "pending") {
      // Create animation effect for progress bar
      animationInterval = setInterval(() => {
        setProgressValue((prev) => {
          // Oscillate between 25 and 45
          if (prev >= 45) return 25
          return prev + 1
        })
      }, 150)
    }

    return () => {
      if (animationInterval) clearInterval(animationInterval)
    }
  }, [personalDetails?.status])

  const fetchPersonalDetails = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true)
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

        // Populate members if they exist
        if (data.personalDetails.members && data.personalDetails.members.length > 0) {
          const formattedMembers = data.personalDetails.members.map((member: any) => ({
            ...member,
            isOpen: false,
          }))
          setMembers(formattedMembers)
        }
      }
    } catch (error) {
      console.error("Error fetching personal details:", error)
      if (!silent) {
        toast({
          title: "Error",
          description: "Failed to load your personal details",
          variant: "destructive",
        })
      }
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMemberInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const updatedMembers = [...members]
    updatedMembers[index] = { ...updatedMembers[index], [name]: value }
    setMembers(updatedMembers)
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

  const handleMemberFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number, fileType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("fileType", `member_${index}_${fileType}`)

      // Initialize progress for this member if it doesn't exist
      if (!memberUploadProgress[index]) {
        setMemberUploadProgress((prev) => ({ ...prev, [index]: {} }))
      }

      // Update progress
      setMemberUploadProgress((prev) => ({
        ...prev,
        [index]: { ...prev[index], [fileType]: 10 },
      }))

      const response = await fetch("/api/user/upload-document", {
        method: "POST",
        body: formData,
      })

      // Simulate progress
      setMemberUploadProgress((prev) => ({
        ...prev,
        [index]: { ...prev[index], [fileType]: 50 },
      }))

      if (!response.ok) {
        throw new Error("Failed to upload file")
      }

      const data = await response.json()

      setMemberUploadProgress((prev) => ({
        ...prev,
        [index]: { ...prev[index], [fileType]: 100 },
      }))

      // Update member data with file URL
      const urlKey =
        fileType === "idCardFront" ? "idCardFrontUrl" : fileType === "idCardBack" ? "idCardBackUrl" : "passportUrl"

      const updatedMembers = [...members]
      updatedMembers[index] = { ...updatedMembers[index], [urlKey]: data.fileUrl }
      setMembers(updatedMembers)

      toast({
        title: "File uploaded successfully",
        description: `Member ${fileType} has been uploaded.`,
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      setMemberUploadProgress((prev) => ({
        ...prev,
        [index]: { ...prev[index], [fileType]: 0 },
      }))
      toast({
        title: "Error uploading file",
        description: "There was an error uploading the file. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addMember = () => {
    setMembers([
      ...members,
      {
        memberName: "",
        idCardFrontUrl: "",
        idCardBackUrl: "",
        passportUrl: "",
        isOpen: true,
      },
    ])
  }

  const removeMember = (index: number) => {
    const updatedMembers = [...members]
    updatedMembers.splice(index, 1)
    setMembers(updatedMembers)
  }

  const toggleMemberCollapsible = (index: number) => {
    const updatedMembers = [...members]
    updatedMembers[index].isOpen = !updatedMembers[index].isOpen
    setMembers(updatedMembers)
  }

  const validateForm = () => {
    // Validate main form
    if (
      !formData.clientName ||
      !formData.companyName ||
      !formData.currentAddress ||
      !formData.businessPurpose ||
      !formData.idCardFrontUrl ||
      !formData.idCardBackUrl
    ) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and upload ID card documents.",
        variant: "destructive",
      })
      return false
    }

    // Validate members
    for (let i = 0; i < members.length; i++) {
      const member = members[i]
      if (!member.memberName || !member.idCardFrontUrl || !member.idCardBackUrl) {
        toast({
          title: "Missing member information",
          description: `Please fill in all required fields for member ${i + 1}.`,
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/user/personal-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          members,
        }),
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
      <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-screen p-4">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
        <p className="text-base sm:text-lg font-medium">Loading your information...</p>
      </div>
    )
  }

  // Show status view if user has already submitted details
  if (personalDetails) {
    const getStatusProgress = () => {
      switch (personalDetails.status) {
        case "pending":
          return progressValue // Use animated value
        case "approved":
          return 100
        case "rejected":
          return 100
        default:
          return 0
      }
    }

    return (
      <div className="container max-w-3xl py-6 sm:py-10 px-4 sm:px-6 mx-auto mb-24 sm:mb-40">
        <Card>
          <CardHeader className="text-center p-4 sm:p-6">
            <CardTitle className="text-2xl sm:text-3xl font-bold">Personal Details Verification</CardTitle>
            <CardDescription className="text-base sm:text-lg mt-2">
              {personalDetails?.status === "pending" && "Your details are being reviewed by our team."}
              {personalDetails?.status === "approved" && "Your details have been approved."}
              {personalDetails?.status === "rejected" && "Your details have been rejected."}
              {!personalDetails &&
                "Please provide your personal details and upload the required documents to verify your account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
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
                      : personalDetails.status === "pending"
                        ? "bg-yellow-100 [&>div]:bg-yellow-500 transition-all duration-300"
                        : ""
                }`}
              />
            </div>

            {personalDetails.status === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mb-2 sm:mb-0 sm:mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">Verification Successful</p>
                  <p className="text-green-700 mt-1 text-sm sm:text-base">
                    {personalDetails.isRedirectDisabled
                      ? "Your account has been verified. You can now access the dashboard."
                      : "Your account has been verified, but you still need to wait for admin to enable dashboard access."}
                  </p>
                  {personalDetails.isRedirectDisabled && (
                    <Button className="mt-4 text-sm h-9" onClick={() => router.push("/dashboard")}>
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
                    Your details are being reviewed by our team. This process usually takes 1-2 Hours.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2">Submitted Information</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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

            {/* Additional Members Section */}
            {personalDetails.members && personalDetails.members.length > 0 && (
              <div className="mt-8 space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Additional Members</h3>

                {personalDetails.members.map((member: Member, index: number) => (
                  <div key={member.id || index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 bg-gray-50">
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-0 h-8 w-8 min-w-8 flex-shrink-0">
                            {member.isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </CollapsibleTrigger>
                        <h4 className="font-medium text-sm sm:text-base truncate">
                          {member.memberName ? member.memberName : `Member ${index + 1}`}
                        </h4>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="mt-1">{member.memberName}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">ID Card (Front)</p>
                        <div className="mt-1 border rounded-lg overflow-hidden">
                          <img
                            src={member.idCardFrontUrl || "/placeholder.svg"}
                            alt="Member ID Card Front"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-500">ID Card (Back)</p>
                        <div className="mt-1 border rounded-lg overflow-hidden">
                          <img
                            src={member.idCardBackUrl || "/placeholder.svg"}
                            alt="Member ID Card Back"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      </div>

                      {member.passportUrl && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Passport</p>
                          <div className="mt-1 border rounded-lg overflow-hidden">
                            <img
                              src={member.passportUrl || "/placeholder.svg"}
                              alt="Member Passport"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
    <div className="container max-w-3xl py-6 sm:py-10 px-4 sm:px-6 mx-auto mb-24 sm:mb-40">
      <Card>
        <CardHeader className="text-center p-4 sm:p-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Personal Details Verification</CardTitle>
          <CardDescription className="text-base sm:text-lg mt-2">
            Please provide your personal details and upload the required documents to verify your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">
                  Full Name <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="companyName">
                  Company Name <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="currentAddress">
                  Current Address <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="businessPurpose">
                  Business Purpose <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="idCardFront">
                  ID Card (Front) <span className="text-red-500">*</span>
                </Label>
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
                    className="w-full py-2 px-3 h-auto text-sm"
                  >
                    <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                  <div className="mt-2 border rounded-lg overflow-hidden h-24 sm:h-32">
                    <img
                      src={formData.idCardFrontUrl || "/placeholder.svg"}
                      alt="ID Card Front Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="idCardBack">
                  ID Card (Back) <span className="text-red-500">*</span>
                </Label>
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
                    className="w-full py-2 px-3 h-auto text-sm"
                  >
                    <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                  <div className="mt-2 border rounded-lg overflow-hidden h-24 sm:h-32">
                    <img
                      src={formData.idCardBackUrl || "/placeholder.svg"}
                      alt="ID Card Back Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passport">Passport (Optional)</Label>
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
                    className="w-full py-2 px-3 h-auto text-sm"
                  >
                    <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
                  <div className="mt-2 border rounded-lg overflow-hidden h-24 sm:h-32">
                    <img
                      src={formData.passportUrl || "/placeholder.svg"}
                      alt="Passport Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Members Section */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Additional Members</h3>
                <Button
                  type="button"
                  onClick={addMember}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs sm:text-sm h-8 sm:h-9"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  Add Member
                </Button>
              </div>

              {members.length === 0 && (
                <div className="text-center py-6 border border-dashed rounded-lg">
                  <p className="text-gray-500">No additional members added yet</p>
                </div>
              )}

              {members.map((member, index) => (
                <Collapsible
                  key={index}
                  open={member.isOpen}
                  onOpenChange={() => toggleMemberCollapsible(index)}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-8 w-8 min-w-8 flex-shrink-0">
                          {member.isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <h4 className="font-medium text-sm sm:text-base truncate">
                        {member.memberName ? member.memberName : `Member ${index + 1}`}
                      </h4>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove member</span>
                    </Button>
                  </div>

                  <CollapsibleContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`member-${index}-name`}>
                        Member Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`member-${index}-name`}
                        name="memberName"
                        placeholder="Enter member name"
                        value={member.memberName}
                        onChange={(e) => handleMemberInputChange(index, e)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`member-${index}-idCardFront`}>
                        ID Card (Front) <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id={`member-${index}-idCardFront`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => {
                            if (!memberFileRefs.current[index]) {
                              memberFileRefs.current[index] = {}
                            }
                            memberFileRefs.current[index].idCardFront = el
                          }}
                          onChange={(e) => handleMemberFileUpload(e, index, "idCardFront")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => memberFileRefs.current[index]?.idCardFront?.click()}
                          className="w-full py-2 px-3 h-auto text-sm"
                        >
                          <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {member.idCardFrontUrl ? "Change File" : "Upload ID Card Front"}
                        </Button>
                        {memberUploadProgress[index]?.idCardFront > 0 &&
                          memberUploadProgress[index]?.idCardFront < 100 && (
                            <div className="w-full">
                              <Progress value={memberUploadProgress[index]?.idCardFront} className="h-2" />
                            </div>
                          )}
                        {member.idCardFrontUrl && <span className="text-sm text-green-600">Uploaded</span>}
                      </div>
                      {member.idCardFrontUrl && (
                        <div className="mt-2 border rounded-lg overflow-hidden h-24 sm:h-32">
                          <img
                            src={member.idCardFrontUrl || "/placeholder.svg"}
                            alt="Member ID Card Front Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`member-${index}-idCardBack`}>
                        ID Card (Back) <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id={`member-${index}-idCardBack`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => {
                            if (!memberFileRefs.current[index]) {
                              memberFileRefs.current[index] = {}
                            }
                            memberFileRefs.current[index].idCardBack = el
                          }}
                          onChange={(e) => handleMemberFileUpload(e, index, "idCardBack")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => memberFileRefs.current[index]?.idCardBack?.click()}
                          className="w-full py-2 px-3 h-auto text-sm"
                        >
                          <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {member.idCardBackUrl ? "Change File" : "Upload ID Card Back"}
                        </Button>
                        {memberUploadProgress[index]?.idCardBack > 0 &&
                          memberUploadProgress[index]?.idCardBack < 100 && (
                            <div className="w-full">
                              <Progress value={memberUploadProgress[index]?.idCardBack} className="h-2" />
                            </div>
                          )}
                        {member.idCardBackUrl && <span className="text-sm text-green-600">Uploaded</span>}
                      </div>
                      {member.idCardBackUrl && (
                        <div className="mt-2 border rounded-lg overflow-hidden h-24 sm:h-32">
                          <img
                            src={member.idCardBackUrl || "/placeholder.svg"}
                            alt="Member ID Card Back Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`member-${index}-passport`}>Passport (Optional)</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id={`member-${index}-passport`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          ref={(el) => {
                            if (!memberFileRefs.current[index]) {
                              memberFileRefs.current[index] = {}
                            }
                            memberFileRefs.current[index].passport = el
                          }}
                          onChange={(e) => handleMemberFileUpload(e, index, "passport")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => memberFileRefs.current[index]?.passport?.click()}
                          className="w-full py-2 px-3 h-auto text-sm"
                        >
                          <Upload className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          {member.passportUrl ? "Change File" : "Upload Passport"}
                        </Button>
                        {memberUploadProgress[index]?.passport > 0 && memberUploadProgress[index]?.passport < 100 && (
                          <div className="w-full">
                            <Progress value={memberUploadProgress[index]?.passport} className="h-2" />
                          </div>
                        )}
                        {member.passportUrl && <span className="text-sm text-green-600">Uploaded</span>}
                      </div>
                      {member.passportUrl && (
                        <div className="mt-2 border rounded-lg overflow-hidden h-24 sm:h-32">
                          <img
                            src={member.passportUrl || "/placeholder.svg"}
                            alt="Member Passport Preview"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full py-2 h-auto">
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

