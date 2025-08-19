"use client"

import { useState, useEffect, useContext } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Clock,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  CreditCard,
  RotateCcw,
  Ban,
  XCircle,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import axios from "axios"
import { AuthContext } from "@/context/auth-context"
import { RescheduleDialog } from './RescheduleDialog'
import { toast } from "sonner"

interface Patient {
  patient_id: string
  name: string
  email: string
  phone_number: string
  hospital_patient_id: string
}

interface TempPatient {
  temp_patient_id: string
  name: string
  email: string
  phone_number: string
  created_at: string
}

interface Dentist {
  dentist_id: string
  name: string
  email: string
  phone_number: string
  appointment_fee: number
  service_types?: string
  work_days_from?: string
  work_days_to?: string
  work_time_from?: string
  work_time_to?: string
  appointment_duration?: string
}

interface InvoiceService {
  service_id: number
  service_name: string
  amount: number
}

interface Appointment {
  appointment_id: number
  patient_id: string
  dentist_id: string
  date: string
  time_from: string
  time_to: string
  fee: number
  note: string
  status: string
  payment_status: string
  patient: Patient | null
  temp_patient: TempPatient | null
  dentist: Dentist
  invoice_services?: InvoiceService
}

interface ListViewProps {
  selectedDate: string
  refreshKey?: number
  searchQuery: string
}

