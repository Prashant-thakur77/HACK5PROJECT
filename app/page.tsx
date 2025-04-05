"use client"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { ClientLogos } from "@/components/client-logos"
import { Services } from "@/components/services"
import { CaseStudies } from "@/components/case-studies"

import { Footer } from "@/components/footer"
import { useEffect } from "react"
import { useComplaintStore } from '../lib/stores/complaintStore'

export default function Home() {
  const fetchComplaints = useComplaintStore((state) => state.fetchComplaints)

  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero /> 
        <Services/>
        
      </main>
      <Footer />
    </div>
  )
}

