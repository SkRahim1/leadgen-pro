import type { Metadata } from "next"
import "./globals.css"
import { AppProvider } from "@/lib/context/AppContext"

export const metadata: Metadata = {
  title: "Renvix LeadFlow — Generate Leads. Manage Customers. Close More Deals.",
  description: "Find hot B2B leads in any Indian city. Search businesses by category, score leads based on your seller profile, and manage your pipeline to close more deals.",
  icons: {
    icon: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
