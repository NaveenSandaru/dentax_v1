"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useContext } from "react"
import { AuthContext } from "@/context/auth-context"
import { isDentistWorkingDay as checkIfDentistWorking } from "@/lib/mock-data"
import type { Dentist } from "@/types/dentist"

interface Appointment {
  appointment_id: number;
  patient_id: string;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
  fee: number;
  note: string;
  status: string;
  payment_status: string;
  patient: {
    patient_id: string,
    name: string,
    email: string,
    profile_picture: string
  } | null;
  temp_patient?: {
    temp_patient_id: string,
    name: string,
    email: string,
    phone_number: string,
    created_at: string
  } | null;
  invoice_services?: {
    service_id: number;
    service_name: string;
    amount: number;
  };
}

interface BlockedDate {
  blocked_date_id: number;
  dentist_id: string;
  date: string;
  time_from: string;
  time_to: string;
}

interface DentistWorkInfo {
  work_days_from: string,
  work_days_to: string,
  work_time_from: string,
  work_time_to: string,
  appointment_duration: string,
  appointment_fee: number
}

interface DentistDailyScheduleProps {
  selectedDate: string;
  appointments: Appointment[];
  blockedDates: BlockedDate[];
  dentistWorkInfo: DentistWorkInfo | undefined;
  timeSlots: string[];
  onSlotSelect?: (date: string, timeSlot: string) => void;
  onAppointmentCancel?: (appointmentId: number) => void;
  onDateChange?: (date: string) => void;
}

