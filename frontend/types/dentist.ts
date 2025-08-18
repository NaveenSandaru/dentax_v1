export interface Dentist {
  dentist_id: string
  password: string
  name: string
  profile_picture?: string
  email: string
  phone_number?: string
  language?: string
  service_types?: string
  work_days_from?: string
  work_days_to?: string
  work_time_from?: string
  work_time_to?: string
  appointment_duration?: string
  appointment_fee?: number
}

export interface InvoiceService {
  service_id: string
  service_name: string
  amount: string
  // Add other fields as needed
}

export interface Appointment {
  appointment_id: string
  dentist_id: string
  patient: {name: string}
  note: string
  date: string
  time_from: string
  time_to: string
  status: string
  room_id?: string
  invoice_services?: InvoiceService
  temp_patient?: {
    name: string
    email: string
    phone_number: string
  }
  payment_status?: string
}

export interface Room {
  room_id: string
  description: string
}

export interface RoomAssignment {
  room_id: string
  dentist_id: string
  date: string
  time_from: string
  time_to: string
}

export interface TimeSlot {
  time: string
  dentist_id: string
}

export interface DayOfWeek {
  name: string
  date: string
  dayIndex: number
}
