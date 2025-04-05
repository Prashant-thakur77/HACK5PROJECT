"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Menu, Shield, X } from "lucide-react"
import { ethers } from "ethers"
import PoliceWalletManager from "../src/contracts/PoliceWalletManager.sol/PoliceWalletManager.json"

declare global {
  interface Window {
    ethereum: any;
  }
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentAccount, setCurrentAccount] = useState("")
  const [userRole, setUserRole] = useState<"owner" | "police" | "citizen" | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      if (typeof window.ethereum !== "undefined" && CONTRACT_ADDRESS) {
        try {
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length > 0) {
            await checkUserRole(accounts[0])
          }
        } catch (error) {
          console.error("Initial connection error:", error)
        }
      }
    }
    initialize()
  }, [])

  const checkUserRole = async (address: string) => {
    if (!CONTRACT_ADDRESS) {
      console.error("Contract address not configured")
      return
    }

    try {
      setLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, PoliceWalletManager.abi, provider)

      const owner = await contract.owner()
      if (!ethers.isAddress(owner)) {
        throw new Error("Invalid owner address returned from contract")
      }

      const isPolice = await contract.isPolice(address)

      setCurrentAccount(address)
      setUserRole(address.toLowerCase() === owner.toLowerCase() ? "owner" : isPolice ? "police" : "citizen")
    } catch (error) {
      console.error("Role check failed:", error)
      alert("Error connecting to contract. Please check network and try again.")
      setUserRole(null)
      setCurrentAccount("")
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask!")
      return
    }

    if (!CONTRACT_ADDRESS) {
      alert("Contract not configured")
      return
    }

    try {
      setLoading(true)
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      await checkUserRole(accounts[0])
      redirectToDashboard()
    } catch (error) {
      console.error("Connection error:", error)
      alert("Wallet connection failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const redirectToDashboard = () => {
    if (!userRole) return
    const routes = {
      owner: "/owner/dashboard",
      police: "/police/dashboard",
      citizen: "/user/dashboard"
    }
    window.location.href = routes[userRole]
  }

  return (
    <header className="border-b border-[#DDD] bg-white text-black">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-black" />
          <span className="text-2xl font-bold">SATYAFIR</span>
        </Link>

        {/* Mobile menu button */}
        <button className="md:hidden text-black" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/complaints/new" className="hover:underline hover:opacity-80">
            Create Complaint
          </Link>
          <Link href="/complaints/track" className="hover:underline hover:opacity-80">
            Track Complaint
          </Link>
          <Button
            variant="outline"
            onClick={handleLogin}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            {currentAccount ? `${currentAccount.slice(0, 6)}...` : "Login"}
          </Button>
        </nav>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="absolute top-20 left-0 right-0 bg-white z-50 border-t border-[#DDD] md:hidden">
            <div className="flex flex-col p-4 space-y-4">
              <Link href="/about" className="hover:underline hover:opacity-80">
                About us
              </Link>
              <Link href="/services" className="hover:underline hover:opacity-80">
                Services
              </Link>
              <Link href="/use-cases" className="hover:underline hover:opacity-80">
                Use Cases
              </Link>
              <Link href="/pricing" className="hover:underline hover:opacity-80">
                Pricing
              </Link>
              <Link href="/blog" className="hover:underline hover:opacity-80">
                Blog
              </Link>
              <Button
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white"
              >
                Request a quote
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
