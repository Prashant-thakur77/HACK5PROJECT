import { Button } from "@/components/ui/button"
import { OrbitalGraphic } from "@/components/orbital-graphic"
import Link from "next/link"

export function Hero() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden bg-white text-black">
      <div className="container mx-auto px-4 md:px-6 flex flex-col items-center text-center">
        

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black  mb-6 max-w-4xl">
          File and Track Your Complaints Securely
        </h1>

        <p className="text-lg text-gray-800 mb-8 max-w-2xl">
        Empower your voice through our decentralized platform — a secure and transparent system where your complaints are not just registered but actively tracked. Say goodbye to bureaucratic black holes; your concerns stay visible, your data stays protected, and justice stays on course.
        </p>

        <Link href="/complaints/new">
        <Button className="bg-black text-white hover:bg-white hover:text-black border border-black transition-colors px-6 py-3 text-lg rounded-md">
            File a Complaint
          </Button>
        </Link>
      </div>
    </section>
  )
}
