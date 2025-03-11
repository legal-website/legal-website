"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

// Create a client component that uses useSearchParams
function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [invoiceId, setInvoiceId] = useState<string | undefined>(searchParams?.get("invoice") || undefined)
  const [loading, setLoading] = useState(false)

  // Add password strength state
  const [passwordStrength, setPasswordStrength] = useState<{
    isStrong: boolean
    message: string
    criteria: {
      minLength: boolean
      hasUpperCase: boolean
      hasLowerCase: boolean
      hasNumbers: boolean
      hasSpecialChar: boolean
    }
  }>({
    isStrong: false,
    message: "",
    criteria: {
      minLength: false,
      hasUpperCase: false,
      hasLowerCase: false,
      hasNumbers: false,
      hasSpecialChar: false,
    },
  })

  const verifyInvoice = async () => {
    if (!invoiceId) return

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/verify`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invoice verification failed")
      }

      toast({
        title: "Invoice verified!",
        description: data.message,
      })
    } catch (error: any) {
      toast({
        title: "Invoice verification failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Add this function after the verifyInvoice function
  const checkPasswordStrength = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

    const isStrong = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar

    const message = isStrong ? "Password is strong" : "Password is too weak"

    return {
      isStrong,
      message,
      criteria: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar,
      },
    }
  }

  // Add useEffect for password strength checking
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password))
    } else {
      setPasswordStrength({
        isStrong: false,
        message: "",
        criteria: {
          minLength: false,
          hasUpperCase: false,
          hasLowerCase: false,
          hasNumbers: false,
          hasSpecialChar: false,
        },
      })
    }
  }, [password])

  // Update the handleRegister function to check password strength
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      })
      return
    }

    if (!passwordStrength.isStrong) {
      toast({
        title: "Weak password",
        description: "Please use a stronger password that meets all the criteria.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name,
          invoiceId: invoiceId || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      })

      // Redirect to verification page
      router.push("/verify-email?email=" + encodeURIComponent(email))
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verifyInvoice()
  }, [invoiceId])

  return (
    <div className="container grid w-full gap-6 lg:grid-cols-2 xl:grid-cols-2 [&>*:nth-child(1)]:row-span-2">
      <Card className="col-span-12 lg:col-span-1 xl:col-span-1">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your email below to create your account</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              type="text"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              type="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              type="password"
            />
            <div className="space-y-1 mt-1">
              <div className="text-sm font-medium">Password requirements:</div>
              <ul className="space-y-1">
                <li className="text-xs flex items-center gap-1">
                  {passwordStrength.criteria.minLength ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  At least 8 characters
                </li>
                <li className="text-xs flex items-center gap-1">
                  {passwordStrength.criteria.hasUpperCase ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  At least one uppercase letter
                </li>
                <li className="text-xs flex items-center gap-1">
                  {passwordStrength.criteria.hasLowerCase ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  At least one lowercase letter
                </li>
                <li className="text-xs flex items-center gap-1">
                  {passwordStrength.criteria.hasNumbers ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  At least one number
                </li>
                <li className="text-xs flex items-center gap-1">
                  {passwordStrength.criteria.hasSpecialChar ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-500" />
                  )}
                  At least one special character
                </li>
              </ul>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              type="password"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button disabled={loading} onClick={handleRegister}>
            {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </CardFooter>
      </Card>
      <Card className="col-span-12 lg:col-span-1 xl:col-span-1">
        <CardHeader>
          <CardTitle>Already have an account?</CardTitle>
          <CardDescription>Click below to login to your existing account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.push("/login")}>
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// Main page component with Suspense boundary
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}

