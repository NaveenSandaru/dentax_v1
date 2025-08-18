'use client'

import { useState, useEffect, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { toast } from "sonner"
import { AuthContext } from '@/context/auth-context'

interface Patient {
  patient_id: string
  name: string
  email: string
  phone_number: string
}

interface TempPatient {
  temp_patient_id: string
  name: string
  phone_number: string
  email?: string
}

interface Dentist {
  dentist_id: string
  name: string
  email: string
  phone_number: string
  service_types?: string
  work_days_from?: string
  work_days_to?: string
  work_time_from?: string
  work_time_to?: string
  appointment_duration?: string
  appointment_fee: number
}

interface TimeSlot {
  start: string
  end: string
}

interface Appointment {
  appointment_id: number
  patient_id?: string
  temp_patient_id?: string
  dentist_id: string
  date: string
  time_from: string
  time_to: string
  fee?: number
  note?: string
  status?: string
  payment_status?: string
  patient?: Patient
  temp_patient?: TempPatient
  dentist?: Dentist | any
}

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAppointmentRescheduled: () => void
  appointment: Appointment | null
}

export function RescheduleDialog({ open, onOpenChange, onAppointmentRescheduled, appointment }: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')
  const [unavailableIntervals, setUnavailableIntervals] = useState<{start:string,end:string}[]>([])
  const [loading, setLoading] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [dentist, setDentist] = useState<Dentist | null>(null)
  const [dateWarning, setDateWarning] = useState<string>('')
  
  const { apiClient } = useContext(AuthContext)

  // Helper function to generate time slots based on work hours and duration
  const generateTimeSlots = (workTimeFrom: string, workTimeTo: string, duration: string): TimeSlot[] => {
    const slots: TimeSlot[] = []
    
    const durationMatch = duration.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 30
    
    const [startHour, startMinute] = workTimeFrom.split(':').map(Number)
    const [endHour, endMinute] = workTimeTo.split(':').map(Number)
    
    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute
    
    for (let time = startTime; time < endTime; time += durationMinutes) {
      const startHours = Math.floor(time / 60)
      const startMins = time % 60
      const endTime = time + durationMinutes
      const endHours = Math.floor(endTime / 60)
      const endMins = endTime % 60
      
      const startTimeStr = `${startHours.toString().padStart(2, '0')}:${startMins.toString().padStart(2, '0')}`
      const endTimeStr = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
      
      slots.push({
        start: startTimeStr,
        end: endTimeStr
      })
    }
    
    return slots
  }

  // Fetch dentist details when appointment changes
  useEffect(() => {
    if (appointment && open) {
      const fetchDentist = async () => {
        try {
          const response = await apiClient.get(`/dentists/${appointment.dentist_id}`)
          const dentistData = response.data
          setDentist(dentistData)

          // Generate slots using dentist data
          if (dentistData.work_time_from && dentistData.work_time_to && dentistData.appointment_duration) {
            const slots = generateTimeSlots(
              dentistData.work_time_from,
              dentistData.work_time_to,
              dentistData.appointment_duration
            )
            setTimeSlots(slots)
          }

          // Set default date
          setSelectedDate(new Date(appointment.date))
        } catch (error) {
          console.error('Error fetching dentist:', error)
          toast.error('Failed to load dentist information')
        }
      }

      fetchDentist()
    }
  }, [appointment, open, apiClient])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedDate(undefined)
      setSelectedTimeSlot('')
      setDentist(null)
      setTimeSlots([])
      setUnavailableIntervals([])
    }
  }, [open])

  // Helper to format a Date object to YYYY-MM-DD in local timezone
  const formatDateISO = (date: Date) => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const fetchUnavailableSlots = async (dateISO: string) => {
    try {
      const [appointmentsRes, blockedRes] = await Promise.all([
        apiClient.get(`/appointments/fordentist/${appointment?.dentist_id}`),
        apiClient.get(`/blocked-dates/fordentist/${appointment?.dentist_id}`)
      ])

      const bookedIntervals = appointmentsRes.data
        .filter((appt: any) => appt.date.split('T')[0] === dateISO && appt.appointment_id !== appointment?.appointment_id)
        .map((a: any) => ({start:a.time_from,end:a.time_to}))

      const blockedIntervals = blockedRes.data
        .filter((blk: any) => new Date(blk.date).toISOString().split('T')[0] === dateISO)
        .map((blk: any) => ({start:blk.time_from,end:blk.time_to}))

      setUnavailableIntervals([...bookedIntervals, ...blockedIntervals])
    } catch (e) {
      console.error('fetch unavailable error', e)
    }
  }

  const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]

  const isWorkingDay = (date: Date, dentist: Dentist) => {
    const fromIdx = dayNames.indexOf(dentist.work_days_from || "Monday")
    const toIdx = dayNames.indexOf(dentist.work_days_to || "Friday")
    const day = date.getDay()
    return fromIdx <= toIdx ? day >= fromIdx && day <= toIdx : day >= fromIdx || day <= toIdx
  }

  // Fetch unavailable intervals whenever selectedDate changes (including initial load)
  useEffect(() => {
    if (selectedDate && appointment) {
      if (dentist && !isWorkingDay(selectedDate, dentist)) {
        setDateWarning("⚠️ Selected date is not a working day for this dentist")
        setUnavailableIntervals([])
        return
      }
      setDateWarning('')
      fetchUnavailableSlots(formatDateISO(selectedDate))
    }
  }, [selectedDate, appointment])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setCalendarOpen(false)
    setSelectedTimeSlot('')

    if (date) {
      if (dentist && !isWorkingDay(date, dentist)) {
        setDateWarning("Selected date is not a working day for this dentist")
        return
      }
      setDateWarning('')
      fetchUnavailableSlots(date.toISOString().split('T')[0])
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleReschedule = async () => {
    if (!appointment || !selectedDate || !selectedTimeSlot) {
      toast.error('Please select both date and time slot')
      return
    }

    setLoading(true)
    try {
      const selectedSlot = timeSlots.find(slot => slot.start === selectedTimeSlot)
      if (!selectedSlot) {
        toast.error('Invalid time slot selected')
        return
      }

      const updateData = {
        date: formatDateISO(selectedDate),
        time_from: selectedSlot.start,
        time_to: selectedSlot.end,
        status: 'rescheduled'
      }

      await apiClient.put(`/appointments/${appointment.appointment_id}`, updateData)
      
      toast.success('Appointment rescheduled successfully')
      onAppointmentRescheduled()
      onOpenChange(false)
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      toast.error('Failed to reschedule appointment')
    } finally {
      setLoading(false)
    }
  }

  if (!appointment) return null

  const patientName = appointment.patient?.name || appointment.temp_patient?.name || 'Unknown Patient'
  const dentistName = appointment.dentist?.name || 'Unknown Dentist'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Patient Information (Read-only) */}
          <div className="space-y-2">
            <Label>Patient</Label>
            <Input value={patientName} disabled className="bg-gray-50" />
          </div>

          {/* Dentist Information (Read-only) */}
          <div className="space-y-2">
            <Label>Dentist</Label>
            <Input value={dentistName} disabled className="bg-gray-50" />
          </div>

          {/* Fee Information (Read-only) */}
          <div className="space-y-2">
            <Label>Fee</Label>
            <Input value={`$${appointment.fee}`} disabled className="bg-gray-50" />
          </div>

          {/* Note Information (Read-only) */}
          <div className="space-y-2">
            <Label>Note</Label>
            <Textarea value={appointment.note || 'No notes'} disabled className="bg-gray-50" />
          </div>

          {/* Current Appointment Details (Read-only) */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <Label className="text-sm font-medium text-blue-800">Current Appointment</Label>
            <div className="text-sm text-blue-700 mt-1">
              {new Date(appointment.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} at {new Date(`2000-01-01T${appointment.time_from}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })} - {new Date(`2000-01-01T${appointment.time_to}`).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </div>
          </div>

          {/* New Date Selection */}
          <div className="space-y-2">
            <Label>New Date *</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? formatDate(selectedDate) : 'Select new date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date() }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {/* Inline warning for invalid working day */}
            {dateWarning && (
              <div className="mt-2 rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-200">
                {dateWarning}
              </div>
            )}
          </div>

          {/* New Time Slot Selection */}
          <div className="space-y-2">
            <Label>New Time Slot *</Label>
            <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
              <SelectTrigger>
                <SelectValue placeholder="Select new time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.filter(slot => {
                  // check overlap between slot interval and any unavailable interval
                  return !unavailableIntervals.some(itv=> {
                    return (slot.start < itv.end) && (slot.end > itv.start)
                  })
                }).map((slot) => (
                  <SelectItem key={slot.start} value={slot.start}>
                    {new Date(`2000-01-01T${slot.start}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })} - {new Date(`2000-01-01T${slot.end}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleReschedule} 
            disabled={loading || !selectedDate || !selectedTimeSlot}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Rescheduling...' : 'Reschedule Appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}