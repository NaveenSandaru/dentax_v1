'use client'

import { useState, useEffect, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from "sonner"
import axios from 'axios'
import { AuthContext } from '@/context/auth-context'
import { useRouter } from 'next/navigation'

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

interface InvoiceService {
  service_id: number
  service_name: string
  amount: number
  duration: string
}

interface Dentist {
  dentist_id: string
  name: string
  email: string
  phone_number: string
  service_types: string
  work_days_from: string
  work_days_to: string
  work_time_from: string
  work_time_to: string
  appointment_duration: string
  appointment_fee: number
}

interface TimeSlot {
  start: string
  end: string
}

interface FormData {
  patientId: string;
  dentistId: string;
  serviceId: string;
  timeSlot: string;
  note: string;
  invoice_service: string;
}

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentCreated: () => void;
  selectedSlotInfo?: {
    dentistId: string;
    dentistName: string;
    date: string;
    timeSlot: string;
  } | null;
}

export function AppointmentDialog({ open, onOpenChange, onAppointmentCreated, selectedSlotInfo }: AppointmentDialogProps) {
  const [patients, setPatients] = useState<Record<string, Patient>>({})
  const [dentists, setDentists] = useState<Dentist[]>([])
  const [availableDentists, setAvailableDentists] = useState<Dentist[]>([])
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [dateString, setDateString] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [patientSearchTerm, setPatientSearchTerm] = useState('')
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([])
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  
  // New states for temp patient functionality
  const [appointmentType, setAppointmentType] = useState<'regular' | 'temp'>('regular')
  const [tempPatientData, setTempPatientData] = useState({
    name: '',
    phone_number: '',
    email: ''
  })
  const [tempPatientSearchTerm, setTempPatientSearchTerm] = useState('')
  const [tempPatientSearchResults, setTempPatientSearchResults] = useState<TempPatient[]>([])
  const [showTempPatientDropdown, setShowTempPatientDropdown] = useState(false)
  const [selectedTempPatient, setSelectedTempPatient] = useState<TempPatient | null>(null)
  // Service Types
  const [invoiceServices, setInvoiceServices] = useState<InvoiceService[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  
  // Update form data when service is selected and fetch available dentists
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      serviceId: selectedServiceId,
      invoice_service: selectedServiceId,
      dentistId: '' // Reset dentist selection when service changes
    }));
    
    // Reset dentist-related states when service changes
    setSelectedDentist(null);
    setTimeSlots([]);
    
    // Fetch dentists for the selected service
    if (selectedServiceId) {
      fetchDentistsForService(selectedServiceId);
    } else {
      setAvailableDentists([]);
    }
    
    // Find the selected service to get its duration
    const selectedService = invoiceServices.find(service => 
      service.service_id.toString() === selectedServiceId
    );
    
    if (selectedService && selectedDentist && dateString) {
      // If we have a selected service with duration, update the time slots
      generateTimeSlotsForService(selectedService.duration);
    }
  }, [selectedServiceId]);

  // Update form data when selectedSlotInfo changes
  useEffect(() => {
    if (selectedSlotInfo) {
      setFormData(prev => ({
        ...prev,
        dentistId: selectedSlotInfo.dentistId,
        timeSlot: selectedSlotInfo.timeSlot,
        serviceId: prev.serviceId, // Preserve existing serviceId
        patientId: prev.patientId, // Preserve existing patientId
        note: prev.note,           // Preserve existing note
        invoice_service: prev.invoice_service // Preserve existing invoice_service
      }));
      setDateString(selectedSlotInfo.date);
    }
  }, [selectedSlotInfo]);

  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    dentistId: selectedSlotInfo?.dentistId || '',
    serviceId: '',
    timeSlot: '',
    note: '',
    invoice_service: ''
  })
  const [patientValidated, setPatientValidated] = useState(true)
  const [patientErrorMessage, setPatientErrorMessage] = useState('')

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const {isLoadingAuth, isLoggedIn, user, apiClient} = useContext(AuthContext);
  const router = useRouter();

  useEffect(()=>{
    if(isLoadingAuth) return;
    if(!isLoggedIn){
      toast.error("Please Log in");
      router.push("/login");
    }
    else if(user.role != "admin" && user.role != "receptionist"){
      toast.error("Access Denied");
      router.push("/login");
    }
  },[isLoadingAuth]);

  // Fetch service types on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const serviceRes = await apiClient.get('/invoice-services')
        if (serviceRes.data) setInvoiceServices(serviceRes.data)
      } catch (err) {
        console.error('Error fetching initial data', err)
        toast.error('Failed loading initial data')
      }
    }
    fetchData()
  }, []);

  // Helper function to generate time slots based on work hours and duration
    const generateTimeSlots = (workTimeFrom: string, workTimeTo: string, duration: string): TimeSlot[] => {
    const slots: TimeSlot[] = []
    
    console.log('🔍 Generating slots with:', { workTimeFrom, workTimeTo, duration })
    
    // More robust duration parsing
    const durationMatch = duration.match(/(\d+)/)
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 30
    
    if (durationMinutes <= 0) {
      console.warn('⚠️ Invalid duration:', duration)
      return slots
    }
    
    console.log('⏱️ Parsed duration minutes:', durationMinutes)
    
    // Enhanced time parsing function
    const parseTime = (timeStr: string): { hours: number, minutes: number } | null => {
      if (!timeStr || typeof timeStr !== 'string') {
        console.warn('⚠️ Invalid time string:', timeStr)
        return null
      }
      
      let cleanTime = timeStr.trim()
      
      // Handle AM/PM format
      const isPM = /PM/i.test(cleanTime)
      const isAM = /AM/i.test(cleanTime)
      
      // Extract just the time part (digits and colon)
      cleanTime = cleanTime.replace(/[^\d:]/g, '')
      
      if (!cleanTime.includes(':')) {
        // Handle cases like "9" -> "9:00"
        cleanTime = cleanTime + ':00'
      }
      
      const [hoursStr, minutesStr = '0'] = cleanTime.split(':')
      let hours = parseInt(hoursStr)
      const minutes = parseInt(minutesStr) || 0
      
      if (isNaN(hours) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        console.warn('⚠️ Invalid time components:', { hours, minutes, original: timeStr })
        return null
      }
      
      // Convert 12-hour to 24-hour format
      if (isPM && hours !== 12) {
        hours += 12
      } else if (isAM && hours === 12) {
        hours = 0
      }
      
      // Ensure hours are within valid range after AM/PM conversion
      if (hours > 23) hours = 23
      if (hours < 0) hours = 0
      
      return { hours, minutes }
    }
    
    const startTime = parseTime(workTimeFrom)
    const endTime = parseTime(workTimeTo)
    
    if (!startTime || !endTime) {
      console.error('❌ Failed to parse work times:', { workTimeFrom, workTimeTo })
      return slots
    }
    
    console.log('🕐 Parsed times:', { startTime, endTime })
    
    // Convert to minutes for easier calculation
    let currentMinutes = startTime.hours * 60 + startTime.minutes
    const endMinutes = endTime.hours * 60 + endTime.minutes
    
    console.log('📊 Time in minutes:', { currentMinutes, endMinutes })
    
    // Handle case where end time is next day (e.g., night shift)
    const actualEndMinutes = endMinutes <= currentMinutes ? endMinutes + 24 * 60 : endMinutes
    
    let slotCount = 0
    const maxSlots = 50 // Safety limit to prevent infinite loops
    
    while (currentMinutes + durationMinutes <= actualEndMinutes && slotCount < maxSlots) {
      const startHours = Math.floor(currentMinutes / 60) % 24
      const startMins = currentMinutes % 60
      
      const endSlotMinutes = currentMinutes + durationMinutes
      const endHours = Math.floor(endSlotMinutes / 60) % 24
      const endMins = endSlotMinutes % 60
      
      const formatTime = (hours: number, minutes: number): string => {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      }
      
      slots.push({
        start: formatTime(startHours, startMins),
        end: formatTime(endHours, endMins)
      })
      
      currentMinutes += durationMinutes
      slotCount++
    }
    
    if (slotCount >= maxSlots) {
      console.warn('⚠️ Hit maximum slot limit, possible infinite loop prevented')
    }
    
    console.log('✅ Generated slots:', slots)
    return slots
  }

  // Check if selected date is within dentist's working days
  const isWorkingDay = (date: Date, dentist: Dentist): boolean => {
    if (!dentist || !dentist.work_days_from || !dentist.work_days_to) {
      console.warn('⚠️ Invalid dentist working days data:', dentist)
      return false
    }
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const selectedDay = dayNames[date.getDay()]
    
    const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    const fromIndex = workDays.indexOf(dentist.work_days_from)
    const toIndex = workDays.indexOf(dentist.work_days_to)
    const selectedIndex = workDays.indexOf(selectedDay)
    
    if (fromIndex === -1 || toIndex === -1 || selectedIndex === -1) {
      console.warn('⚠️ Invalid day names:', { 
        from: dentist.work_days_from, 
        to: dentist.work_days_to, 
        selected: selectedDay 
      })
      return true // Default to true if we can't parse the days
    }
    
    let isWorking: boolean
    if (fromIndex <= toIndex) {
      isWorking = selectedIndex >= fromIndex && selectedIndex <= toIndex
    } else {
      // Handle case where work days span across week (e.g., Saturday to Monday)
      isWorking = selectedIndex >= fromIndex || selectedIndex <= toIndex
    }
    
    console.log('📅 Working day check:', { 
      selectedDay, 
      workFrom: dentist.work_days_from, 
      workTo: dentist.work_days_to, 
      isWorking 
    })
    
    return isWorking
  }

  // Search for patients by name, ID, or email
  const searchPatients = async (term: string) => {
    if (term.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    
    try {
      const response = await apiClient.get(`/patients/search?q=${encodeURIComponent(term)}`);
      if (response.data) {
        setPatientSearchResults(response.data);
        
        // If no patients were found matching the search term
        if (response.data.length === 0 && term.length > 2) {
          setPatientValidated(false);
          setPatientErrorMessage('No matching patients found. Please select a patient from the dropdown.');
        }
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      setPatientSearchResults([]);
    }
  };

  // Search for temp patients by name, ID, email, or phone
  const searchTempPatients = async (term: string) => {
    if (term.length < 2) {
      setTempPatientSearchResults([]);
      return;
    }
    
    try {
      const response = await apiClient.get(`/temp-patients/search?q=${encodeURIComponent(term)}`);
      if (response.data) {
        setTempPatientSearchResults(response.data);
      }
    } catch (err) {
      console.error('Error searching temp patients:', err);
      setTempPatientSearchResults([]);
    }
  };

  // Fetch dentists on component mount
  useEffect(() => {
    const fetchDentists = async () => {
      try {
        setDebugInfo('Fetching dentists...')
        const response = await apiClient.get(`/dentists`)
        setDentists(response.data)
        setDebugInfo(`Loaded ${response.data.length} dentists`)
        console.log('✅ Loaded dentists:', response.data.length)
      } catch (error) {
        console.error('❌ Error fetching dentists:', error)
        setDebugInfo('Error loading dentists: ' + (error as Error).message)
      }
    }

    if (open) {
      fetchDentists()
    }
  }, [open, backendURL])

  // Function to fetch dentists for a specific service
  const fetchDentistsForService = async (serviceId: string) => {
    try {
      setDebugInfo('Fetching dentists for service...')
      const response = await apiClient.get(`/dentists/for-service/${serviceId}`)
      setAvailableDentists(response.data)
      setDebugInfo(`Found ${response.data.length} dentists for this service`)
      console.log('✅ Loaded dentists for service:', response.data.length)
    } catch (error) {
      console.error('❌ Error fetching dentists for service:', error)
      setAvailableDentists([])
      setDebugInfo('Error loading dentists for service: ' + (error as Error).message)
    }
  }

  // Fetch specific dentist details when dentist is selected
  useEffect(() => {
    const fetchDentistDetails = async () => {
      if (!formData.dentistId) {
        setSelectedDentist(null)
        setDebugInfo('')
        return
      }
      
      try {
        setDebugInfo('Loading dentist details...')
        console.log('🔍 Fetching dentist details for ID:', formData.dentistId)
        const response = await apiClient.get(`/dentists/${formData.dentistId}`)
        console.log('✅ Dentist details loaded:', response.data)
        setSelectedDentist(response.data)
        setDebugInfo(`Loaded dentist: Dr. ${response.data.name}`)
      } catch (error) {
        console.error('❌ Error fetching dentist details:', error)
        setSelectedDentist(null)
        setDebugInfo('Error loading dentist details: ' + (error as Error).message)
      }
    }
    
    fetchDentistDetails()
  }, [formData.dentistId, backendURL])

  // Pre-fill form when selectedSlotInfo is provided
  useEffect(() => {
    if (selectedSlotInfo && open) {
      console.log('🎯 Pre-filling form with slot info:', selectedSlotInfo);
      
      // Set the dentist
      setFormData(prev => ({
        ...prev,
        dentistId: selectedSlotInfo.dentistId
      }));
      
      // Set the date
      setDateString(selectedSlotInfo.date);
    }
  }, [selectedSlotInfo, open]);

  // Set the time slot after time slots are generated
  useEffect(() => {
    if (selectedSlotInfo && timeSlots.length > 0) {
      // Find the matching time slot in the generated slots
      const matchingSlot = timeSlots.find(slot => slot.start === selectedSlotInfo.timeSlot);
      if (matchingSlot) {
        const timeSlotValue = `${matchingSlot.start} - ${matchingSlot.end}`;
        console.log('🎯 Setting pre-selected time slot:', timeSlotValue);
        setFormData(prev => ({
          ...prev,
          timeSlot: timeSlotValue
        }));
      }
    }
  }, [selectedSlotInfo, timeSlots]);

  // Function to generate time slots based on service duration
  const generateTimeSlotsForService = async (serviceDuration: string) => {
    if (!selectedDentist || !dateString) {
      console.log('Missing required data:', { selectedDentist, dateString });
      return;
    }
    
    try {
      setDebugInfo('Generating time slots...');
      console.log('Selected dentist:', selectedDentist);
      console.log('Service duration:', serviceDuration);
      
      // Get existing appointments and blocked dates
      const [appointmentsRes, blockedRes] = await Promise.all([
        apiClient.get(`/appointments/fordentist/${selectedDentist.dentist_id}`).catch(err => {
          console.error('Error fetching appointments:', err);
          throw new Error('Failed to fetch appointments');
        }),
        apiClient.get(`/blocked-dates/fordentist/${selectedDentist.dentist_id}`).catch(err => {
          console.error('Error fetching blocked dates:', err);
          throw new Error('Failed to fetch blocked dates');
        })
      ]);

      console.log('Appointments response:', appointmentsRes?.data);
      console.log('Blocked dates response:', blockedRes?.data);

      // Parse service duration (handles both string and number inputs)
      let durationMinutes = 30; // Default fallback
      
      if (typeof serviceDuration === 'number') {
        // If it's already a number, use it directly
        durationMinutes = serviceDuration;
      } else if (typeof serviceDuration === 'string') {
        // If it's a string, parse it
        const durationMatch = serviceDuration.match(/(\d+)/);
        if (durationMatch) {
          durationMinutes = parseInt(durationMatch[1], 10);
          // If duration is in hours, convert to minutes
          if (serviceDuration.toLowerCase().includes('hour')) {
            durationMinutes *= 60;
          }
        }
      }
      
      console.log('Using duration (minutes):', durationMinutes);
      
      // Validate work times
      if (!selectedDentist.work_time_from || !selectedDentist.work_time_to) {
        throw new Error('Dentist work hours are not properly configured');
      }
      
      console.log('Work hours:', {
        from: selectedDentist.work_time_from,
        to: selectedDentist.work_time_to
      });

      // Generate all possible time slots for the day
      const allSlots = generateTimeSlots(
        selectedDentist.work_time_from,
        selectedDentist.work_time_to,
        `${durationMinutes} minutes`
      );
      
      console.log('Generated slots:', allSlots);
      
      // Get taken intervals
      const takenIntervals: { start: string; end: string }[] = [];
      
      // Add existing appointments
      if (appointmentsRes?.data) {
        console.log('Processing appointments for date:', dateString);
        appointmentsRes.data.forEach((appt: any) => {
          try {
            const apptDate = new Date(appt.date).toISOString().split('T')[0];
            console.log('Checking appointment:', {
              apptDate,
              selectedDate: dateString,
              matches: apptDate === dateString,
              time_from: appt.time_from,
              time_to: appt.time_to
            });
            
            if (apptDate === dateString && appt.time_from && appt.time_to) {
              console.log('Adding taken interval:', { 
                start: appt.time_from, 
                end: appt.time_to 
              });
              takenIntervals.push({ 
                start: appt.time_from, 
                end: appt.time_to 
              });
            }
          } catch (err) {
            console.error('Error processing appointment:', appt, err);
          }
        });
      }
      
      // Add blocked slots
      if (blockedRes?.data) {
        blockedRes.data.forEach((blk: any) => {
          try {
            if (blk.date === dateString) {
              if (blk.time_from && blk.time_to) {
                takenIntervals.push({ 
                  start: blk.time_from, 
                  end: blk.time_to 
                });
              } else {
                // Whole day blocked
                takenIntervals.push({ start: '00:00', end: '23:59' });
              }
            }
          } catch (err) {
            console.error('Error processing blocked date:', blk, err);
          }
        });
      }
      
      console.log('Taken intervals:', takenIntervals);
      
      console.log('All slots before filtering:', allSlots);
      console.log('Taken intervals to filter:', takenIntervals);
      
      // Filter out slots that overlap with taken intervals
      const availableSlots = allSlots.filter(slot => {
        const isTaken = takenIntervals.some(interval => {
          const overlaps = isTimeOverlap(slot.start, slot.end, interval.start, interval.end);
          if (overlaps) {
            console.log('Slot overlaps with taken interval:', {
              slot: { start: slot.start, end: slot.end },
              interval: { start: interval.start, end: interval.end }
            });
          }
          return overlaps;
        });
        return !isTaken;
      });
      
      console.log('Available slots after filtering:', availableSlots);
      
      setTimeSlots(availableSlots);
      setDebugInfo(`Showing ${availableSlots.length} available time slots`);
      
    } catch (error) {
      console.error('Error in generateTimeSlotsForService:', error);
      toast.error(`Failed to generate time slots: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeSlots([]);
      setDebugInfo(`Error: ${error instanceof Error ? error.message : 'Failed to generate time slots'}`);
    }
  };
  
  // Helper function to check for time slot overlaps
  const isTimeOverlap = (
    start1: string, 
    end1: string, 
    start2: string, 
    end2: string
  ): boolean => {
    const toMinutes = (time: string): number => {
      try {
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          console.error('Invalid time format:', time);
          return 0;
        }
        return hours * 60 + minutes;
      } catch (e) {
        console.error('Error parsing time:', { time, error: e });
        return 0;
      }
    };
    
    const start1Min = toMinutes(start1);
    const end1Min = toMinutes(end1);
    const start2Min = toMinutes(start2);
    const end2Min = toMinutes(end2);
    
    console.log('Checking overlap:', {
      slot1: { start: start1, end: end1 },
      slot2: { start: start2, end: end2 },
      times: { start1Min, end1Min, start2Min, end2Min },
      overlaps: start1Min < end2Min && end1Min > start2Min
    });
    
    return start1Min < end2Min && end1Min > start2Min;
  };
  
  // Generate time slots when dentist or date changes
  useEffect(() => {
    if (selectedDentist && dateString) {
      // If we have a selected service, use its duration, otherwise use default
      const selectedService = invoiceServices.find(
        s => s.service_id.toString() === selectedServiceId
      );
      
      const duration = selectedService?.duration || '30 minutes';
      generateTimeSlotsForService(duration);
    }
  }, [selectedDentist, dateString, selectedServiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate based on appointment type
    if (appointmentType === 'regular') {
      // Validate that a patient was properly selected
      if (!formData.patientId) {
        setPatientValidated(false);
        setPatientErrorMessage('Please select a patient from the dropdown');
        toast.error('Patient selection required');
        return;
      }
    } else {
      // Validate temp patient data - either selected existing or new patient data
      if (selectedTempPatient) {
        // Using existing temp patient - validation passed
      } else if (tempPatientData.name && tempPatientData.phone_number) {
        // Creating new temp patient - validation passed
      } else {
        toast.error('Please select an existing temp patient or provide name and phone number for a new temp patient');
        return;
      }
    }
    
    if (!formData.serviceId || !formData.dentistId || !formData.timeSlot || !dateString) {
      toast.error('Please fill in all required fields (service, dentist, date, and time slot)')
      return
    }

    try {
      setLoading(true)
      const [startTime, endTime] = formData.timeSlot.split(' - ')
      
      if (appointmentType === 'temp') {
        let tempPatientId;
        
        if (selectedTempPatient) {
          // Use existing temp patient
          tempPatientId = selectedTempPatient.temp_patient_id;
        } else {
          // Create new temp patient
          const tempPatientResponse = await apiClient.post(`/temp-patients`, {
            name: tempPatientData.name,
            phone_number: tempPatientData.phone_number,
            email: tempPatientData.email || null
          });

          tempPatientId = tempPatientResponse.data.temp_patient_id;
        }

        // Create appointment with temp patient
        await apiClient.post('/appointments', {
          temp_patient_id: tempPatientId,
          dentist_id: formData.dentistId,
          date: dateString,
          time_from: startTime,
          time_to: endTime,
          note: formData.note,
          status: 'pending',
          payment_status: 'pending',
          invoice_service: formData.serviceId // Use serviceId instead of invoice_service
        });
      } else {
        // Create appointment with regular patient
        await apiClient.post('/appointments', {
          patient_id: formData.patientId,
          dentist_id: formData.dentistId,
          date: dateString,
          time_from: startTime,
          time_to: endTime,
          note: formData.note,
          status: 'confirmed',
          payment_status: 'pending',
          invoice_service: formData.serviceId // Use serviceId instead of invoice_service
        });
      }

      // Reset form with all required fields
      setFormData({
        patientId: '',
        dentistId: selectedSlotInfo?.dentistId || '',
        serviceId: '',
        timeSlot: '',
        note: '',
        invoice_service: ''
      });
      setTempPatientData({
        name: '',
        phone_number: '',
        email: ''
      });
      // Reset temp patient search states
      setSelectedTempPatient(null);
      setTempPatientSearchTerm('');
      setTempPatientSearchResults([]);
      setShowTempPatientDropdown(false);
      setDateString('');
      setSelectedDentist(null);
      setAvailableDentists([]);
      setSelectedServiceId('');
      setDebugInfo('');
      setAppointmentType('regular');

      onOpenChange(false);
      
      // Notify parent component to refresh appointments list
      onAppointmentCreated();
      
      // Show success message
      toast.success(appointmentType === 'temp' ? 'Temp appointment created successfully!' : 'Appointment created successfully!');
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      if (error.response) {
        // Handle specific error cases
        if (error.response.status === 400 || error.response.status === 409) {
          // 400 Bad Request or 409 Conflict - likely a scheduling conflict
          toast.error('Failed to add appointment. Check the date and time', {
            description: 'The selected time slot might be already taken or invalid.',
            duration: 5000,
          });
        } else {
          // Other server errors
          toast.error('Failed to add appointment. Please try again later.');
        }
      } else {
        // Network errors or other issues
        toast.error('Failed to connect to the server. Please check your connection.');
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Reset time slot when dentist changes
    if (field === 'dentistId') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        timeSlot: ''
      }))
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateString(e.target.value)
    // Reset time slot when date changes
    setFormData(prev => ({
      ...prev,
      timeSlot: ''
    }))
  }

  // Get minimum date (today) in YYYY-MM-DD format
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add New Appointment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="grid gap-4 py-4 overflow-y-auto flex-1 pr-2">
            {/* Debug Information - Remove this in production */}
            {debugInfo && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  🔍 Debug: {debugInfo}
                </div>
              </div>
            )}

            {/* Appointment Type Toggle */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Appointment Type
              </Label>
              <div className="col-span-3">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setAppointmentType('regular')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                      appointmentType === 'regular' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Regular Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppointmentType('temp')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                      appointmentType === 'temp' 
                        ? 'bg-white text-gray-900 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Temp Patient
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Patient Input */}
            {appointmentType === 'regular' ? (
              // Regular Patient Search and Selection
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patient" className="text-right">
                  Patient <span className="text-red-500">*</span>
                </Label>
                <div className="relative col-span-3">
                  <input
                    type="text"
                    value={patientSearchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPatientSearchTerm(value);
                      
                      // Reset patientId if the input field is cleared or modified
                      if (!value || (formData.patientId && !value.includes(formData.patientId))) {
                        handleChange('patientId', '');
                        setPatientValidated(false);
                        if (value.length > 0) {
                          setPatientErrorMessage('Please select a patient from the dropdown list');
                        } else {
                          setPatientErrorMessage('');
                        }
                      }
                      
                      searchPatients(value);
                      setShowPatientDropdown(true);
                    }}
                    onFocus={() => {
                      setShowPatientDropdown(true);
                      if (!formData.patientId && patientSearchTerm.length > 0) {
                        setPatientValidated(false);
                        setPatientErrorMessage('Please select a patient from the dropdown list');
                      }
                    }}
                    onBlur={() => setTimeout(() => {
                      setShowPatientDropdown(false);
                      // Check if a valid patient was selected
                      if (!formData.patientId && patientSearchTerm.length > 0) {
                        setPatientValidated(false);
                        setPatientErrorMessage('Please select a patient from the dropdown list');
                      }
                    }, 200)}
                    placeholder="Search by patient name or ID..."
                    className={`w-full px-3 py-2 border ${!patientValidated ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
                  />
                  {showPatientDropdown && patientSearchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {patientSearchResults.map((patient) => (
                        <div
                          key={patient.patient_id}
                          className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-sm text-gray-700"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent onBlur from firing before onClick
                            handleChange('patientId', patient.patient_id);
                            setPatientSearchTerm(`${patient.name} (${patient.patient_id})`);
                            setShowPatientDropdown(false);
                            setPatientValidated(true);
                            setPatientErrorMessage('');
                          }}
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-xs text-gray-500">ID: {patient.patient_id}</div>
                          {patient.email && <div className="text-xs text-gray-500">{patient.email}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                  {!patientValidated && patientErrorMessage && (
                    <div className="text-red-500 text-xs mt-1">{patientErrorMessage}</div>
                  )}
                </div>
              </div>
            ) : (
              // Temp Patient Input Fields
              <>

                {selectedTempPatient ? (
                  // Show selected temp patient info
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Selected Patient</Label>
                    <div className="col-span-3 p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{selectedTempPatient.name}</div>
                      <div className="text-sm text-gray-600">ID: {selectedTempPatient.temp_patient_id}</div>
                      <div className="text-sm text-gray-600">Phone: {selectedTempPatient.phone_number}</div>
                      {selectedTempPatient.email && (
                        <div className="text-sm text-gray-600">Email: {selectedTempPatient.email}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTempPatient(null);
                          setTempPatientSearchTerm('');
                        }}
                        className="text-red-600 hover:text-red-800 text-sm mt-2"
                      >
                        Clear selection
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Search input for existing temp patients */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">
                        Search Temp Patient
                      </Label>
                      <div className="relative col-span-3">
                        <input
                          type="text"
                          value={tempPatientSearchTerm}
                          onChange={(e) => {
                            const value = e.target.value;
                            setTempPatientSearchTerm(value);
                            searchTempPatients(value);
                            setShowTempPatientDropdown(true);
                          }}
                          onFocus={() => setShowTempPatientDropdown(true)}
                          onBlur={() => setTimeout(() => setShowTempPatientDropdown(false), 200)}
                          placeholder="Search by name, phone, or ID..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        {showTempPatientDropdown && tempPatientSearchResults.length > 0 && (
                          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                            {tempPatientSearchResults.map((tempPatient) => (
                              <div
                                key={tempPatient.temp_patient_id}
                                className="cursor-pointer hover:bg-gray-100 px-4 py-2 text-sm text-gray-700"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setSelectedTempPatient(tempPatient);
                                  setTempPatientSearchTerm(`${tempPatient.name} (${tempPatient.temp_patient_id})`);
                                  setShowTempPatientDropdown(false);
                                }}
                              >
                                <div className="font-medium">{tempPatient.name}</div>
                                <div className="text-xs text-gray-500">ID: {tempPatient.temp_patient_id}</div>
                                <div className="text-xs text-gray-500">Phone: {tempPatient.phone_number}</div>
                                {tempPatient.email && <div className="text-xs text-gray-500">{tempPatient.email}</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Separator or form for new temp patient */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="col-span-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 border-b border-gray-300"></div>
                          <span className="text-sm text-gray-500 px-2">OR CREATE NEW</span>
                          <div className="flex-1 border-b border-gray-300"></div>
                        </div>
                      </div>
                    </div>

                    {/* New temp patient form */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tempName" className="text-right">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="tempName"
                        value={tempPatientData.name}
                        onChange={(e) => setTempPatientData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter patient name"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tempPhone" className="text-right">
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="tempPhone"
                        value={tempPatientData.phone_number}
                        onChange={(e) => setTempPatientData(prev => ({ ...prev, phone_number: e.target.value }))}
                        placeholder="Enter phone number"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tempEmail" className="text-right">
                        Email
                      </Label>
                      <Input
                        id="tempEmail"
                        type="email"
                        value={tempPatientData.email}
                        onChange={(e) => setTempPatientData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email (optional)"
                        className="col-span-3"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {/* Service Type Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="serviceType" className="text-right">
                Service <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => {
                  setSelectedServiceId(value);
                  
                  // Find the selected service to get its duration
                  const selectedService = invoiceServices.find(service => 
                    service.service_id.toString() === value
                  );
                  
                  if (selectedService && selectedDentist && dateString) {
                    generateTimeSlotsForService(selectedService.duration);
                  }
                }}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {invoiceServices.map((service) => (
                    <SelectItem key={service.service_id.toString()} value={service.service_id.toString()}>
                      {service.service_name} ({service.duration || '30 mins'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dentist Selection - Dynamic based on selected service */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dentist" className="text-right">
                Dentist <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.dentistId}
                onValueChange={(value) => handleChange('dentistId', value)}
                disabled={!selectedServiceId}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    !selectedServiceId 
                      ? 'Select a service first' 
                      : availableDentists.length === 0 
                        ? 'No dentists available for this service' 
                        : 'Select a dentist'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableDentists.map((dentist) => (
                    <SelectItem key={dentist.dentist_id} value={dentist.dentist_id}>
                      Dr. {dentist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show selected dentist's schedule info */}
            {selectedDentist && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  📋 Schedule: {selectedDentist.work_days_from} to {selectedDentist.work_days_to}, 
                  {selectedDentist.work_time_from} - {selectedDentist.work_time_to}, 
                  {selectedDentist.appointment_duration} slots
                </div>
              </div>
            )}

            {/* Date Picker */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={dateString}
                onChange={handleDateChange}
                min={getMinDate()}
                className="col-span-3"
                required
              />
            </div>

            {/* Show warning if selected date is not a working day */}
            {dateString && selectedDentist && !isWorkingDay(new Date(dateString), selectedDentist) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Selected date is not a working day for this dentist. Working days: {selectedDentist.work_days_from} to {selectedDentist.work_days_to}
                </div>
              </div>
            )}

            {/* Time Slot Selection */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="timeSlot" className="text-right">
                Time Slot <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.timeSlot}
                onValueChange={(value) => handleChange('timeSlot', value)}
                disabled={!formData.dentistId || !dateString || !selectedDentist}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={
                    !formData.dentistId 
                      ? 'Select a dentist first' 
                      : !dateString 
                        ? 'Select a date first' 
                        : !selectedDentist
                          ? 'Loading dentist details...'
                          : timeSlots.length === 0 
                            ? 'No available slots for selected date' 
                            : 'Select a time slot'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot, index) => (
                    <SelectItem key={index} value={`${slot.start} - ${slot.end}`}>
                      {slot.start} - {slot.end}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Show time slots count for debugging */}
            {selectedDentist && dateString && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-4 text-xs text-green-600 bg-green-50 p-2 rounded">
                  🕐 Total time slots: {timeSlots.length} (all slots shown)
                </div>
              </div>
            )}

            {/* Note */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="note" className="text-right mt-2">
                Note (Optional)
              </Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => handleChange('note', e.target.value)}
                className="col-span-3"
                placeholder="Add any additional notes here..."
              />
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button className='bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto' type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}