"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { FcGoogle } from "react-icons/fc"
import { Eye, EyeOff, Mail, User, Lock, CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { signIn } from "next-auth/react"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | undefined>(searchParams?.get("invoice") || undefined)

  // Password strength state
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

  // Check password strength
  useEffect(() => {
    if (password) {
      const minLength = 8
      const hasUpperCase = /[A-Z]/.test(password)
      const hasLowerCase = /[a-z]/.test(password)
      const hasNumbers = /\d/.test(password)
      const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)

      const isStrong = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar

      setPasswordStrength({
        isStrong,
        message: isStrong ? "Password is strong" : "Password is too weak",
        criteria: {
          minLength: password.length >= minLength,
          hasUpperCase,
          hasLowerCase,
          hasNumbers,
          hasSpecialChar,
        },
      })
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

  // Verify invoice if provided
  useEffect(() => {
    if (invoiceId) {
      verifyInvoice(invoiceId)
    }
  }, [invoiceId])

  const verifyInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/invoices/${id}/verify`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Invoice verification failed")
      }

      if (data.invoice) {
        setEmail(data.invoice.customerEmail || "")
        setName(data.invoice.customerName || "")
      }

      toast({
        title: "Invoice verified",
        description: "Please complete your registration to access your account.",
      })
    } catch (error: any) {
      toast({
        title: "Invoice verification failed",
        description: error.message || "Unable to verify your invoice. Please contact support.",
        variant: "destructive",
      })
    }
  }

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
      router.push(`/verify-email?email=${encodeURIComponent(email)}`)
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

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (err) {
      // Error handling is done via the redirect
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <CardDescription className="text-center">
            {invoiceId
              ? "Complete your registration to access your purchase"
              : "Enter your details to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={!!invoiceId && !!email}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password strength indicators */}
              {password && (
                <div className="mt-2 space-y-2">
                  <p className={`text-sm ${passwordStrength.isStrong ? "text-green-600" : "text-amber-600"}`}>
                    {passwordStrength.message}
                  </p>
                  <div className="space-y-1">
                    <div className="text-xs flex items-center gap-1">
                      {passwordStrength.criteria.minLength ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span>At least 8 characters</span>
                    </div>
                    <div className="text-xs flex items-center gap-1">
                      {passwordStrength.criteria.hasUpperCase ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span>At least one uppercase letter</span>
                    </div>
                    <div className="text-xs flex items-center gap-1">
                      {passwordStrength.criteria.hasLowerCase ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span>At least one lowercase letter</span>
                    </div>
                    <div className="text-xs flex items-center gap-1">
                      {passwordStrength.criteria.hasNumbers ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span>At least one number</span>
                    </div>
                    <div className="text-xs flex items-center gap-1">
                      {passwordStrength.criteria.hasSpecialChar ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-red-500" />
                      )}
                      <span>At least one special character</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="w-full">
            <FcGoogle className="h-5 w-5 mr-2" />
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}

