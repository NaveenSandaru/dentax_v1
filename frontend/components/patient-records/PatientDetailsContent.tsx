'use client'

import React, { memo, useRef, useCallback, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PatientDetailsTab from './PatientDetailsTab'
import MedicalHistoryForm from '@/components/medicalhistoryform'
import MedicalReportsTab from './MedicalReportsTab'
import SOAPNotesTab from './SOAPNotesTab'
import ConsentFormsTab from './ConsentFormsTab'

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

interface MedicalReport {
  report_id: number
  patient_id: string
  record_url: string
  record_name?: string
}

interface SOAPNote {
  note_id: number
  patient_id: string
  note: string
  date?: string
}

interface ConsentForm {
  form_id: number;
  patient_id: string;
  dentist_id: string;
  procedure_details: string;
  explanation_given: string;
  sign: string;
  status: string;
  created_date: string;
  signed_date: string;
}

interface PatientDetailsContentProps {
  selectedPatient: Patient | null
  criticalConditions: string[]
  activeTab: string
  onTabChange: (tab: string) => void
  // Medical Reports
  medicalReports: MedicalReport[]
  onUploadReport: () => void
  onDownloadReport: (recordUrl: string) => void
  onDeleteReport: (reportId: number) => void
  deletingReportId: number | null
  // SOAP Notes
  soapNotes: SOAPNote[]
  onAddNote: () => void
  onEditNote: (note: SOAPNote) => void
  onDeleteNote: (noteId: number) => void
  deletingNoteId: number | null
  // Consent Forms
  consentForms: ConsentForm[]
  onCreateForm: () => void
  onSignForm: (formId: string) => void
  onViewForm: (form: ConsentForm) => void
  onDeleteForm: (formId: string) => void
  isDeletingForm: boolean
}

const PatientDetailsContent = memo(({
  selectedPatient,
  criticalConditions,
  activeTab,
  onTabChange,
  medicalReports,
  onUploadReport,
  onDownloadReport,
  onDeleteReport,
  deletingReportId,
  soapNotes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  deletingNoteId,
  consentForms,
  onCreateForm,
  onSignForm,
  onViewForm,
  onDeleteForm,
  isDeletingForm
}: PatientDetailsContentProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tabScrollPositions = useRef<Record<string, number>>({})

  // Save scroll position when tab changes
  const saveScrollPosition = useCallback((currentTab: string) => {
    if (scrollContainerRef.current) {
      tabScrollPositions.current[currentTab] = scrollContainerRef.current.scrollTop
    }
  }, [])

  // Restore scroll position for new tab
  const restoreScrollPosition = useCallback((newTab: string) => {
    if (scrollContainerRef.current) {
      const savedPosition = tabScrollPositions.current[newTab] || 0
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedPosition
        }
      })
    }
  }, [])

  // Enhanced tab change handler that preserves scroll position
  const handleTabChange = useCallback((newTab: string) => {
    saveScrollPosition(activeTab)
    onTabChange(newTab)
    setTimeout(() => restoreScrollPosition(newTab), 0)
  }, [activeTab, onTabChange, saveScrollPosition, restoreScrollPosition])

  // Reset scroll positions when patient changes
  useEffect(() => {
    if (selectedPatient) {
      tabScrollPositions.current = {}
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0
      }
    }
  }, [selectedPatient])

  if (!selectedPatient) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <p className="text-lg">Select a patient to view details</p>
          <p className="text-sm mt-2">Choose a patient from the list to see their medical records</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 h-full overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full h-full flex flex-col"
      >
        {/* Tabs Header */}
        <div className="overflow-x-auto scroll-smooth flex-shrink-0">
          <TabsList className="flex w-max gap-2 mb-4">
            <TabsTrigger value="details" className="flex-1 min-w-[120px]">
              Details
            </TabsTrigger>
            <TabsTrigger value="medical-history" className="flex-1 min-w-[150px]">
              Medical History
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex-1 min-w-[120px]">
              Reports
            </TabsTrigger>
            <TabsTrigger value="soap-notes" className="flex-1 min-w-[120px]">
              SOAP Notes
            </TabsTrigger>
            <TabsTrigger value="consent-forms" className="flex-1 min-w-[150px]">
              Consent Forms
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scrollable Tab Content */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {/* Details Tab */}
          <TabsContent value="details" className="mt-0">
            <PatientDetailsTab 
              patient={selectedPatient} 
              criticalConditions={criticalConditions}
            />
          </TabsContent>

          {/* Medical History Tab */}
          <TabsContent value="medical-history" className="mt-0">
            <MedicalHistoryForm
              patientId={selectedPatient.patient_id}
              onSave={() => {
                // Handle save if needed
              }}
            />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-0">
            <MedicalReportsTab
              medicalReports={medicalReports}
              onUploadReport={onUploadReport}
              onDownloadReport={onDownloadReport}
              onDeleteReport={onDeleteReport}
              deletingReportId={deletingReportId}
            />
          </TabsContent>

          {/* SOAP Notes Tab */}
          <TabsContent value="soap-notes" className="mt-0">
            <SOAPNotesTab
              soapNotes={soapNotes}
              onAddNote={onAddNote}
              onEditNote={onEditNote}
              onDeleteNote={onDeleteNote}
              deletingNoteId={deletingNoteId}
            />
          </TabsContent>

          {/* Consent Forms Tab */}
          <TabsContent value="consent-forms" className="mt-0">
            <ConsentFormsTab
              consentForms={consentForms}
              onCreateForm={onCreateForm}
              onSignForm={onSignForm}
              onViewForm={onViewForm}
              onDeleteForm={onDeleteForm}
              isDeletingForm={isDeletingForm}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
})

PatientDetailsContent.displayName = 'PatientDetailsContent'

export default PatientDetailsContent
