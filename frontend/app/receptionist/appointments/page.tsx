"use client"

import AppointmentBooking from "@/components/appointment-booking"
import { AuthContext } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "sonner";

interface AppointmentBookingProps {
  onViewChange?: (view: "week" | "schedule" | "list") => void;
}

export default function ReceptionistAppointmentsPage() {
  const router = useRouter();
  const { isLoadingAuth, isLoggedIn, user } = useContext(AuthContext);
  const [calendarView, setCalendarView] = useState<"week" | "schedule" | "list">("week");
  
  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Session Expired", { description: "Please Login" });
      router.push("/login");
    }
    else if (user.role != "receptionist") {
      toast.error("Access Denied", { description: "You do not have access to this user role" });
      router.push("/login");
    }
  }, [isLoadingAuth]);

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
              <h1 className="text-2xl sm:text-3xl mt-0 md:mt-0 font-bold text-gray-900">
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
      <AppointmentBooking onViewChange={handleViewChange} userRole="receptionist" />
    </main>
  )
}
