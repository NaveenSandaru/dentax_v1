"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Appointment {
  appointment_id: number
  patient_id?: string
  temp_patient_id?: string
  dentist_id: string
  date: string
  time_from: string
  time_to: string
  status: string
  fee?: number
  note?: string
  payment_status?: string
  patient?: {
    patient_id: string
    name: string
    email: string
    profile_picture?: string
    phone_number?: string
  }
  temp_patient?: {
    temp_patient_id: string
    name: string
    email: string
    phone_number: string
  }
  dentist?: {
    dentist_id: string
    name: string
    email: string
    profile_picture?: string
    phone_number?: string
  }
  invoice_services?: Array<{
    service_id: string
    service_name: string
    amount: number
  }>
}

interface Dentist {
  dentist_id: string
  name: string
}

interface CalendarGridViewProps {
  appointments: Appointment[]
  dentists: Dentist[]
  selectedDate: string
  onDateChange: (date: string) => void
  onAppointmentClick?: (appointment: Appointment) => void
  onAppointmentCancel?: (appointmentId: number) => void
  viewMode?: "day" | "week"
}

interface TimeSlot {
  time: string
  hour: number
}

interface DayColumn {
  date: string
  dayName: string
  dayNumber: number
  isToday: boolean
}

export default function CalendarGridView({ 
  appointments, 
  dentists,
  selectedDate, 
  onDateChange,
  onAppointmentClick,
  onAppointmentCancel,
  viewMode = "week"
}: CalendarGridViewProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [weekDays, setWeekDays] = useState<DayColumn[]>([])
  const [viewModeState, setViewModeState] = useState<"day" | "week">(viewMode)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Debug logging
  console.log('CalendarGridView received:', { 
    appointmentsCount: appointments?.length || 0, 
    dentistsCount: dentists?.length || 0,
    appointments: appointments,
    dentists: dentists
  })
  
  // Show all dentists with horizontal scrolling
  const visibleDentists = dentists
  const hasMoreDentists = dentists.length > 4

  // Generate time slots from 8:00 AM to 6:00 PM with 15-minute intervals
  const timeSlots = [
    { time: "08:00", subSlots: ["08:00", "08:15", "08:30", "08:45"] },
    { time: "09:00", subSlots: ["09:00", "09:15", "09:30", "09:45"] },
    { time: "10:00", subSlots: ["10:00", "10:15", "10:30", "10:45"] },
    { time: "11:00", subSlots: ["11:00", "11:15", "11:30", "11:45"] },
    { time: "12:00", subSlots: ["12:00", "12:15", "12:30", "12:45"] },
    { time: "13:00", subSlots: ["13:00", "13:15", "13:30", "13:45"] },
    { time: "14:00", subSlots: ["14:00", "14:15", "14:30", "14:45"] },
    { time: "15:00", subSlots: ["15:00", "15:15", "15:30", "15:45"] },
    { time: "16:00", subSlots: ["16:00", "16:15", "16:30", "16:45"] },
    { time: "17:00", subSlots: ["17:00", "17:15", "17:30", "17:45"] },
    { time: "18:00", subSlots: ["18:00", "18:15", "18:30", "18:45"] }
  ]

  // Generate week days based on selected date
  const generateWeekDays = (baseDate: string): DayColumn[] => {
    const date = new Date(baseDate)
    
    if (viewModeState === "day") {
      // For day view, return only the selected day
      const dateStr = date.toISOString().split("T")[0]
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      
      return [{
        date: dateStr,
        dayName: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        isToday: dateStr === new Date().toISOString().split("T")[0]
      }]
    } else {
      // For week view, return 7 days
      const dayOfWeek = date.getDay()
      const startDate = new Date(date)
      // Start from Monday (1) or Sunday (0)
      startDate.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1))

      return Array.from({ length: 7 }, (_, i) => {
        const currentDate = new Date(startDate)
        currentDate.setDate(startDate.getDate() + i)
        const dateStr = currentDate.toISOString().split("T")[0]
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        
        return {
          date: dateStr,
          dayName: dayNames[currentDate.getDay()],
          dayNumber: currentDate.getDate(),
          isToday: dateStr === new Date().toISOString().split("T")[0]
        }
      })
    }
  }

  useEffect(() => {
    setWeekDays(generateWeekDays(selectedDate))
  }, [selectedDate, viewModeState])

  const handleNavigation = (direction: "prev" | "next") => {
    const currentDate = new Date(selectedDate)
    const newDate = new Date(currentDate)
    
    if (viewModeState === "day") {
      // Navigate by day
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 1 : -1))
    } else {
      // Navigate by week
      newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7))
    }
    
    onDateChange(newDate.toISOString().split("T")[0])
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      const formattedDate = `${year}-${month}-${day}`
      onDateChange(formattedDate)
      setCalendarOpen(false)
    }
  }

  const formatDateRange = (weekDays: DayColumn[]) => {
    if (weekDays.length === 0) return ""
    
    if (viewModeState === "day") {
      // For day view, show just the selected date
      const date = new Date(weekDays[0].date)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    } else {
      // For week view, show date range
      const startDate = new Date(weekDays[0].date)
      const endDate = new Date(weekDays[weekDays.length - 1].date)

      return `${startDate.getDate()} - ${endDate.getDate()} ${endDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}`
    }
  }

  const getAppointmentsForSlot = (date: string, timeSlot: string, dentistId?: string) => {
    if (!appointments || appointments.length === 0) {
      return []
    }
    
    console.log('Filtering appointments for:', { date, timeSlot, dentistId, totalAppointments: appointments.length })
    
    return appointments.filter(apt => {
      // Check if appointment has required date and time properties
      if (!apt.date || !apt.time_from) {
        console.log('Appointment missing date/time:', apt)
        return false
      }
      
      // Handle different date formats
      let aptDate: string
      try {
        if (apt.date.includes('T')) {
          aptDate = apt.date.split('T')[0]
        } else {
          aptDate = apt.date
        }
      } catch (e) {
        console.warn('Invalid appointment date format:', apt.date)
        return false
      }
      
      // Handle different time formats
      let aptTime: string
      try {
        if (apt.time_from.includes(':')) {
          aptTime = apt.time_from.substring(0, 5) // Get HH:MM format
        } else {
          aptTime = apt.time_from
        }
      } catch (e) {
        console.warn('Invalid appointment time format:', apt.time_from)
        return false
      }
      
      // Check if appointment falls within the hour slot (for 15-minute segments)
      const hourSlot = timeSlot.substring(0, 2) + ":00"
      const aptHour = aptTime.substring(0, 2) + ":00"
      const dateTimeMatch = aptDate === date && aptHour === hourSlot
      
      // If dentistId is provided, also filter by dentist
      let dentistMatch = true
      if (dentistId) {
        dentistMatch = 
          apt.dentist_id === dentistId || 
          apt.dentist_id?.toString() === dentistId ||
          apt.dentist?.name === dentists.find(d => d.dentist_id === dentistId)?.name ||
          apt.dentist?.name === dentists.find(d => d.dentist_id?.toString() === dentistId)?.name
      }
      
      const result = dateTimeMatch && dentistMatch
      
      console.log('Appointment check:', {
        appointment: apt,
        aptDate,
        aptTime,
        targetDate: date,
        targetTimeSlot: timeSlot,
        hourSlot,
        aptHour,
        dateTimeMatch,
        dentistMatch,
        result
      })
      
      return result
    })
  }

  const getAppointmentTimeSlots = (appointment: Appointment) => {
    if (!appointment.time_from || !appointment.time_to) return []
    
    const startTime = appointment.time_from.substring(0, 5)
    const endTime = appointment.time_to.substring(0, 5)
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)
    
    const slots = []
    let currentHour = startHour
    let currentMinute = startMinute
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      slots.push(timeSlot)
      
      currentMinute += 15
      if (currentMinute >= 60) {
        currentMinute = 0
        currentHour++
      }
    }
    
    return slots
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "noshow":
        return "bg-orange-100 text-orange-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "pending":
        return "bg-gray-100 text-gray-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "checkedin":
        return "bg-purple-100 text-purple-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "overdue":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCancelConfirm = () => {
    if (appointmentToCancel && onAppointmentCancel) {
      onAppointmentCancel(appointmentToCancel.appointment_id)
      setCancelDialogOpen(false)
      setAppointmentToCancel(null)
    }
  }

  const handleCancelClose = () => {
    setCancelDialogOpen(false)
    setAppointmentToCancel(null)
  }

  return (
    <>
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header with navigation and view toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="flex items-center p-2 m-2 gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {formatDateRange(weekDays)}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Picker */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 text-sm mr-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="font-medium">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={new Date(selectedDate)}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
            <Button
              variant={viewModeState === "day" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeState("day")}
              className={`px-3 py-1 text-xs ${viewModeState === "day" ? 'bg-white text-black hover:text-white shadow-sm' : ''}`}
            >
              Day
            </Button>
            <Button
              variant={viewModeState === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewModeState("week")}
              className={`px-3 py-1 text-xs ${viewModeState === "week" ? 'bg-white text-black hover:text-white shadow-sm' : ''}`}
            >
              Week
            </Button>
          </div>
          
          {/* Navigation */}
          <Button variant="ghost" size="sm" onClick={() => handleNavigation("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleNavigation("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="relative shadow-lg" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
        {/* Fixed Time Column */}
        <div className="absolute left-0 top-0 z-10 bg-white border-r shadow-sm">
          {/* Time Header */}
          <div className="w-20 p-3 mt-[0.1rem] text-center font-medium text-gray-600 bg-gray-50 flex-shrink-0">
            <div className="text-sm">Time</div>
          </div>
          {/* Empty space for day sub-headers */}
          <div className="w-20 text-center text-xs font-medium text-gray-500 bg-gray-50 border-b flex-shrink-0 h-17"></div>
          {/* Time Slots */}
          {timeSlots.map((timeSlot, timeIndex) => (
            <div key={timeIndex} className="w-20 text-center font-medium text-gray-600 bg-gray-50 border-b flex-shrink-0">
              <div className="grid grid-rows-4">
                {timeSlot.subSlots.map((subSlot, subIndex) => (
                  <div key={subIndex} className="flex items-center justify-center" style={{ height: '48px' }}>
                    <div className="text-xs font-medium">
                      {subIndex === 0 ? timeSlot.time : subSlot.substring(3)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className={viewModeState === "day" ? "overflow-x-auto" : "overflow-x-auto"} style={{ 
          marginLeft: '80px',
          maxWidth: viewModeState === "day" ? 'calc(100vw - 120px)' : 'calc(100vw - 120px)'
        }}>
          <div style={{ 
            width: viewModeState === "day" 
              ? `${Math.max(visibleDentists.length * 250, 4 * 250)}px` 
              : `${visibleDentists.length * 800}px`,
            minWidth: viewModeState === "day" ? '1000px' : 'auto'
          }}>
            {/* Dentist Headers */}
            <div className="flex border-b">
              {visibleDentists.map((dentist, index) => (
                <div 
                  key={index} 
                  className={`${viewModeState === "day" ? "w-[250px]" : "w-[800px]"} p-3 text-center border-l bg-blue-50 flex-shrink-0`}
                >
                  <div className="font-semibold text-blue-900 text-sm">{dentist.name}</div>
                  <div className="text-xs text-blue-600 mt-1">Dr. {dentist.name}</div>
                </div>
              ))}
            </div>
            
            {/* Day Sub-headers */}
            <div className="flex border-b bg-gray-50">
              {visibleDentists.map((dentist, dentistIndex) => (
                <div key={dentistIndex} className={`${viewModeState === "day" ? "w-[250px]" : "w-[800px]"} border-l flex-shrink-0`}>
                  <div className={`grid ${viewModeState === "day" ? "grid-cols-1" : "grid-cols-7"} text-xs h-12`}>
                    {weekDays.map((day, dayIndex) => (
                      <div 
                        key={dayIndex} 
                        className={`p-1 text-center border-r last:border-r-0 ${
                          day.isToday ? 'bg-green-100 text-green' : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{day.dayName}</div>
                        <div className="text-xs mt-1">{day.dayNumber}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Slots and Appointments */}
            {timeSlots.map((timeSlot, timeIndex) => (
              <div key={timeIndex} className="flex border-b">
                {/* Dentist Columns */}
                {visibleDentists.map((dentist, dentistIndex) => (
                  <div key={dentistIndex} className={`${viewModeState === "day" ? "w-[250px]" : "w-[800px]"} border-l flex-shrink-0`}>
                    <div className={`grid ${viewModeState === "day" ? "grid-cols-1" : "grid-cols-7"}`}>
                      {weekDays.map((day, dayIndex) => {
                        const dayAppointments = getAppointmentsForSlot(day.date, timeSlot.time, dentist.dentist_id)
                        
                        return (
                          <div 
                            key={dayIndex} 
                            className="border-r last:border-r-0 relative"
                          >
                            {/* 15-minute sub-slots */}
                            <div className="grid grid-rows-4">
                              {timeSlot.subSlots.map((subSlot, subIndex) => {
                                // Find appointments that occupy this specific 15-minute slot
                                const subSlotAppointments = dayAppointments.filter(appointment => {
                                  const appointmentSlots = getAppointmentTimeSlots(appointment)
                                  return appointmentSlots.includes(subSlot)
                                })
                                
                                return (
                                  <div 
                                    key={subIndex} 
                                    className="relative hover:bg-gray-50 transition-colors"
                                    style={{ height: '48px' }}
                                  >
                                    {subSlotAppointments.map((appointment, aptIndex) => {
                                      // Calculate how many 15-minute slots this appointment spans
                                      const appointmentSlots = getAppointmentTimeSlots(appointment)
                                      const startSlotIndex = timeSlot.subSlots.findIndex(slot => appointmentSlots.includes(slot))
                                      const appointmentDuration = appointmentSlots.filter(slot => 
                                        timeSlot.subSlots.includes(slot)
                                      ).length
                                      
                                      // Only render the appointment in its first sub-slot to avoid duplicates
                                      if (subIndex !== startSlotIndex) return null
                                      
                                      return (
                                        <div
                                          key={aptIndex}
                                          className={`
                                            absolute inset-x-1 rounded-md text-xs shadow-sm group
                                            ${getStatusColor(appointment.status || 'pending')}
                                          `}
                                          style={{ 
                                            height: `${appointmentDuration * 48}px`,
                                            zIndex: 1
                                          }}
                                        >
                                          {/* Cancel Button */}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setAppointmentToCancel(appointment)
                                              setCancelDialogOpen(true)
                                            }}
                                            className={`absolute top-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-opacity z-10 ${
                                              viewModeState === "day" ? "-right-2" : "-left-2"
                                            } ${
                                              isMobile 
                                                ? (selectedAppointmentId === appointment.appointment_id ? "opacity-100" : "opacity-0")
                                                : "opacity-0 group-hover:opacity-100"
                                            }`}
                                            title="Cancel Appointment"
                                          >
                                            <X className="w-2 h-2" />
                                          </button>
                                          
                                          {/* Appointment Content */}
                                          <div 
                                            className="cursor-pointer p-2 h-full"
                                            onClick={() => {
                                              if (isMobile) {
                                                // On mobile, toggle selection to show/hide cancel button
                                                setSelectedAppointmentId(
                                                  selectedAppointmentId === appointment.appointment_id 
                                                    ? null 
                                                    : appointment.appointment_id
                                                )
                                              } else {
                                                // On desktop, trigger appointment click
                                                onAppointmentClick?.(appointment)
                                              }
                                            }}
                                          >
                                            <div className="font-semibold truncate leading-tight text-xs">
                                              {appointment.patient?.name || appointment.temp_patient?.name || "Patient"}
                                            </div>
                                            <div className="text-xs opacity-90 truncate">
                                              {appointment.time_from} - {appointment.time_to}
                                            </div>
                                            {appointment.invoice_services?.[0]?.service_name && appointmentDuration > 1 && (
                                              <div className="text-xs opacity-80 truncate mt-1">
                                                {appointment.invoice_services[0].service_name.length > 20 
                                                  ? `${appointment.invoice_services[0].service_name.substring(0, 20)}...` 
                                                  : appointment.invoice_services[0].service_name}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    
    {/* Cancellation Dialog */}
    <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this appointment?
          </DialogDescription>
        </DialogHeader>
        
        {appointmentToCancel && (
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Patient:</span>
                <span>{appointmentToCancel.patient?.name || appointmentToCancel.temp_patient?.name || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date:</span>
                <span>{new Date(appointmentToCancel.date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Time:</span>
                <span>{appointmentToCancel.time_from} - {appointmentToCancel.time_to}</span>
              </div>
              {appointmentToCancel.invoice_services?.[0]?.service_name && (
                <div className="flex justify-between">
                  <span className="font-medium">Service:</span>
                  <span>{appointmentToCancel.invoice_services[0].service_name}</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancelClose}>
            Keep Appointment
          </Button>
          <Button variant="destructive" onClick={handleCancelConfirm}>
            Cancel Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
