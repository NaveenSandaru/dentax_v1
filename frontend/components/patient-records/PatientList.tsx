'use client'

import React, { memo } from 'react'
import { Search, AlertTriangle, X, Activity, FileText, Eye } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

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

interface CriticalCondition {
  patientId: string;
  conditions: string[];
}

interface MedicalHistory {
  patient_id: string
  medical_question_id: number
  medical_question_answer: string
  question: { question_id: string, question: string }
}

interface MedicalReport {
  report_id: number
  patient_id: string
  record_url: string
  record_name?: string
}

interface PatientListProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  patients: Patient[]
  criticalConditions: CriticalCondition[]
  selectedPatient: Patient | null
  onPatientSelect: (patient: Patient) => void
  loadingPatients: boolean
  medicalHistory?: MedicalHistory[]
  medicalReports?: MedicalReport[]
  onDetailsOverlay?: () => void
}

const PatientList = memo(({ 
  searchTerm, 
  setSearchTerm, 
  patients, 
  criticalConditions,
  selectedPatient,
  onPatientSelect,
  loadingPatients,
  medicalHistory = [],
  medicalReports = [],
  onDetailsOverlay
}: PatientListProps) => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPatientCriticalConditions = (patientId: string): string[] => {
    const patientCondition = criticalConditions.find(c => c.patientId === patientId);
    return patientCondition?.conditions || [];
  };

  return (
    <div className="w-full lg:w-96 bg-emerald-50 border rounded-3xl border-emerald-200 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-emerald-200 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-8"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2">
          {loadingPatients ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No patients found
            </div>
          ) : (
            filteredPatients.map((patient) => {
              const criticalConditionsList = getPatientCriticalConditions(patient.patient_id);
              const isSelected = selectedPatient?.patient_id === patient.patient_id;
              
              return (
                <Card
                  key={patient.patient_id}
                  className={`mb-2 cursor-pointer transition-colors hover:bg-gray-50 ${
                    isSelected ? 'ring-2 ring-emerald-500' : ''
                  }`}
                  onClick={() => onPatientSelect(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
                        {patient.profile_picture ? (
                          <img
                            src={`${backendURL}${patient.profile_picture}`}
                            alt={patient.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-100 text-blue-700 font-medium text-sm">
                          {patient.name
                            ? patient.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                            : '?'}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{patient.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {patient.blood_group && (
                            <Badge variant="secondary" className="text-xs">
                              {patient.blood_group}
                            </Badge>
                          )}
                          {/* Display critical conditions warning */}
                          {criticalConditionsList.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200 hover:bg-red-100">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Critical Condition
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="bg-white p-3 shadow-lg border border-gray-200 rounded-lg max-w-xs">
                                  <div className="space-y-2">
                                    <p className="font-medium text-red-700">Critical Medical Conditions:</p>
                                    <ul className="list-disc pl-4 text-sm text-gray-700">
                                      {criticalConditionsList.map((condition, idx) => (
                                        <li key={idx}>{condition}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {medicalHistory.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              History
                            </Badge>
                          )}
                          
                          {medicalReports.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Reports
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        {/* An overlay will appear */}
                        <Button
                          variant="ghost"
                          className='h-10 w-10 cursor-pointer'
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedPatient?.patient_id !== patient.patient_id) {
                              onPatientSelect(patient);
                            }
                            if (onDetailsOverlay) {
                              onDetailsOverlay();
                            }
                          }}
                        >
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
})

PatientList.displayName = 'PatientList'

export default PatientList
