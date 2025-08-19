"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { generateDentistTimeSlots, isDentistWorkingDay, mockAppointments } from "@/lib/mock-data"
import type { Dentist, Appointment, DayOfWeek } from "@/types/dentist"
import { AuthContext } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { toast } from "sonner"
import { CancelAppointmentDialog } from "./cancel-appointment-dialog"

interface DoctorScheduleColumnProps {
  dentist: Dentist
  weekDays: DayOfWeek[]
  selectedWeek: string
  viewMode: "day" | "week"
  selectedDate: string
  onSlotSelect?: (dentistId: string, dentistName: string, date: string, timeSlot: string) => void
}

interface Blocked{
  blocked_date_id:number
  dentist_id: string
  date: string
  time_from: string
  time_to: string
}

export function DoctorScheduleColumn({
  dentist,
  weekDays,
  selectedWeek,
  viewMode,
  selectedDate,
  onSlotSelect,
}: DoctorScheduleColumnProps) {
  const dentistTimeSlots = generateDentistTimeSlots(dentist)
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [blocked, setBlocked] = useState<Blocked[]>([]);

  const getDuration = (from: string, to: string) => {
    const [fromHours, fromMinutes] = from.split(':').map(Number);
    const [toHours, toMinutes] = to.split(':').map(Number);
  
    const fromDate = new Date(0, 0, 0, fromHours, fromMinutes);
    const toDate = new Date(0, 0, 0, toHours, toMinutes);
  
    let diff = (toDate.getTime() - fromDate.getTime()) / 1000 / 60; // difference in minutes
  
    // Handle cases where time_to is past midnight (optional)
    if (diff < 0) diff += 24 * 60;
  
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
  
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Helper to trim seconds from a time string (e.g. "09:00:00" -> "09:00")
  const normalizeTime = (t: string) => {
    if (!t) return "";
    const trimmed = t.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = match[1].padStart(2, "0");
      const m = match[2].padStart(2, "0");
      return `${h}:${m}`;
    }
    // Fallback – if regex fails, attempt simple split
    const [rawH, rawM = "00"] = trimmed.split(":");
    const h = (rawH || "0").padStart(2, "0");
    const m = (rawM || "0").padStart(2, "0").replace(/\D+/g, ""); // strip non-digits
    return `${h}:${m || "00"}`;
  };

  // Helper – convert ISO date string to local YYYY-MM-DD (avoids timezone offsets)
  const normalizeDate = (iso: string) => {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, "0");
    const da = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${da}`;
  };

  const getAppointmentForSlot = (date: string, time: string): Appointment | null => {
    const slotTime = normalizeTime(time);
    return (
      appointments.find((apt) => {
        const aptDate = normalizeDate(apt.date);
        const aptTime = normalizeTime(apt.time_from);
        return String(apt.dentist_id) === String(dentist.dentist_id) && aptDate === date && aptTime === slotTime;
      }) || null
    );
  }

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const calculateSlotSpan = (appointment: Appointment): number => {
    if (!appointment.time_from || !appointment.time_to) return 1;
    
    const startMinutes = timeToMinutes(normalizeTime(appointment.time_from));
    const endMinutes = timeToMinutes(normalizeTime(appointment.time_to));
    const durationMinutes = endMinutes - startMinutes;
    
    return Math.max(1, Math.ceil(durationMinutes / 15));
  };

  const isSlotOccupiedByAppointment = (date: string, time: string): Appointment | null => {
    const slotMinutes = timeToMinutes(normalizeTime(time));
    
    return appointments.find((apt) => {
      const aptDate = normalizeDate(apt.date);
      if (String(apt.dentist_id) !== String(dentist.dentist_id) || aptDate !== date) {
        return false;
      }
      
      const aptStartMinutes = timeToMinutes(normalizeTime(apt.time_from));
      const aptEndMinutes = timeToMinutes(normalizeTime(apt.time_to));
      
      return slotMinutes >= aptStartMinutes && slotMinutes < aptEndMinutes;
    }) || null;
  };

  const getBlockedForSlot = (date: string, time: string) => {
    const slotTime = normalizeTime(time);
    const slotMinutes = timeToMinutes(slotTime);
    
    return (
      blocked.find((blk) => {
        const blkDate = normalizeDate(blk.date);
        if (String(blk.dentist_id) !== String(dentist.dentist_id) || blkDate !== date) {
          return false;
        }
        
        const blkStart = timeToMinutes(normalizeTime(blk.time_from));
        const blkEnd = timeToMinutes(normalizeTime(blk.time_to));
        
        return slotMinutes >= blkStart && slotMinutes < blkEnd;
      }) || null
    );
  }

  const getAppointmentContent = (day: DayOfWeek, timeSlot: string) => {
    const isWorkingDay = isDentistWorkingDay(dentist, day.dayIndex)

    if (!isWorkingDay) {
      return (
        <div className="h-16 sm:h-20 bg-gray-50 border-1 border-gray-50  p-1 sm:p-2 flex items-center justify-center">
          <span className="text-xs sm:text-sm text-gray-400 font-medium">Off</span>
        </div>
      )
    }

    const appointment = getAppointmentForSlot(day.date, timeSlot);
    const block = getBlockedForSlot(day.date, timeSlot);
    const occupiedByAppointment = isSlotOccupiedByAppointment(day.date, timeSlot);

    // Check if this slot is part of a multi-slot appointment but not the first slot
    const isContinuationSlot = occupiedByAppointment && !appointment;
    if (isContinuationSlot) {
      const slotSpan = calculateSlotSpan(occupiedByAppointment);
      const isLastSlot = timeSlot === occupiedByAppointment.time_to;
      const isMiddleSlot = !isLastSlot && timeSlot !== occupiedByAppointment.time_from;
      
      // Get the status colors for the appointment
      const statusColours: Record<string, { bg: string; border: string; text: string }> = {
        confirmed: { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800' },
        pending: { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800' },
        completed: { bg: 'bg-gray-100', border: 'border-gray-200', text: 'text-gray-800' },
        noshow: { bg: 'bg-red-100', border: 'border-2 border-red-500', text: 'text-red-900 font-extrabold' },
        cancelled: { bg: 'bg-gray-100', border: 'border border-gray-300 border-dashed', text: 'text-gray-500' },
      };
      
      const status = occupiedByAppointment.status?.toLowerCase() || 'confirmed';
      const colours = statusColours[status] || statusColours.confirmed;
      
      return (
        <div 
          className={`h-16 sm:h-20 p-1 sm:p-2 relative ${colours.bg}`}
          style={{ 
            height: '100%',
            border: 'none',
            marginTop: '-1px',
            borderRight: '1px solid #e5e7eb',
            borderLeft: '1px solid #e5e7eb',
            // Apply the same border color as the main appointment
            ...(occupiedByAppointment.status?.toLowerCase() === 'noshow' ? {
              borderRight: '2px solid #ef4444',
              borderLeft: '2px solid #ef4444',
            } : {})
          }}
        />
      );
    }

    if (!appointment && !block) {
      return (
        <div 
          className="h-16 sm:h-20 bg-white border-1 border-gray-100 p-1 sm:p-2 flex flex-col items-center justify-center text-xs sm:text-sm text-gray-500 hover:bg-emerald-50 cursor-pointer transition-all duration-200 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md group"
          onClick={() => onSlotSelect?.(dentist.dentist_id, dentist.name, day.date, timeSlot)}
          title="Click to book appointment"
        >
          <span className="font-medium group-hover:text-emerald-600">Available</span>
          <span className="text-[10px] opacity-60 group-hover:opacity-100 group-hover:text-emerald-500 mt-1">Click to book</span>
        </div>
      );
    }

    if (block) {
      return (
        <div className="h-16 sm:h-20 bg-red-100 border-2 border-red-200 p-1 sm:p-2 flex items-center justify-center text-xs sm:text-sm text-red-600 font-medium">
          Blocked
        </div>
      );
    }

    if (appointment) {
      const slotSpan = calculateSlotSpan(appointment);
      const appointmentHeight = viewMode === "day" ? 80 * slotSpan : 80; // Height based on slot span
      const isMultiSlot = slotSpan > 1;
      
      if (viewMode === "week") {
        // Calculate the total height needed for the appointment
        const slotHeight = 80; // 80px per slot
        const totalHeight = slotHeight * slotSpan;
        // Calculate the vertical position to center the content
        const contentTop = Math.max(0, (totalHeight - 60) / 2); // 60px is the approximate height of the content
        
        const statusColours: Record<string, { bg: string; border: string; text: string }> = {
          confirmed: { bg: "bg-green-100", border: "border-green-200", text: "text-green-800" },
          pending: { bg: "bg-yellow-100", border: "border-yellow-200", text: "text-yellow-800" },
          completed: { bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-800" },
          'noshow': { 
            bg: "bg-red-100", 
            border: "border-2 border-red-500", 
            text: "text-red-900 font-extrabold",
          },
        };
        const colours = statusColours[appointment.status?.toLowerCase()] || statusColours.confirmed;
        const isSelected = selectedAppointments.includes(parseInt(appointment.appointment_id));
        const isNoShow = appointment.status?.toLowerCase() === 'noshow';
        
        return (
          <div
            className={`${colours.bg} flex flex-col items-center text-[10px] sm:text-xs font-semibold ${colours.text} relative group`}
            style={{ 
              height: `${appointmentHeight}px`, 
              minHeight: `${appointmentHeight}px`,
              gridRowEnd: isMultiSlot ? `span ${slotSpan}` : 'auto',
              position: 'relative',
              overflow: 'visible',
              zIndex: isMultiSlot ? 1 : 'auto',
              // Border styling for multi-slot appointments
              border: '1px solid #e5e7eb',
              borderBottom: timeSlot === appointment.time_to ? '1px solid #e5e7eb' : 'none',
              borderTop: timeSlot === appointment.time_from ? '1px solid #e5e7eb' : 'none',
              borderLeft: '1px solid #e5e7eb',
              borderRight: '1px solid #e5e7eb',
              // Special border for selected state
              ...(isSelected ? {
                border: '2px solid #3b82f6',
                borderBottom: timeSlot === appointment.time_to ? '2px solid #3b82f6' : 'none',
                borderTop: timeSlot === appointment.time_from ? '2px solid #3b82f6' : 'none',
                borderRight: '2px solid #3b82f6',
                borderLeft: '2px solid #3b82f6'
              } : {})
            }}
            onClick={(e) => {
              e.stopPropagation();
              toggleAppointmentSelection(parseInt(appointment.appointment_id));
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleIndividualCancel(appointment.appointment_id, appointment.patient?.name ?? "Patient");
            }}
            title={isNoShow ? "NO SHOW - " : "" + "Left click to select, Right click to cancel"}
          >
              <div 
                className="flex flex-col items-center w-full p-1"
                style={{
                  position: 'absolute',
                  top: isMultiSlot ? `${contentTop}px` : '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'calc(100% - 16px)',
                  zIndex: 2,
                  pointerEvents: 'auto'
                }}
              >
                <div className="text-sm font-medium whitespace-nowrap">
                  {appointment.time_from} - {appointment.time_to}
                </div>
                {isNoShow && (
                  <div className="bg-red-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-red-700 shadow-sm whitespace-nowrap mt-1">
                    NO SHOW
                  </div>
                )}
                <div className={`text-center ${isNoShow ? 'line-through text-red-900 font-bold' : ''}`}>
                  {appointment.temp_patient?.name || appointment.patient?.name || "Patient"}
                </div>
                {appointment.invoice_services?.service_name && (
                  <div className={`text-[8px] font-medium mt-0.5 px-1 ${isNoShow ? 'text-red-700 bg-red-50' : 'text-gray-600 bg-gray-50'}`}>
                    {appointment.invoice_services.service_name}
                  </div>
                )}
              </div>
            
            {isSelected && (
              <div 
                className="absolute top-1 right-1 w-3 h-3 bg-blue-500"
                style={{ zIndex: 3 }}
              ></div>
            )}
            
            {/* Cancel button on hover */}
            <div 
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ zIndex: 3 }}
            >
              <button
                className="w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleIndividualCancel(appointment.appointment_id, appointment.temp_patient?.name || appointment.patient?.name || "Patient");
                }}
                title="Cancel appointment"
              >
                ×
              </button>
            </div>
          </div>
        );
      }

      // Day view: detailed view

      // Choose styling by status
      const statusColours: Record<string, { bg: string; border: string; text: string; pattern?: string }> = {
        confirmed: { bg: "bg-green-100", border: "border-green-200", text: "text-green-800" },
        pending: { bg: "bg-yellow-100", border: "border-yellow-200", text: "text-yellow-800" },
        completed: { bg: "bg-gray-100", border: "border-gray-200", text: "text-gray-800" },
        'noshow': { 
          bg: "bg-red-100", 
          border: "border-2 border-red-500", 
          text: "text-red-900 font-extrabold",
          pattern: "bg-[repeating-linear-gradient(-45deg,#fecaca,#fecaca_10px,#fef2f2_10px,#fef2f2_20px)]"
        },
        cancelled: { bg: "bg-gray-100", border: "border border-gray-300 border-dashed", text: "text-gray-500" },
      };
      const colours = statusColours[appointment.status?.toLowerCase()] || statusColours.confirmed;

      const isSelected = selectedAppointments.includes(parseInt(appointment.appointment_id));
      
      return (
        <div
          className={`${colours.bg} border-2 ${isSelected ? 'border-blue-500 border-4' : colours.border}  p-1 sm:p-2 text-xs cursor-pointer hover:opacity-90 transition-colors relative group`}
          style={{ height: `${appointmentHeight}px`, minHeight: `${appointmentHeight}px` }}
          onClick={(e) => {
            e.stopPropagation();
            toggleAppointmentSelection(parseInt(appointment.appointment_id));
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleIndividualCancel(appointment.appointment_id, appointment.patient?.name ?? "Appointment");
          }}
          title="Left click to select, Right click to cancel"
        >
          {isSelected && (
            <div className="absolute top-1 right-1 w-3 h-3 bg-blue-500 "></div>
          )}
          {/* Cancel button - top right corner */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button
              className="w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                handleIndividualCancel(appointment.appointment_id, appointment.temp_patient?.name || appointment.patient?.name || "Appointment");
              }}
              title="Cancel appointment"
            >
              ×
            </button>
          </div>
          <div className="relative w-full">
            {appointment.status?.toLowerCase() === 'noshow' && (
              <div className="absolute inset-0 -m-1  bg-red-100 opacity-30"></div>
            )}
            <div className="relative z-10 flex h-full">
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className={`truncate text-[10px] sm:text-xs leading-tight ${colours.text} ${appointment.status?.toLowerCase() === 'noshow' ? 'font-extrabold line-through decoration-2 decoration-red-600' : ''}`}>
                  {appointment.temp_patient?.name || appointment.patient?.name || "Appointment"}
                </span>
                {appointment.invoice_services?.service_name && (
                  <span className="text-[8px] text-gray-600 font-medium mt-0.5 bg-gray-50 px-1 ">
                    {appointment.invoice_services.service_name}
                  </span>
                )}
              </div>
              {appointment.status?.toLowerCase() === 'noshow' && (
                <div className="flex items-center pr-2">
                  <span className="bg-red-600 text-white text-[9px] font-extrabold px-2 py-1  border border-red-700 shadow-sm whitespace-nowrap">
                    NO SHOW
                  </span>
                </div>
              )}
            </div>
          </div>
          {appointment.note && (
            <div className={`${colours.text.replace("800", "700")} text-[10px] sm:text-xs leading-tight truncate mt-1`}>
              {appointment.note}
            </div>
          )}
          <div className={`${appointment.status?.toLowerCase() === 'noshow' ? 'text-red-700 font-bold' : colours.text.replace("800", "600")} text-[10px] sm:text-xs mt-1`}>
            {appointment.status?.toLowerCase() === 'noshow' ? (
              <span className="flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {getDuration(appointment.time_from, appointment.time_to)}
              </span>
            ) : (
              getDuration(appointment.time_from, appointment.time_to)
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="h-16 sm:h-20 bg-white border-2 border-gray-200 p-1 sm:p-2 flex items-center justify-center text-xs sm:text-sm text-gray-500">
        Available
      </div>
    );
  }

  // Filter days based on view mode
  const displayDays = viewMode === "day" ? weekDays.filter((day) => day.date === selectedDate) : weekDays

  // Get appointments for the selected date (for day view statistics)
  const dayAppointments =
    viewMode === "day"
      ? appointments.filter((apt) => apt.dentist_id === dentist.dentist_id && apt.date.split("T")[0] === selectedDate)
      : []

  // Check if dentist is working on selected date (for day view)
  const {isLoadingAuth, isLoggedIn, user, apiClient} = useContext(AuthContext);
  
  // Toggle selection of an appointment
  const toggleAppointmentSelection = (appointmentId: number) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  // Toggle select all appointments for this dentist only
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedAppointments([]);
    } else {
      // Only select appointments for the current dentist
      const dentistAppointmentIds = appointments
        .filter(apt => apt.dentist_id === dentist.dentist_id)
        .map(apt => parseInt(apt.appointment_id));
      setSelectedAppointments(dentistAppointmentIds);
    }
    // selectAll state is now managed by useEffect
  };

  // Handle cancellation with note
  const handleCancelWithNote = async (note: string) => {
    if (selectedAppointments.length === 0) return;
    
    try {
      // Update each selected appointment's status to 'cancelled' with the note
      const updatePromises = selectedAppointments.map(appointmentId => 
        apiClient.put(
          `/appointments/${appointmentId}`,
          { 
            status: 'cancelled',
            cancel_note: note || null
          }
        )
      );
      
      await Promise.all(updatePromises);
      
      toast.success(selectedAppointments.length > 1 
        ? "Appointments cancelled successfully" 
        : "Appointment cancelled successfully"
      );
      
      // Clear selections and refresh appointments
      setSelectedAppointments([]);
      setIsCancelDialogOpen(false);
      await fetchAppointments(); // Refresh the appointments list
    } catch (err: any) {
      console.error("Error cancelling appointments:", err);
      throw err; // Re-throw to be handled by the dialog
    }
  };
  
  // Open the cancellation dialog
  const openCancelDialog = () => {
    if (selectedAppointments.length === 0) return;
    setIsCancelDialogOpen(true);
  };

  // Handle individual appointment cancellation
  const handleIndividualCancel = (appointmentId: string, patientName: string) => {
    setIndividualCancelAppointment({ id: appointmentId, name: patientName });
  };

  // Cancel individual appointment with note
  const handleIndividualCancelWithNote = async (note: string) => {
    if (!individualCancelAppointment) return;
    
    try {
      console.log('🔄 Cancelling appointment:', {
        id: individualCancelAppointment.id,
        name: individualCancelAppointment.name,
        note: note
      });
      
      const response = await apiClient.put(
        `/appointments/${individualCancelAppointment.id}`,
        { 
          status: 'cancelled',
          cancel_note: note || null
        }
      );
      
      console.log('✅ Appointment cancelled successfully:', response.data);
      toast.success("Appointment cancelled successfully");
      
      setIndividualCancelAppointment(null);
      await fetchAppointments(); // Refresh the appointments list
    } catch (err: any) {
      console.error("❌ Error cancelling appointment:", {
        appointmentId: individualCancelAppointment.id,
        error: err.response?.data || err.message,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      
      // Show more specific error message
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || "Failed to cancel appointment";
      toast.error(`Failed to cancel appointment: ${errorMessage}`);
      
      throw err; // Re-throw to be handled by the dialog
    }
  };

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const selectedDateObj = new Date(selectedDate)
  const selectedDayIndex = selectedDateObj.getDay()
  const isWorkingSelectedDay = isDentistWorkingDay(dentist, selectedDayIndex)

  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingBlocked, setLoadingBlocked] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [individualCancelAppointment, setIndividualCancelAppointment] = useState<{id: string, name: string} | null>(null);

  const fetchBlocked = async () => {
    setLoadingBlocked(true);
    try{
      const response = await apiClient.get(
        `/blocked-dates`
      );
      if(response.status == 500){
        throw new Error("Error Fetching Blocked Slots");
      }
      setBlocked(response.data);
    }
    catch(err: any){
      toast.error("Error",{description:err.message});
    }
    finally{
      setLoadingBlocked(false);
    }
  }

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const response = await apiClient.get(
        `/appointments/fordentist/${dentist.dentist_id}`
      );
      if (response.status == 500) {
        throw new Error(`Error Fetching Appointments for Doctor: ${dentist.name}`);
      }
      // Filter out cancelled appointments
      const activeAppointments = response.data.filter(
        (appt: any) => appt.status?.toLowerCase() !== 'cancelled'
      );
      setAppointments(activeAppointments);
    } catch (err: any) {
      console.error("Error fetching appointments:", err);
      toast.error("Failed to fetch appointments", { 
        description: err.response?.data?.message || err.message 
      });
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Update selectAll state based on current dentist's appointments selection
  useEffect(() => {
    const dentistAppointments = appointments.filter(apt => apt.dentist_id === dentist.dentist_id);
    const dentistAppointmentIds = dentistAppointments.map(apt => parseInt(apt.appointment_id));
    
    if (dentistAppointmentIds.length > 0) {
      const allSelected = dentistAppointmentIds.every(id => selectedAppointments.includes(id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [selectedAppointments, appointments, dentist.dentist_id]);

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      window.alert("Please Log in");
      router.push("/login");
    }
    else if(user.role != "receptionist" && user.role != "admin"){
      window.alert("Access Denied");
      router.push("/login");
    }
    fetchAppointments();
    fetchBlocked();
  },[isLoadingAuth])
  

  return (
    <Card className="w-full relative">
        {/* Cancel Selected Button */}
        {selectedAppointments.length > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={openCancelDialog}
              className="text-xs px-2 py-1 h-auto"
            >
              Cancel Selected ({selectedAppointments.length})
            </Button>
          </div>
        )}
        
        {/* Cancel Appointment Dialog */}
        <CancelAppointmentDialog
          open={isCancelDialogOpen}
          onOpenChange={setIsCancelDialogOpen}
          onCancel={handleCancelWithNote}
          selectedCount={selectedAppointments.length}
        />
        
        {/* Individual Cancel Appointment Dialog */}
        {individualCancelAppointment && (
          <CancelAppointmentDialog
            open={!!individualCancelAppointment}
            onOpenChange={(open) => {
              if (!open) setIndividualCancelAppointment(null);
            }}
            onCancel={handleIndividualCancelWithNote}
            selectedCount={1}
            patientName={individualCancelAppointment.name}
          />
        )}
      
      <CardHeader className="pb-2 sm:pb-3">
        {/* Working Hours and Days Info with Select All Button */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
              {dentist.work_time_from} - {dentist.work_time_to}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
              {dentist.work_days_from} - {dentist.work_days_to}
            </Badge>
            {viewMode === "day" && (
              <div className="flex items-center gap-2">
                <Badge variant={isWorkingSelectedDay ? "default" : "secondary"} className="text-xs px-2 sm:px-3 py-1">
                  {isWorkingSelectedDay ? "Working Today" : "Off Today"}
                </Badge>
                {appointments.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={toggleSelectAll}
                    className="text-xs h-6 px-2"
                  >
                    {selectAll ? 'Deselect All' : 'Select All'}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Day View Statistics */}
        {viewMode === "day" && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-purple-50">
            <div className="text-xs sm:text-sm text-purple-800">
              <span className="font-semibold">{dayAppointments.length}</span> appointments scheduled
              {isWorkingSelectedDay && <span className="ml-2">• {dentistTimeSlots.length} total slots available</span>}
            </div>
          </div>
        )}

        {/* Week Days Header */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Empty div to match time label width */}
            <div className="w-12 sm:w-16 flex-shrink-0"></div>
            
            {/* Days grid - matches the time slots grid */}
            <div className={`grid gap-1 sm:gap-2 flex-1 ${viewMode === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
              {displayDays.map((day, index) => {
                const isWorkingDay = isDentistWorkingDay(dentist, day.dayIndex)
                const dayAppointmentCount = appointments.filter(
                  (apt) => apt.dentist_id === dentist.dentist_id && apt.date.split("T")[0] === day.date,
                ).length

                return (
                  <div
                    key={index}
                    className={`text-center p-2 sm:p-3 text-xs sm:text-sm font-medium ${
                      isWorkingDay
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-gray-50 text-gray-400 border border-gray-200"
                    }`}
                  >
                    <div className="font-semibold">
                      {viewMode === "day"
                        ? new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })
                        : day.name}
                    </div>
                    {viewMode === "week" && <div className="text-[10px] sm:text-xs mt-1">{day.date.split("-")[2]}</div>}
                    {viewMode === "day" && <div className="text-[10px] sm:text-xs">{dayAppointmentCount} appointments</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Time Slots Grid */}
       <div className=" ">
  {dentistTimeSlots.map((timeSlot) => {
    // Check if the time slot is exactly on the hour (e.g., "09:00", "10:00")
    const isHourly = timeSlot.endsWith(":00");

    return (
      <div key={timeSlot} className="flex items-center gap-3">
        {/* Time Label (only for hourly slots) */}
        <div className="w-12 sm:w-16 text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0">
          {isHourly ? timeSlot : ""}
        </div>

        {/* Appointment Slots for each day */}
        <div
          className={`grid gap-1 sm:gap-2 flex-1 ${
            viewMode === "day" ? "grid-cols-1" : "grid-cols-7"
          }`}
        >
          {displayDays.map((day, dayIndex) => (
            <div key={dayIndex} className="min-w-0">
              {getAppointmentContent(day, timeSlot)}
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>


        {/* No appointments message for day view */}
        {viewMode === "day" && dayAppointments.length === 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 text-center">
            <p className="text-xs sm:text-sm text-gray-600">
              {isWorkingSelectedDay ? "No appointments scheduled for this date" : "Doctor is not working on this date"}
            </p>
          </div>
        )}

        {/* Doctor Details */}
        {/*<div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
          <div>
            <span className="font-semibold text-gray-800">Services:</span>
            <div className="mt-1 text-xs sm:text-sm leading-relaxed">{dentist.service_types}</div>
          </div>
          <div>
            <span className="font-semibold text-gray-800">Languages:</span>
            <span className="ml-2">{dentist.language}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <div>
              <span className="font-semibold text-gray-800">Contact:</span>
              <span className="ml-2">{dentist.phone_number}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-800">Email:</span>
              <span className="ml-2 break-all">{dentist.email}</span>
            </div>
          </div>
        </div>*/}
      </CardContent>
    </Card>
  )
}