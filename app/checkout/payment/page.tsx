"use client"

// Update only the handleUpload function in the existing file
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/context/CartContext"

const handleUpload = async () => {
  const { toast } = useToast()
  const router = useRouter()
  const { clearCart } = useCart()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const checkoutData = sessionStorage.getItem("checkoutData")
    ? JSON.parse(sessionStorage.getItem("checkoutData")!)
    : null

  if (!file) {
    toast({
      title: "No file selected",
      description: "Please select a receipt file to upload.",
      variant: "destructive",
    })
    return
  }

  if (!checkoutData) {
    toast({
      title: "Missing checkout data",
      description: "Please go back to checkout and try again.",
      variant: "destructive",
    })
    return
  }

  setUploading(true)

  try {
    // Create form data for file upload
    const formData = new FormData()
    formData.append("receipt", file)

    console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type)

    // Upload receipt to Cloudinary
    const uploadResponse = await fetch("/api/upload-receipt", {
      method: "POST",
      body: formData,
    })

    // Get the response text first for debugging
    const responseText = await uploadResponse.text()
    console.log("Raw upload response:", responseText)

    // Try to parse as JSON
    let uploadData
    try {
      uploadData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse upload response as JSON:", parseError)
      throw new Error("Invalid response from server: " + responseText.substring(0, 100))
    }

    if (!uploadResponse.ok) {
      throw new Error(uploadData.message || uploadData.error || "Failed to upload receipt")
    }

    if (!uploadData.url) {
      throw new Error("No URL returned from upload")
    }

    const receiptUrl = uploadData.url
    console.log("Receipt uploaded successfully:", receiptUrl)

    // Create invoice with receipt URL
    console.log("Creating invoice with receipt URL:", receiptUrl)
    const invoiceResponse = await fetch("/api/create-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: checkoutData.customer,
        items: checkoutData.items,
        total: checkoutData.total,
        paymentReceipt: receiptUrl,
      }),
    })

    // Get the response text first for debugging
    const invoiceResponseText = await invoiceResponse.text()
    console.log("Raw invoice response:", invoiceResponseText)

    // Try to parse as JSON
    let invoiceData
    try {
      invoiceData = JSON.parse(invoiceResponseText)
    } catch (parseError) {
      console.error("Failed to parse invoice response as JSON:", parseError)
      throw new Error("Invalid response from server: " + invoiceResponseText.substring(0, 100))
    }

    if (!invoiceResponse.ok) {
      throw new Error(invoiceData.message || invoiceData.error || "Failed to create invoice")
    }

    if (!invoiceData.invoice || !invoiceData.invoice.id) {
      throw new Error("No invoice ID returned from server")
    }

    // Clear cart and checkout data
    clearCart()
    sessionStorage.removeItem("checkoutData")

    // Show success message
    toast({
      title: "Payment submitted",
      description: "Your payment receipt has been uploaded successfully. We'll process your order shortly.",
    })

    // Redirect to success page
    router.push(`/invoice/${invoiceData.invoice.id}`)
  } catch (error: any) {
    console.error("Upload error:", error)
    toast({
      title: "Upload failed",
      description: error.message || "Something went wrong. Please try again.",
      variant: "destructive",
    })
  } finally {
    setUploading(false)
  }
}

