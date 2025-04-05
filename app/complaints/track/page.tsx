"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, Search, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function TrackComplaintPage() {
  const router = useRouter()
  const [trackingId, setTrackingId] = useState("")
  const [error, setError] = useState("")

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()

    if (!trackingId.trim()) {
      setError("Please enter a tracking ID")
      return
    }

    // In a real app, we would validate the tracking ID format
    
    // Navigate to the complaint status page with the tracking ID
    router.push(`/complaints/status/${trackingId}`)
  }

  return (
    <Card className="w-full max-w-3xl mx-auto mt-20">



      <div className="flex flex-row items-center">
        <div className="flex items-center justify-center p-6 bg-white/10 w-1/3">
          <div className="flex flex-col items-center">
          <Shield className="h-16 w-16 text-black mb-2" />

            <h1 className="text-3xl font-bold text-center">SATYAFIR</h1>
          </div>
        </div>
        
        <div className="w-2/3">
          <CardHeader>
            <CardTitle className="text-xl">Track Your Complaint</CardTitle>
            <CardDescription>
              Enter your complaint tracking ID to check its status
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="trackingId"
                  placeholder="Enter tracking ID"
                  value={trackingId}
                  onChange={(e) => {
                    setTrackingId(e.target.value)
                    setError("")
                  }}
                  className={error ? "border-red-500" : ""}
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
              </div>
              
              <p className="text-sm text-muted-foreground">
                You can find your tracking ID in the SMS sent to you or in your email confirmation.
              </p>
              
              <Button type="submit" className="w-full" size="lg">
                <Search className="mr-2 h-4 w-4" />
                Track Complaint
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  )
}