export function DentistDailySchedule({
  selectedDate,
  appointments,
  blockedDates,
  dentistWorkInfo,
  timeSlots,
  onSlotSelect,
  onAppointmentCancel,
  onDateChange
}: DentistDailyScheduleProps) {
  const { user } = useContext(AuthContext);

  // trimmer seconds from a time string (like "09:00:00" -> "09:00")
  const normalizeTime = (t: string) => {
    if (!t) return "";
    const trimmed = t.trim();
    const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const h = match[1].padStart(2, "0");
      const m = match[2].padStart(2, "0");
      return `${h}:${m}`;
    }
    // Fallback – if regex fails - attempt simple split
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

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };

  const getAppointmentForSlot = (date: string, time: string): Appointment | null => {
    const slotTime = normalizeTime(time);
    return (
      appointments.find((apt) => {
        const aptDate = normalizeDate(apt.date);
        const aptTime = normalizeTime(apt.time_from);
        return String(apt.dentist_id) === String(user?.id) && aptDate === date && aptTime === slotTime;
      }) || null
    );
  }

  const isSlotOccupiedByAppointment = (date: string, time: string): Appointment | null => {
    const slotMinutes = timeToMinutes(normalizeTime(time));
    
    return appointments.find((apt) => {
      const aptDate = normalizeDate(apt.date);
      if (String(apt.dentist_id) !== String(user?.id) || aptDate !== date) {
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
      blockedDates.find((blk) => {
        const blkDate = normalizeDate(blk.date);
        if (String(blk.dentist_id) !== String(user?.id) || blkDate !== date) {
          return false;
        }
        
        const blkStart = timeToMinutes(normalizeTime(blk.time_from));
        const blkEnd = timeToMinutes(normalizeTime(blk.time_to));
        
        return slotMinutes >= blkStart && slotMinutes < blkEnd;
      }) || null
    );
  }

  // Is the dentsit is working on the date?
  const isDentistWorkingDay = (): boolean => {
    if (!dentistWorkInfo || !user) return false;
    
    // Create a dentist object from the work info to use with the helper function
    const dentistObj: Dentist = {
      dentist_id: user.id,
      password: '',
      name: '',
      email: '',
      work_days_from: dentistWorkInfo.work_days_from,
      work_days_to: dentistWorkInfo.work_days_to,
      work_time_from: dentistWorkInfo.work_time_from,
      work_time_to: dentistWorkInfo.work_time_to,
      appointment_duration: dentistWorkInfo.appointment_duration,
      appointment_fee: dentistWorkInfo.appointment_fee
    };
    
    const selectedDateObj = new Date(selectedDate);
    const dayIndex = selectedDateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    return checkIfDentistWorking(dentistObj, dayIndex);
  };

  const getDuration = (from: string, to: string) => {
    const [fromHours, fromMinutes] = from.split(':').map(Number);
    const [toHours, toMinutes] = to.split(':').map(Number);
  
    const fromDate = new Date(0, 0, 0, fromHours, fromMinutes);
    const toDate = new Date(0, 0, 0, toHours, toMinutes);
  
    let diff = (toDate.getTime() - fromDate.getTime()) / 1000 / 60; // difference in minutes
  
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
  
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getAppointmentContent = (timeSlot: string) => {
    const isWorkingDay = isDentistWorkingDay();

    if (!isWorkingDay) {
      return (
        <div className="h-8 sm:h-10 bg-gray-50 border-1 border-gray-50 p-1 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">Off</span>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
        </div>
      );
    }

    const appointment = getAppointmentForSlot(selectedDate, timeSlot);
    const block = getBlockedForSlot(selectedDate, timeSlot);
    const occupiedByAppointment = isSlotOccupiedByAppointment(selectedDate, timeSlot);

    // Check if this slot is part of a multi-slot appointment but not the first slot
    const isContinuationSlot = occupiedByAppointment && !appointment;
    if (isContinuationSlot) {
      // Get the status colors for the appointment
      const statusColours: Record<string, { 
        bg: string; 
        border: string; 
        text: string; 
        rawColors: { bg: string; border: string; accent: string } 
      }> = {
        confirmed: { 
          bg: 'bg-green-100', 
          border: 'border-green-200', 
          text: 'text-green-800',
          rawColors: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' }
        },
        pending: { 
          bg: 'bg-yellow-100', 
          border: 'border-yellow-200', 
          text: 'text-yellow-800',
          rawColors: { bg: '#fefce8', border: '#fde047', accent: '#ca8a04' }
        },
        completed: { 
          bg: 'bg-gray-100', 
          border: 'border-gray-200', 
          text: 'text-gray-800',
          rawColors: { bg: '#f9fafb', border: '#e5e7eb', accent: '#6b7280' }
        },
        noshow: { 
          bg: 'bg-red-100', 
          border: 'border-2 border-red-500', 
          text: 'text-red-900 font-extrabold',
          rawColors: { bg: '#fef2f2', border: '#ef4444', accent: '#dc2626' }
        },
        cancelled: { 
          bg: 'bg-gray-100', 
          border: 'border border-gray-300 border-dashed', 
          text: 'text-gray-500',
          rawColors: { bg: '#f9fafb', border: '#d1d5db', accent: '#9ca3af' }
        },
      };
      
      const status = occupiedByAppointment.status?.toLowerCase() || 'confirmed';
      const colours = statusColours[status] || statusColours.confirmed;
      
      // Calculate position within the appointment to determine borders
      const appointmentEndTime = normalizeTime(occupiedByAppointment.time_to);
      const currentSlotTime = normalizeTime(timeSlot);
      
      const appointmentEndMinutes = timeToMinutes(appointmentEndTime);
      const currentSlotMinutes = timeToMinutes(currentSlotTime);
      
      // Check if this is the last slot of the appointment
      const isLastSlot = (currentSlotMinutes + 15) >= appointmentEndMinutes;
      
      // Determine border styles for seamless continuation
      let borderStyles: React.CSSProperties = {
        borderLeft: `2px solid ${colours.rawColors.border}`,
        borderRight: `2px solid ${colours.rawColors.border}`,
        borderTop: 'none',
        borderBottom: isLastSlot ? `2px solid ${colours.rawColors.border}` : 'none',
        marginTop: '-1px',
        backgroundColor: colours.rawColors.bg,
      };

      // Special handling for noshow status
      if (occupiedByAppointment.status?.toLowerCase() === 'noshow') {
        borderStyles = {
          ...borderStyles,
          borderLeft: `2px solid ${colours.rawColors.accent}`,
          borderRight: `2px solid ${colours.rawColors.accent}`,
          borderBottom: isLastSlot ? `2px solid ${colours.rawColors.accent}` : 'none',
          background: `repeating-linear-gradient(-45deg, ${colours.rawColors.bg}, ${colours.rawColors.bg} 10px, #fecaca 10px, #fecaca 20px)`,
        };
      }

      // Special handling for cancelled status (dashed borders)
      if (occupiedByAppointment.status?.toLowerCase() === 'cancelled') {
        borderStyles = {
          ...borderStyles,
          borderLeft: `1px dashed ${colours.rawColors.border}`,
          borderRight: `1px dashed ${colours.rawColors.border}`,
          borderBottom: isLastSlot ? `1px dashed ${colours.rawColors.border}` : 'none',
        };
      }
      
      return (
        <div 
          className={`h-8 sm:h-10 relative ${colours.bg} transition-all duration-150`}
          style={{
            ...borderStyles,
            ...(isLastSlot ? {
              borderBottomLeftRadius: '6px',
              borderBottomRightRadius: '6px',
            } : {})
          }}
          title={`${occupiedByAppointment.temp_patient?.name || occupiedByAppointment.patient?.name || "Appointment"} - ${status.toUpperCase()}`}
        >
          {/* Main content area using full horizontal space */}
          <div className="absolute inset-0 flex items-center justify-between px-2">
            {/* Left side - Visual indicator and patient name */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div 
                className="w-1 h-4 rounded-full opacity-60 flex-shrink-0"
                style={{ backgroundColor: colours.rawColors.accent }}
              />
              <div className="text-[8px] font-medium truncate" style={{ color: colours.rawColors.accent }}>
                {occupiedByAppointment.temp_patient?.name || occupiedByAppointment.patient?.name || ""}
              </div>
            </div>
            
            {/* Right side - Status and position indicator */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="text-[6px] font-semibold opacity-60" style={{ color: colours.rawColors.accent }}>
                {status.toUpperCase()}
              </div>
              {/*{isLastSlot && (
                <div className="w-1 h-1 rounded-full opacity-80" style={{ backgroundColor: colours.rawColors.accent }} />
              )}*/}
            </div>
          </div>
          
          {/* Subtle overlay pattern for better visual continuity */}
          <div 
            className="absolute inset-0 opacity-5"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${colours.rawColors.accent} 50%, transparent 100%)`
            }}
          />

          {/* End slot indicator */}
          {isLastSlot && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-40" style={{ backgroundColor: colours.rawColors.accent }} />
          )}
        </div>
      );
    }

    if (!appointment && !block) {
      return (
        <div 
          className="h-8 sm:h-10 bg-white border-1 border-gray-100 p-1 flex items-center justify-between text-xs text-gray-500 hover:bg-emerald-50 cursor-pointer transition-all duration-200 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md group"
          onClick={() => onSlotSelect?.(selectedDate, timeSlot)}
          title="Click to book appointment"
        >
          <span className="font-medium group-hover:text-emerald-600 text-[10px]">Available</span>
          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full group-hover:bg-emerald-400 transition-colors" />
        </div>
      );
    }

    if (block) {
      return (
        <div className="h-8 sm:h-10 bg-red-100 border-2 border-red-200 p-1 flex items-center justify-between text-xs text-red-600 font-medium">
          <span className="text-[10px]">Blocked</span>
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
        </div>
      );
    }

    if (appointment) {
      const appointmentHeight = 40; // Smaller height for 15-min slots
      
      // Choose styling by status
      const statusColours: Record<string, { 
        bg: string; 
        border: string; 
        text: string; 
        pattern?: string;
        rawColors: { bg: string; border: string; accent: string } 
      }> = {
        confirmed: { 
          bg: "bg-green-100", 
          border: "border-green-200", 
          text: "text-green-800",
          rawColors: { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' }
        },
        pending: { 
          bg: "bg-yellow-100", 
          border: "border-yellow-200", 
          text: "text-yellow-800",
          rawColors: { bg: '#fefce8', border: '#fde047', accent: '#ca8a04' }
        },
        completed: { 
          bg: "bg-gray-100", 
          border: "border-gray-200", 
          text: "text-gray-800",
          rawColors: { bg: '#f9fafb', border: '#e5e7eb', accent: '#6b7280' }
        },
        'noshow': { 
          bg: "bg-red-100", 
          border: "border-2 border-red-500", 
          text: "text-red-900 font-extrabold",
          pattern: "bg-[repeating-linear-gradient(-45deg,#fecaca,#fecaca_10px,#fef2f2_10px,#fef2f2_20px)]",
          rawColors: { bg: '#fef2f2', border: '#ef4444', accent: '#dc2626' }
        },
        cancelled: { 
          bg: "bg-gray-100", 
          border: "border border-gray-300 border-dashed", 
          text: "text-gray-500",
          rawColors: { bg: '#f9fafb', border: '#d1d5db', accent: '#9ca3af' }
        },
      };
      const colours = statusColours[appointment.status?.toLowerCase()] || statusColours.confirmed;

      // Calculate if this appointment spans multiple slots
      const appointmentStartMinutes = timeToMinutes(normalizeTime(appointment.time_from));
      const appointmentEndMinutes = timeToMinutes(normalizeTime(appointment.time_to));
      const appointmentDuration = appointmentEndMinutes - appointmentStartMinutes;
      const isMultiSlot = appointmentDuration > 15;

      // Additional styling for multi-slot appointments
      const multiSlotStyles: React.CSSProperties = isMultiSlot ? {
        borderBottom: 'none', // Remove bottom border for continuation
        borderTopLeftRadius: '6px',
        borderTopRightRadius: '6px',
        borderBottomLeftRadius: '0px',
        borderBottomRightRadius: '0px',
      } : {};

      return (
        <div
          className={`${colours.bg} border-2 ${colours.border} p-1 text-xs cursor-pointer hover:opacity-90 transition-colors relative group`}
          style={{ 
            height: `${appointmentHeight}px`, 
            minHeight: `${appointmentHeight}px`,
            ...multiSlotStyles
          }}
          title="Appointment details"
        >
          {/* Cancel button - top right corner */}
          <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-30">
            <button
              className="w-3 h-3 bg-red-500 text-white text-[8px] flex items-center justify-center hover:bg-red-600 rounded-sm shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onAppointmentCancel?.(appointment.appointment_id);
              }}
              title="Cancel appointment"
            >
              ×
            </button>
          </div>
          <div className="relative w-full h-full p-0.5">
            {appointment.status?.toLowerCase() === 'noshow' && (
              <div className="absolute inset-0 -m-1 bg-red-100 opacity-30"></div>
            )}
            <div className="relative z-10 flex h-full items-center justify-between px-1">
              {/* Left side - Main content */}
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-1">
                  <div className={`truncate text-[9px] leading-tight font-medium ${colours.text} ${appointment.status?.toLowerCase() === 'noshow' ? 'font-extrabold line-through decoration-2 decoration-red-600' : ''}`}>
                    {appointment.temp_patient?.name || appointment.patient?.name || "Appointment"}
                  </div>
                  <div className={`${appointment.status?.toLowerCase() === 'noshow' ? 'text-red-700 font-bold' : colours.text.replace("800", "600")} text-[7px] font-semibold whitespace-nowrap`}>
                    {getDuration(appointment.time_from, appointment.time_to)}
                  </div>
                </div>
                {appointment.invoice_services?.service_name && (
                  <div className="text-[8px] text-gray-600 font-medium truncate mt-0.5">
                    {appointment.invoice_services.service_name}
                  </div>
                )}
              </div>

              {/* Right side - Status indicators */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {appointment.status?.toLowerCase() === 'noshow' && (
                  <span className="bg-red-600 text-white text-[6px] font-extrabold px-1 py-0.5 rounded-sm border border-red-700 shadow-sm whitespace-nowrap">
                    NO SHOW
                  </span>
                )}
                {appointment.status?.toLowerCase() === 'pending' && (
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" title="Pending" />
                )}
                {appointment.status?.toLowerCase() === 'confirmed' && (
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="Confirmed" />
                )}
                {appointment.status?.toLowerCase() === 'completed' && (
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full" title="Completed" />
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-8 sm:h-10 bg-white border-2 border-gray-200 p-1 flex items-center justify-center text-xs text-gray-500">
        Available
      </div>
    );
  }

  // Get appointments for the selected date (for day view statistics)
  const dayAppointments = appointments.filter((apt) => 
    apt.dentist_id === user?.id && normalizeDate(apt.date) === selectedDate
  );

  const isWorkingSelectedDay = isDentistWorkingDay();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-3">
        {/* Header with Date Picker */}
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-lg font-medium">Daily Schedule</h3>
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange?.(e.target.value)}
              className="w-auto"
            />
          </div>
        </div>

        {/* Day View Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Daily appointments view</p>
        </div>

        {/* Working Hours and Days Info */}
        {dentistWorkInfo && (
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
              {dentistWorkInfo.work_time_from} - {dentistWorkInfo.work_time_to}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1">
              {dentistWorkInfo.work_days_from} - {dentistWorkInfo.work_days_to}
            </Badge>
            <Badge variant={isWorkingSelectedDay ? "default" : "secondary"} className="text-xs px-2 sm:px-3 py-1">
              {isWorkingSelectedDay ? "Working Today" : "Off Today"}
            </Badge>
          </div>
        )}

        {/* Day View Statistics */}
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-purple-50 rounded-lg">
          <div className="text-xs sm:text-sm text-purple-800 text-center">
            <span className="font-semibold">{dayAppointments.length}</span> appointments scheduled
            {isWorkingSelectedDay && timeSlots.length > 0 && (
              <span className="ml-2">• {timeSlots.length} total slots available</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Time Slots Grid */}
        <div className="space-y-0.5 max-h-[calc(100vh-24rem)] overflow-y-auto">
          {timeSlots.map((timeSlot, index) => {
            // Show time label at 30-minute intervals starting from the first slot for better readability with smaller slots
            const [hours, minutes] = timeSlot.split(':').map(Number);
            const [firstHours, firstMinutes] = timeSlots[0]?.split(':').map(Number) || [0, 0];
            
            // Calculate minutes from the start time
            const currentMinutes = hours * 60 + minutes;
            const startMinutes = firstHours * 60 + firstMinutes;
            const minutesFromStart = currentMinutes - startMinutes;
            
            // Show label if it's the first slot or every 30 minutes from the start (more frequent for smaller slots)
            const shouldShowLabel = index === 0 || minutesFromStart % 30 === 0;

            return (
              <div key={timeSlot} className="flex items-center gap-3">
                {/* Time Label (at 30-minute intervals from start time) */}
                <div className="w-12 sm:w-16 text-xs sm:text-sm font-semibold text-gray-700 flex-shrink-0">
                  {shouldShowLabel ? timeSlot : ""}
                </div>

                {/* Appointment Slot */}
                <div className="flex-1 min-w-0">
                  {getAppointmentContent(timeSlot)}
                </div>
              </div>
            );
          })}
        </div>

        {/* No appointments message for day view */}
        {dayAppointments.length === 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 text-center rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">
              {isWorkingSelectedDay ? "No appointments scheduled for this date" : "You are not working on this date"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
