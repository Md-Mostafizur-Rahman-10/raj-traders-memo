"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import LoginPage from "./login-page"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  console.log("ProtectedRoute user:", user)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || (user.email !== "aabansaad@gmail.com" &&
              user.email !== "badhon16@gmail.com" &&
              user.email !== "mostafizurrahmanifat10@gmail.com")) {
  return <LoginPage />;
}

  return <>{children}</>
}
