"use client"

import { useEffect } from "react"
import { useUser } from "@/context/user-context"

interface TawkChatWidgetProps {
  propertyId: string
  widgetId: string
}

// Define a proper type for the visitor object
interface TawkVisitor {
  name?: string
  email?: string
  [key: string]: string | undefined
}

export default function TawkChatWidget({ propertyId, widgetId }: TawkChatWidgetProps) {
  const { userName, userEmail, isLoading } = useUser()

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === "undefined") return

    // Initialize Tawk_API safely
    if (!window.Tawk_API) {
      window.Tawk_API = undefined
    }

    // Set the load start time
    window.Tawk_LoadStart = new Date()

    // If Tawk is already loaded and we have user data, set the visitor attributes
    if (window.Tawk_API && !isLoading && (userName || userEmail)) {
      if (window.Tawk_API.setAttributes && typeof window.Tawk_API.setAttributes === "function") {
        const attributes: Record<string, string> = {}

        if (userName) attributes.name = userName
        if (userEmail) attributes.email = userEmail

        window.Tawk_API.setAttributes(attributes, (error) => {
          if (error) {
            console.error("Error setting Tawk visitor attributes:", error)
          }
        })
      }
      return
    }

    // Prepare visitor data if available
    const visitorData: TawkVisitor = {}
    if (userName) visitorData.name = userName
    if (userEmail) visitorData.email = userEmail

    // Create a script element to load Tawk.to
    const script = document.createElement("script")

    // Define what happens before the script loads
    const setupTawk = `
      var Tawk_API = window.Tawk_API || {};
      var Tawk_LoadStart = new Date();
      
      ${
        !isLoading && (userName || userEmail)
          ? `
      // Set visitor information
      Tawk_API.visitor = ${JSON.stringify(visitorData)};
      
      // Set up onLoad handler
      Tawk_API.onLoad = function() {
        if (Tawk_API.setAttributes) {
          Tawk_API.setAttributes(${JSON.stringify(visitorData)}, function(error) {
            if (error) {
              console.error("Error setting Tawk visitor attributes:", error);
            }
          });
        }
      };
      `
          : ""
      }
    `

    // Create a text node with the setup code
    const setupNode = document.createTextNode(setupTawk)

    // Create a script element for the setup code
    const setupScript = document.createElement("script")
    setupScript.appendChild(setupNode)
    document.head.appendChild(setupScript)

    // Configure the main Tawk.to script
    script.async = true
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
    script.charset = "UTF-8"
    script.setAttribute("crossorigin", "*")

    // Add the main script to the document
    document.head.appendChild(script)

    // Cleanup function
    return () => {
      if (setupScript.parentNode) {
        setupScript.parentNode.removeChild(setupScript)
      }

      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }

      // Clean up global variables
      if (typeof window !== "undefined") {
        // @ts-ignore - We're intentionally removing these properties
        window.Tawk_API = undefined
        // @ts-ignore - We're intentionally removing these properties
        window.Tawk_LoadStart = undefined
      }
    }
  }, [propertyId, widgetId, userName, userEmail, isLoading])

  return null
}