export function ListView({ selectedDate, refreshKey, searchQuery }: ListViewProps) {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([])
  const [checkedInAppointments, setCheckedInAppointments] = useState<Appointment[]>([])
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([])
  const [activeTab, setActiveTab] = useState("today")
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null)
  const { apiClient, user } = useContext(AuthContext)
  const router = useRouter()

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL

  const fetchAppointments = async () => {
    try {
      const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL

      // Get all appointments first
      const allRes = await apiClient.get(`/appointments`)
      const allData = allRes.data

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Filter for today's appointments (any status)
      const todayAppts = allData.filter((appointment: Appointment) => {
        // Only require dentist to be present, patient can be null for pending appointments
        if (!appointment.dentist) return false;
        const appointmentDate = new Date(appointment.date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate.getTime() === today.getTime()
      })
      setTodayAppointments(todayAppts)

      // Filter for checked-in appointments (status = 'checkedin')
      const checkedInAppts = allData.filter((appointment: Appointment) => {
        // For checked-in appointments, we still want both patient and dentist
        return appointment.status === 'checkedin' && appointment.patient && appointment.dentist
      })
      setCheckedInAppointments(checkedInAppts)

      // Get upcoming appointments (any status)
      const upcoming = allData.filter((appointment: Appointment) => {
        // Only require dentist to be present for upcoming appointments
        if (!appointment.dentist) return false;
        const appointmentDate = new Date(appointment.date)
        appointmentDate.setHours(0, 0, 0, 0)
        return appointmentDate > today
      })

      setAllAppointments(upcoming)
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
      toast.error("Failed to load appointments")
    }
  }

  // Load appointments
  useEffect(() => {
    fetchAppointments()
  }, [refreshKey]) // Add refreshKey to dependency array

  // Handle payment status toggle
  const handlePaymentToggle = async (appointmentId: number, currentStatus: string) => {
    if (currentStatus === "paid") {
      return
    }

    try {
      // Update payment status to paid
      await apiClient.put(`/appointments/${appointmentId}`, {
        payment_status: "paid",
      })

      const now = new Date()
      const payment_date = now.toISOString().split("T")[0]
      const payment_time = now.toTimeString().split(":").slice(0, 2).join(":")

      await apiClient.post(`/payment-history`, {
        appointment_id: appointmentId,
        payment_date: payment_date,
        payment_time: payment_time,
        reference_number: "<reference number here>",
      })

      // Update local state
      const updateAppointmentPayment = (appointments: Appointment[]) =>
        appointments.map((appointment) =>
          appointment.appointment_id === appointmentId ? { ...appointment, payment_status: "paid" } : appointment,
        )

      setTodayAppointments((prev) => updateAppointmentPayment(prev))
      setAllAppointments((prev) => updateAppointmentPayment(prev))
      setCheckedInAppointments((prev) => updateAppointmentPayment(prev))
    } catch (error) {
      console.error("Failed to update payment status:", error)
    }
  }

  const handleCheckIn = async (appointmentId: number) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, {
        status: "checkedin",
      })
      toast.success("Patient checked in successfully")
      fetchAppointments()
    } catch (error) {
      console.error("Error checking in patient:", error)
      toast.error("Failed to check in patient")
    }
  }

  const handleCancel = async (appointmentId: number) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, { status: "cancelled" })
      toast.success("Appointment cancelled")
      fetchAppointments()
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      toast.error("Failed to cancel appointment")
    }
  }

  const handleNoShow = async (appointmentId: number) => {
    try {
      await apiClient.put(`/appointments/${appointmentId}`, { status: "noshow" })
      toast.success("Marked as no-show")
      fetchAppointments()
    } catch (error) {
      console.error("Error marking no-show:", error)
      toast.error("Failed to mark no-show")
    }
  }

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointmentForReschedule(appointment)
    setRescheduleDialogOpen(true)
  }

  const handleAppointmentRescheduled = () => {
    fetchAppointments()
    setRescheduleDialogOpen(false)
    setSelectedAppointmentForReschedule(null)
  }

  // Filter appointments based on search and tab
  useEffect(() => {
    let source: Appointment[] = []

    switch (activeTab) {
      case "today":
        source = todayAppointments
        break
      case "upcoming":
        source = allAppointments
        break
      case "checked-in":
        source = checkedInAppointments
        break
      default:
        source = []
    }

    if (searchQuery) {
      source = source.filter(
        (appointment) =>
          (appointment.patient?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (appointment.dentist?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (appointment.note || "").toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredAppointments(source)
  }, [activeTab, searchQuery, todayAppointments, allAppointments, checkedInAppointments])

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "not-paid":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const isToday = (appointmentDate: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const apptDate = new Date(appointmentDate)
    apptDate.setHours(0, 0, 0, 0)
    return apptDate.getTime() === today.getTime()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      {/*<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        Search 
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        <Button className="bg-emerald-500 hover:bg-emerald-600 text-white flex-shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Add Appointment</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>*/}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="text-xs sm:text-sm">
            Today
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="checked-in" className="text-xs sm:text-sm">
            Checked In
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 sm:mt-6">
          {/* Desktop View */}
          <div className="hidden lg:block">
            {filteredAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    {activeTab === "today" && "Today's Appointments"}
                    {activeTab === "upcoming" && "Upcoming Appointments"}
                    {activeTab === "checked-in" && "Checked In Patients"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-green-50 border-b border-gray-200">
                        <tr className="border-b">
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">
                            Patient
                          </th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">
                            Service Type
                          </th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">
                            Note
                          </th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">
                            Date & Time
                          </th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">
                            Payment
                          </th>
                          <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-xs sm:text-sm">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAppointments.map((appointment) => (
                          <tr key={appointment.appointment_id} className="border-b hover:bg-gray-50">
                            <td className="py-3 sm:py-4 px-2 sm:px-4">
                              <div>
                                <div className="font-medium text-gray-900 text-xs sm:text-sm">
                                  {appointment.patient?.name || appointment.temp_patient?.name || 'Deleted patient'}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2 mt-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{appointment.patient?.email || appointment.temp_patient?.email || 'No email'}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1 sm:gap-2">
                                  <Phone className="w-3 h-3" />
                                  {appointment.patient?.phone_number || appointment.temp_patient?.phone_number || 'No phone'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-2 sm:px-4">
                              <div>
                                <div className="font-medium text-gray-900 text-xs sm:text-sm">
                                  {appointment.invoice_services?.service_name || 'N/A'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {appointment.invoice_services?.amount ? `LKR ${appointment.invoice_services.amount}` : ''}
                                </div>
                               
                                <div className="text-xs text-gray-500 mt-1">
                                  <strong>Dentist:</strong> {appointment.dentist?.name || 'Unknown'}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-2 sm:px-4">
                              <div className="text-xs text-gray-600 max-w-xs truncate">{appointment.note}</div>
                            </td>
                            <td className="py-3 sm:py-4 px-2 sm:px-4">
                              <div>
                                <div className="font-medium text-gray-900 text-xs sm:text-sm">
                                  {formatDate(appointment.date)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatTime(appointment.time_from)} - {formatTime(appointment.time_to)}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-2 sm:px-4">
                              <div className="space-y-2">
                                <Badge className={`${getPaymentStatusColor(appointment.payment_status)} text-xs`}>
                                  {appointment.payment_status}
                                </Badge>
                                <div className="flex items-center space-x-2">
                                  <CreditCard className="w-3 h-3 text-gray-500" />
                                  <Switch
                                    checked={appointment.payment_status === "paid"}
                                    onCheckedChange={() =>
                                      handlePaymentToggle(appointment.appointment_id, appointment.payment_status)
                                    }
                                    disabled={
                                      appointment.payment_status === "paid" || appointment.status === "cancelled"
                                    }
                                    className="data-[state=checked]:bg-green-500 scale-75"
                                  />
                                  <span className="text-[10px] text-gray-500">
                                    {appointment.status === "cancelled"
                                      ? "Payment Disabled"
                                      : appointment.payment_status === "paid"
                                        ? "Paid"
                                        : "Mark as Paid"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 sm:py-4 px-2 sm:px-4">
                              <div className="flex gap-2 items-center flex-nowrap">
                                {appointment.temp_patient && appointment.status === "noshow" ? (
                                  <span className="text-red-500 text-xs font-medium">No Show</span>
                                ) : appointment.status === "cancelled" ? (
                                  <span className="text-red-500 text-xs font-medium">Cancelled</span>
                                ) : appointment.temp_patient ? (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                                    onClick={() => {
                                      const basePath = user.role === "receptionist" ? "/receptionist" : "/admin";
                                      router.push(`${basePath}/patients?tempPatientId=${appointment.temp_patient?.temp_patient_id}`);
                                    }}
                                  >
                                    Register
                                  </Button>
                                ) : appointment.status === "checkedin" ? (
                                  <CheckCircle className="text-green-600 w-4 h-4" />
                                ) : appointment.status === "rescheduled" ? (
                                  <span className="text-blue-500 text-xs font-medium">Rescheduled</span>
                                ) : appointment.status === "noshow" ? (
                                  <span className="text-red-500 text-xs font-medium">No Show</span>
                                ) : appointment.status === "overdue" ? (
                                  <span className="text-orange-500 text-xs font-medium">Overdue</span>
                                ) : isToday(appointment.date) ? (
                                  <Button
                                    size="sm"
                                    className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs px-2 py-1"
                                    onClick={() => handleCheckIn(appointment.appointment_id)}
                                  >
                                    Check In
                                  </Button>
                                ) : (
                                  <span className="text-gray-500 text-xs font-medium">Upcoming</span>
                                )}

                                {/* Cancel button */}
                                {appointment.status !== "checkedin" && appointment.status !== "cancelled" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <XCircle
                                        className="w-4 h-4 text-gray-500 cursor-pointer"
                                        onClick={() => handleCancel(appointment.appointment_id)}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>Cancel Appointment</TooltipContent>
                                  </Tooltip>
                                )}

                                {/* Mark No-Show button */}
                                {appointment.status !== "checkedin" &&
                                  appointment.status !== "cancelled" &&
                                  appointment.status !== "noshow" && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Ban
                                          className="w-4 h-4 text-red-600 cursor-pointer"
                                          onClick={() => handleNoShow(appointment.appointment_id)}
                                        />
                                      </TooltipTrigger>
                                      <TooltipContent>Mark No-Show</TooltipContent>
                                    </Tooltip>
                                  )}

                                {/* Reschedule button */}
                                {appointment.status !== "checkedin" && appointment.status !== "cancelled" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <RotateCcw
                                        className="w-4 h-4 text-blue-600 cursor-pointer"
                                        onClick={() => handleReschedule(appointment)}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent>Reschedule</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Mobile View with temp patinets */}
          <div className="block lg:hidden">
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <Card key={appointment.appointment_id} className="mb-4">
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {appointment.patient?.name || appointment.temp_patient?.name || 'Deleted patient'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {appointment.patient?.email || appointment.temp_patient?.email || 'No email'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {appointment.patient?.phone_number || appointment.temp_patient?.phone_number || 'No phone'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                          {appointment.status}
                        </Badge>
                        <Badge className={`${getPaymentStatusColor(appointment.payment_status)} text-xs`}>
                          {appointment.payment_status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2 py-1"
                          onClick={() => handlePaymentToggle(appointment.appointment_id, appointment.payment_status)}
                          disabled={appointment.payment_status === "paid" || appointment.status === "cancelled"}
                        >
                          {appointment.payment_status === "paid" ? "Paid" : "Mark as Paid"}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">{appointment.note}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(appointment.date)} - {formatTime(appointment.time_from)} to{" "}
                        {formatTime(appointment.time_to)}
                      </p>
                    </div>
                    
                    <div className="mt-3 flex items-center space-x-2">
                      {appointment.temp_patient && appointment.status === "noshow" ? (
                        <span className="text-red-500 text-xs font-medium">No Show</span>
                      ) : appointment.status === "cancelled" ? (
                        <span className="text-red-500 text-xs font-medium">Cancelled</span>
                      ) : appointment.temp_patient ? (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                          onClick={() => {
                            const basePath = user.role === "receptionist" ? "/receptionist" : "/admin";
                            router.push(`${basePath}/patients?tempPatientId=${appointment.temp_patient?.temp_patient_id}`);
                          }}
                        >
                          Register
                        </Button>
                      ) : appointment.status === "checkedin" ? (
                        <CheckCircle className="text-green-600 w-4 h-4" />
                      ) : appointment.status === "rescheduled" ? (
                        <span className="text-blue-500 text-xs font-medium">Rescheduled</span>
                      ) : appointment.status === "noshow" ? (
                        <span className="text-red-500 text-xs font-medium">No Show</span>
                      ) : appointment.status === "overdue" ? (
                        <span className="text-orange-500 text-xs font-medium">Overdue</span>
                      ) : isToday(appointment.date) ? (
                        <Button
                          size="sm"
                          className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs px-2 py-1"
                          onClick={() => handleCheckIn(appointment.appointment_id)}
                        >
                          Check In
                        </Button>
                      ) : (
                        <span className="text-gray-500 text-xs font-medium">Upcoming</span>
                      )}

                   
                    </div>
                    <div className="mt-4 flex items-center space-x-8">
                      {/* Cancel button */}
                      {appointment.status !== "checkedin" && appointment.status !== "cancelled" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <XCircle
                              className="w-4 h-4 text-gray-500 cursor-pointer"
                              onClick={() => handleCancel(appointment.appointment_id)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>Cancel Appointment</TooltipContent>
                        </Tooltip>
                      )}
                      {/* Mark No-Show button */}
                      {appointment.status !== "checkedin" &&
                        appointment.status !== "cancelled" &&
                        appointment.status !== "noshow" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Ban
                                className="w-4 h-4 text-red-600 cursor-pointer"
                                onClick={() => handleNoShow(appointment.appointment_id)}
                              />
                            </TooltipTrigger>
                            <TooltipContent>Mark No-Show</TooltipContent>
                          </Tooltip>
                        )}

                      {/* Reschedule button */}
                      {appointment.status !== "checkedin" && appointment.status !== "cancelled" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <RotateCcw
                              className="w-4 h-4 text-blue-600 cursor-pointer"
                              onClick={() => handleReschedule(appointment)}
                            />
                          </TooltipTrigger>
                          <TooltipContent>Reschedule</TooltipContent>
                        </Tooltip>
                      )}
                    </div>




                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-gray-500">No appointments found</p>
            )}
          </div>


          

          {/* Empty State */}
          {filteredAppointments.length === 0 && (
            <Card>
              <CardContent className="text-center py-8 sm:py-12">
                <Calendar className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {searchQuery
                    ? `No appointments match "${searchQuery}"`
                    : `No appointments for ${activeTab === "today" ? "today" : activeTab}`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reschedule Dialog */}
      <RescheduleDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
        onAppointmentRescheduled={handleAppointmentRescheduled}
        appointment={selectedAppointmentForReschedule}
      />
    </div>
  )
}
