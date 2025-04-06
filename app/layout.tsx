
import type React from "react"
import type { Metadata } from "next"
import { Space_Grotesk } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "SATYAFIR",
  description: "Decentralized Police Application",
    generator: 'v0.dev'
}

export default function RootLayout({
  
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'
import { useEffect } from "react"
