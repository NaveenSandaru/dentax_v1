'use client'

import React, { memo } from 'react'
import { User, Mail, Phone, Calendar, MapPin, CreditCard, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Patient {
  patient_id: string
  name: string
  email: string
  phone_number?: string
  profile_picture?: string
  blood_group?: string
  date_of_birth?: string
  gender?: string
  address?: string
  NIC?: string
}

interface PatientDetailsTabProps {
  patient: Patient
  criticalConditions: string[]
}

const PatientDetailsTab = memo(({ patient, criticalConditions }: PatientDetailsTabProps) => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not provided';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Patient Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient Avatar and Name */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="relative h-16 w-16 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 mx-auto sm:mx-0">
            {patient.profile_picture ? (
              <img
                src={`${backendURL}${patient.profile_picture}`}
                alt={patient.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-medium text-xl">
              {patient.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left w-full sm:w-auto min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{patient.name}</h2>
            <p className="text-sm sm:text-base text-gray-600">Patient ID: {patient.patient_id}</p>
            {criticalConditions.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {criticalConditions.map((condition, index) => (
                    <Badge 
                      key={index} 
                      variant="destructive" 
                      className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm flex items-center gap-1"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span className="truncate max-w-[120px] sm:max-w-none">{condition}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Patient Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start sm:items-center gap-2 text-gray-700 flex-wrap">
              <Mail className="h-4 w-4 text-gray-500 mt-0.5 sm:mt-0 flex-shrink-0" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm break-all">{patient.email}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium">Phone:</span>
              <span className="text-sm">{patient.phone_number || 'Not provided'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium">Date of Birth:</span>
              <span className="text-sm">{formatDate(patient.date_of_birth)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium">Gender:</span>
              <span className="text-sm">{patient.gender || 'Not provided'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <CreditCard className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium">Blood Group:</span>
              <span className="text-sm">{patient.blood_group || 'Not provided'}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-700">
              <CreditCard className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-sm font-medium">NIC:</span>
              <span className="text-sm break-all">{patient.NIC || 'Not provided'}</span>
            </div>
          </div>
        </div>

        {patient.address && (
          <div className="flex items-start gap-2 text-gray-700 pt-2 border-t">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium">Address:</span>
              <p className="text-sm mt-1 break-words">{patient.address}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
})

PatientDetailsTab.displayName = 'PatientDetailsTab'

export default PatientDetailsTab
