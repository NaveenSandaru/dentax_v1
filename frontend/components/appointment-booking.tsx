"use client"

import { useContext, useEffect, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Plus, Search, Filter, CalendarIcon, X, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { DoctorScheduleColumn } from "./doctor-schedule-column"
import { ListView } from "./list-view"
import { RoomView } from "./room-view"
import { Dentist, type DayOfWeek } from "@/types/dentist"
import { AppointmentDialog } from '@/components/AppointmentDialog'
import { AuthContext } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import axios from "axios"
import DentistScheduleView from "@/components/dentist-schedule-view"

// Helper function to get current date as string
const getCurrentDateString = () => {
  return new Date().toISOString().split("T")[0]
}

interface AppointmentBookingProps {
  onViewChange?: (view: "week" | "schedule" | "list" | "rooms") => void;
  userRole?: 'admin' | 'receptionist';
}

export default function AppointmentBooking({ onViewChange, userRole = 'admin' }: AppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState(getCurrentDateString())
  const [viewMode, setViewMode] = useState<"day" | "week">("week")
  const [calendarView, setCalendarView] = useState<"week" | "schedule" | "list" | "rooms">("list")

  // Call onViewChange when calendarView changes
  useEffect(() => {
    if (onViewChange) {
      onViewChange(calendarView);
    }
  }, [calendarView, onViewChange])
  const [searchQuery, setSearchQuery] = useState("")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedWeekDate, setSelectedWeekDate] = useState(getCurrentDateString())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [selectedSlotInfo, setSelectedSlotInfo] = useState<{
    dentistId: string;
    dentistName: string;
    date: string;
    timeSlot: string;
  } | null>(null);

  const [loadingDentists, setLoadingDentists] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);

  const router = useRouter();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const fetchDentists = async () => {
    setLoadingDentists(true);
    try {
      const response = await apiClient.get(
        `/dentists`
      );
      if (response.status == 500) {
        throw new Error("Error Fetching Dentists");
      }
      setDentists(response.data);
    }
    catch (err: any) {
      window.alert(err.message);
    }
    finally {
      setLoadingDentists(false);
    }
  };

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      window.alert("Please Log in");
      router.push("/login");
    }
    else if (user.role != "receptionist" && user.role != "admin") {
      window.alert("Access Denied");
      router.push("/login");
    }
  }, [isLoadingAuth]);

  useEffect(() => {
    fetchDentists();
  }, []);


  const filteredDentists = dentists.filter(
    (dentist) =>
      dentist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dentist.service_types?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Generate week days for the current view
  const generateWeekDays = (baseDate: string): DayOfWeek[] => {
    const date = new Date(baseDate)
    const dayOfWeek = date.getDay()
    const startDate = new Date(date)
    startDate.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)) // Start from Monday

    return Array.from({ length: 7 }, (_, i) => {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dateStr = currentDate.toISOString().split("T")[0]
      return {
        date: dateStr,
        name: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
        fullName: currentDate.toLocaleDateString("en-US", { weekday: "long" }),
        dayIndex: currentDate.getDay(), // Add dayIndex property (0 = Sunday, 1 = Monday, etc.)
        isToday: dateStr === new Date().toISOString().split("T")[0]
      }
    })
  }

  // Generate week days for room view (Sunday to Saturday)
  const generateRoomViewWeekDays = (baseDate: string): DayOfWeek[] => {
    const base = new Date(baseDate)
    const startOfWeek = new Date(base)
    startOfWeek.setDate(base.getDate() - base.getDay()) // Start from Sunday

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const dateStr = date.toISOString().split("T")[0]
      return {
        date: dateStr,
        name: date.toLocaleDateString("en-US", { weekday: "short" }),
        fullName: dayNames[date.getDay()],
        dayIndex: date.getDay(),
        isToday: dateStr === new Date().toISOString().split("T")[0]
      }
    })
  }

  const roomViewWeekDays = generateRoomViewWeekDays(selectedWeekDate)

  const weekDays = generateWeekDays(selectedWeekDate)

  const formatSelectedDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    })
  }

  const formatWeekRange = (weekDays: Array<DayOfWeek | { date: string }>) => {
    if (weekDays.length === 0) return ""
    const startDate = new Date(weekDays[0].date)
    const endDate = new Date(weekDays[6].date)

    return `${startDate.getDate()} - ${endDate.getDate()} ${endDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`; // Local YYYY-MM-DD
      console.log(formattedDate);
      setSelectedDate(formattedDate);
      if (viewMode === "week") {
        setSelectedWeekDate(formattedDate);
      }
      setCalendarOpen(false);
    }
  };

  const handleAppointmentCreated = () => {
    router.refresh();
    setRefreshKey(prev => prev + 1);
  };

  const handleWeekNavigation = (direction: "prev" | "next") => {
    const currentWeek = new Date(selectedWeekDate)
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === "next" ? 7 : -7))
    setSelectedWeekDate(newWeek.toISOString().split("T")[0])
  }

  const handleDaySelect = (date: string) => {
    setSelectedDate(date)
    if (viewMode === "week") {
      setViewMode("day")
    }
  }

  const handleSlotSelect = (dentistId: string, dentistName: string, date: string, timeSlot: string) => {
    setSelectedSlotInfo({
      dentistId,
      dentistName,
      date,
      timeSlot
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedSlotInfo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-full mx-auto">
        {/* Header with search (only for non-schedule views) */}
        {calendarView !== "schedule" && (
          <div className="mb-4 sm:mb-6">
            <div className="flex-1 relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search appointments"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-white text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Bar - Add Appointment button and View Selection */}
        <div className="flex justify-between items-center gap-4 mb-4 sm:mb-6">


          {/* View Selection Dropdown - Always visible, aligned to the right */}
          <div className="w-40 md:ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="justify-between">
                <Button variant="outline" size="sm" className="text-sm w-full">
                  <span className="hidden sm:inline">
                    {calendarView === "week" 
                      ? "Calendar view" 
                      : calendarView === "schedule" 
                        ? "Schedule view" 
                        : calendarView === "rooms"
                          ? "Room view"
                          : "List view"}
                  </span>
                  <span className="sm:hidden">
                    {calendarView === "week" 
                      ? "Calendar view" 
                      : calendarView === "schedule" 
                        ? "Schedule view" 
                        : calendarView === "rooms"
                          ? "Room view"
                          : "List view"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 md:ml-auto" align="end">
                <DropdownMenuItem onClick={() => setCalendarView("week")}>Calendar view</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCalendarView("list")}>List view</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCalendarView("rooms")}>Room view</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Add Appointment Button - Always visible */}

          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Appointment
          </Button>

        </div>

        {/* Date and View Controls - Only show in week view */}
        {calendarView === "week" && (
          <div className="flex flex-col gap-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                {/* Date Picker */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4" />
                      <span className="font-medium">{formatSelectedDate(selectedDate)}</span>
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
                <div className="flex rounded-lg p-1 gap-2">
                  <Button
                    size="sm"
                    onClick={() => setViewMode("day")}
                    className={`flex items-center text-sm ${viewMode === "day"
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-white text-black border hover:bg-green-100'
                      }`}
                  >
                    By day
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setViewMode("week")}
                    className={`flex items-center text-sm ${viewMode === "week"
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-white text-black border hover:bg-green-100'
                      }`}
                  >
                    By Week
                  </Button>
                </div>
              </div>
            </div>

            {/* Week Navigation and Days - Only show in week view */}
            <div className="bg-white rounded-lg border p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Button variant="ghost" size="sm" onClick={() => handleWeekNavigation("prev")} className="p-1 sm:p-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 text-center">
                  {formatWeekRange(weekDays)}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => handleWeekNavigation("next")} className="p-1 sm:p-2">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Week Days */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {weekDays.map((day, index) => {
                  const isSelected = day.date === selectedDate
                  const isToday = day.date === new Date().toISOString().split("T")[0]

                  return (
                    <button
                      key={index}
                      onClick={() => handleDaySelect(day.date)}
                      className={`p-2 sm:p-3 rounded-lg text-center transition-colors ${isSelected
                        ? "bg-blue-500 text-white"
                        : isToday
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                    >
                      <div className="text-xs sm:text-sm font-medium">{day.name}</div>
                      <div className="text-xs sm:text-sm mt-1">{new Date(day.date).getDate()}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Day View Header */}
        {viewMode === "day" && calendarView !== "list" && calendarView !== "rooms" && (
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
        )}

        {/* Content based on calendar view */}
        {calendarView === "rooms" ? (
          <div className="mt-4">
            {/* Date and View Controls for Room View */}
            <div className="flex flex-col gap-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  {/* Date Picker */}
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="font-medium">{formatSelectedDate(selectedDate)}</span>
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
                  <div className="flex rounded-lg p-1 gap-2">
                    <Button
                      size="sm"
                      onClick={() => setViewMode("day")}
                      className={`flex items-center text-sm ${viewMode === "day"
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-white text-black border hover:bg-green-100'
                        }`}
                    >
                      By day
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setViewMode("week")}
                      className={`flex items-center text-sm ${viewMode === "week"
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-white text-black border hover:bg-green-100'
                        }`}
                    >
                      By Week
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-3 sm:p-4">
                {/* Week Navigation */}
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <Button variant="ghost" size="sm" onClick={() => handleWeekNavigation("prev")} className="p-1 sm:p-2">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-800 text-center">
                    {formatWeekRange(roomViewWeekDays)}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => handleWeekNavigation("next")} className="p-1 sm:p-2">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Week Days */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {weekDays.map((day, index) => {
                    const isSelected = day.date === selectedDate
                    const isToday = day.date === new Date().toISOString().split("T")[0]

                    return (
                      <button
                        key={index}
                        onClick={() => handleDaySelect(day.date)}
                        className={`p-2 sm:p-3 rounded-lg text-center transition-colors ${isSelected
                          ? "bg-blue-500 text-white"
                          : isToday
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        <div className="text-xs sm:text-sm font-medium">{day.name}</div>
                        <div className="text-xs sm:text-sm mt-1">{new Date(day.date).getDate()}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Day View Header */}
              {viewMode === "day" && (
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
              )}
            </div>

            {/* Room View Component */}
            <RoomView
              weekDays={roomViewWeekDays}
              selectedDate={selectedDate}
              viewMode={viewMode}
            />
          </div>
        ) : calendarView === "schedule" && userRole === 'admin' ? (
          dentists.length > 0 && (
            <div className="w-full">
              <DentistScheduleView dentistId={dentists[0].dentist_id.toString()} />
            </div>
          )
        ) : calendarView === "list" ? (
          <ListView selectedDate={selectedDate} refreshKey={refreshKey} searchQuery={searchQuery} />
        ) : (
          /* Doctor Schedule Columns */
          <div className=" flex gap-2 sm:gap-4 overflow-x-auto pb-4">
            {filteredDentists?.map((dentist) => (
              <div key={`${dentist.dentist_id}-${refreshKey}`} >
                <DoctorScheduleColumn
                  dentist={dentist}
                  weekDays={weekDays}
                  selectedWeek={formatWeekRange(weekDays)}
                  viewMode={viewMode}
                  selectedDate={selectedDate}
                  onSlotSelect={handleSlotSelect}
                />
              </div>
            ))}
          </div>
        )}

        {/* No doctors found message */}
        {calendarView === "week" && filteredDentists.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-sm sm:text-base">No doctors found matching your search criteria.</p>
          </div>
        )}
        {/* Appointment Dialog */}
        <AppointmentDialog
          key={refreshKey}
          open={isDialogOpen}
          onOpenChange={handleDialogClose}
          onAppointmentCreated={handleAppointmentCreated}
          selectedSlotInfo={selectedSlotInfo}
        />
      </div>
    </div>
  )
}