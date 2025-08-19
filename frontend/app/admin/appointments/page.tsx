'use client'

import AppointmentBooking from "@/components/appointment-booking"
import { useState } from "react";

interface AppointmentBookingProps {
  onViewChange?: (view: "week" | "schedule" | "list") => void;
}

export default function AdminAppointmentsPage() {
  const [calendarView, setCalendarView] = useState<"week" | "schedule" | "list">("week");

  const handleViewChange = (view: "week" | "schedule" | "list") => {
    setCalendarView(view);
  };

  return (
    <main className="overflow-auto w-full h-full">
      <div className="px-6 py-0 pb-2 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mt-12 md:mt-0 text-gray-900">
                {calendarView === "schedule" ? "Schedule Management" : "Appointments"}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                {calendarView === "schedule" 
                  ? "Manage your appointments and blocked time slots" 
                  : "View and manage appointments."}
              </p>
            </div>
          </div>
        </div>
      </div>
      <AppointmentBooking onViewChange={handleViewChange} userRole="admin" />
    </main>
  )
}
