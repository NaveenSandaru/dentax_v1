"use client"

import AdminSidebar from "@/components/adminsidebar"
import DoctorHeader from "@/components/Doctorheader"
import { SidebarProvider } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import type React from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isRootPage = pathname === "/"
  
  if (isRootPage) {
    return (
      <div className="h-screen w-full bg-gray-100">
        {children}
      </div>
    )
  }

  return ( 
    <SidebarProvider>
      <div className="flex h-screen w-full">
      <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      {/*  <DoctorHeader/>  <- Add the Header component here */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}