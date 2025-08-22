'use client'

import React, { useState, useEffect, useContext, useCallback } from 'react'
import { ArrowLeft, X, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthContext } from '@/context/auth-context'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Import patient record components directly
import PatientList from '@/components/patient-records/PatientList'
import PatientDetailsContent from '@/components/patient-records/PatientDetailsContent'
import SOAPNoteDialog from '@/components/patient-records/SOAPNoteDialog'
import UploadReportDialog from '@/components/patient-records/UploadReportDialog'
import SignConsentDialog from '@/components/patient-records/SignConsentDialog'
import ViewConsentFormDialog from '@/components/patient-records/ViewConsentFormDialog'
import ConsentFormDialog from '@/components/patient-records/ConsentFormDialog'

// Types defined inline
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

interface SOAPNote {
  note_id: number
  patient_id: string
  note: string
  date?: string
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

interface CriticalCondition {
  patientId: string;
  conditions: string[];
}

export default function DentistDashboard() {
  const router = useRouter()
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL
  const { user, isLoadingAuth, isLoggedIn, apiClient } = useContext(AuthContext)

  // Core state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [activeTab, setActiveTab] = useState('details')
  const [isMobileOverlayOpen, setIsMobileOverlayOpen] = useState(false)
  const [isDetailsOverlayOpen, setIsDetailsOverlayOpen] = useState(false)

  // Data state
  const [fetchedPatients, setFetchedPatients] = useState<Patient[]>([])
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([])
  const [medicalReport, setMedicalReport] = useState<MedicalReport[]>([])
  const [soapNote, setSoapNote] = useState<SOAPNote[]>([])
  const [consentForms, setConsentForms] = useState<ConsentForm[]>([])
  const [criticalConditions, setCriticalConditions] = useState<CriticalCondition[]>([])

  // Loading states
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false)

  // Dialog states
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false)
  const [isUploadReportDialogOpen, setIsUploadReportDialogOpen] = useState(false)
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false)
  const [isViewFormOpen, setIsViewFormOpen] = useState(false)
  const [isConsentFormDialogOpen, setIsConsentFormDialogOpen] = useState(false)

  // Action states
  const [isSubmittingNote, setIsSubmittingNote] = useState(false)
  const [isUploadingReport, setIsUploadingReport] = useState(false)
  const [signingForm, setSigningForm] = useState(false)
  const [submittingConsentForm, setSubmittingConsentForm] = useState(false)
  const [isDeletingForm, setIsDeletingForm] = useState(false)
  const [editingNote, setEditingNote] = useState<SOAPNote | null>(null)
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null)
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null)
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)
  const [selectedForm, setSelectedForm] = useState<ConsentForm | null>(null)

  // Fetch functions
  const fetchPatientCriticalConditions = useCallback(async (patient_id: string) => {
    try {
      const response = await apiClient.get(`/medical-history/${patient_id}`)

      if (response.status === 200) {
        const criticalConditionsList: string[] = []
        response.data.forEach((item: MedicalHistory) => {
          if (item.medical_question_answer === 'Yes') {
            if (item.question.question.includes('heart disease')) {
              criticalConditionsList.push('Heart Disease')
            } else if (item.question.question.includes('diabetes')) {
              criticalConditionsList.push('Diabetes')
            } else if (item.question.question.includes('kidney disease')) {
              criticalConditionsList.push('Kidney Disease')
            } else if (item.question.question.includes('liver disease')) {
              criticalConditionsList.push('Liver Disease')
            } else if (item.question.question.includes('blood disorder')) {
              criticalConditionsList.push('Blood Disorder')
            } else if (item.question.question.includes('hypertension')) {
              criticalConditionsList.push('Hypertension')
            }
          }
        })

        if (criticalConditionsList.length > 0) {
          setCriticalConditions(prev => {
            const filtered = prev.filter(c => c.patientId !== patient_id)
            return [...filtered, { patientId: patient_id, conditions: criticalConditionsList }]
          })
        } else {
          setCriticalConditions(prev => prev.filter(c => c.patientId !== patient_id))
        }
      }
    } catch (error) {
      console.error('Error fetching critical conditions:', error)
    }
  }, [apiClient])

  const fetchPatients = useCallback(async () => {
    setLoadingPatients(true)
    try {
      const response = await apiClient.get(`/appointments/fordentist/patients/${user?.id}`)
      if (response.status === 500) {
        throw new Error("Internal Server Error")
      }
      setFetchedPatients(response.data)

      // Fetch critical conditions for all patients
      for (const patient of response.data) {
        fetchPatientCriticalConditions(patient.patient_id)
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    } finally {
      setLoadingPatients(false)
    }
  }, [apiClient, user?.id, fetchPatientCriticalConditions])

  const fetchPatientMedicalHistory = useCallback(async (patient_id: string) => {
    setLoadingMedicalHistory(true)
    try {
      const response = await apiClient.get(`/medical-history/${patient_id}`)
      if (response.status === 500) {
        throw new Error("Internal Server Error")
      }
      setMedicalHistory(response.data)
      fetchPatientCriticalConditions(patient_id)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    } finally {
      setLoadingMedicalHistory(false)
    }
  }, [apiClient, fetchPatientCriticalConditions])

  const fetchPatientMedicalReports = useCallback(async (patient_id: string) => {
    try {
      const response = await apiClient.get(`/medical-reports/forpatient/${patient_id}`)
      if (response.status === 500) {
        throw new Error("Internal Server Error")
      }
      setMedicalReport(response.data)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    }
  }, [apiClient])

  const fetchPatientSOAPNotes = useCallback(async (patient_id: string) => {
    try {
      const response = await apiClient.get(`/soap-notes/forpatient/${patient_id}`)
      if (response.status === 500) {
        throw new Error("Internal Server Error")
      }
      setSoapNote(response.data)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    }
  }, [apiClient])

  const fetchConsentForms = useCallback(async (patientId: string) => {
    try {
      const response = await apiClient.get(`/consent-forms/patient/${patientId}`)
      if (response.status === 200) {
        setConsentForms(response.data)
      }
    } catch (error) {
      console.error('Error fetching consent forms:', error)
      toast.error('Failed to fetch consent forms')
    }
  }, [apiClient])

  // Handler functions
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsMobileOverlayOpen(true)
    setActiveTab('details')
    
    // Fetch patient data
    fetchPatientMedicalHistory(patient.patient_id)
    fetchPatientMedicalReports(patient.patient_id)
    fetchPatientSOAPNotes(patient.patient_id)
    fetchConsentForms(patient.patient_id)
  }

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
  }

  // SOAP Notes handlers
  const handleAddNote = () => {
    setEditingNote(null)
    setIsAddNoteDialogOpen(true)
  }

  const handleEditNote = (note: SOAPNote) => {
    setEditingNote(note)
    setIsAddNoteDialogOpen(true)
  }

  const handleSubmitNote = async (noteText: string) => {
    if (!selectedPatient) return

    setIsSubmittingNote(true)
    try {
      if (editingNote) {
        await apiClient.put(`/soap-notes/${editingNote.note_id}`, {
          dentist_id: user?.id,
          patient_id: selectedPatient.patient_id,
          note: noteText,
        })
        toast.success('Note updated successfully')
      } else {
        await apiClient.post(`/soap-notes`, {
          dentist_id: user?.id,
          patient_id: selectedPatient.patient_id,
          note: noteText,
        })
        toast.success('Note added successfully')
      }

      await fetchPatientSOAPNotes(selectedPatient.patient_id)
      setIsAddNoteDialogOpen(false)
      setEditingNote(null)
    } catch (err: unknown) {
      const error = err as Error & { response?: { data?: { error?: string } } }
      toast.error(error.response?.data?.error || error.message || 'Failed to save note')
    } finally {
      setIsSubmittingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: number) => {
    if (!selectedPatient || !confirm('Are you sure you want to delete this note?')) return

    setDeletingNoteId(noteId)
    try {
      await apiClient.delete(`/soap-notes/${noteId}`)
      await fetchPatientSOAPNotes(selectedPatient.patient_id)
      toast.success('Note deleted successfully')
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || 'Failed to delete note')
    } finally {
      setDeletingNoteId(null)
    }
  }

  // Medical Reports handlers
  const handleUploadReport = () => {
    setIsUploadReportDialogOpen(true)
  }

  const handleSubmitReport = async (file: File, reportName: string) => {
    if (!selectedPatient) return

    setIsUploadingReport(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const responseurl = await apiClient.post(`/files`, formData, {
        withCredentials: true,
      })

      if (responseurl.status !== 201) {
        throw new Error("Error Uploading File")
      }

      const response = await apiClient.post(`/medical-reports`, {
        patient_id: selectedPatient.patient_id,
        record_url: responseurl.data.url,
        record_name: reportName
      })

      if (response.status !== 201) {
        throw new Error("Error Creating Record")
      }

      await fetchPatientMedicalReports(selectedPatient.patient_id)
      toast.success('Report uploaded successfully')
      setIsUploadReportDialogOpen(false)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message)
    } finally {
      setIsUploadingReport(false)
    }
  }

  const handleFileDownload = async (record_url: string) => {
    try {
      const fileUrl = `${backendURL}${record_url}`
      const link = document.createElement('a')
      link.href = fileUrl
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Error downloading file')
    }
  }

  const handleDeleteReport = async (reportId: number) => {
    if (!selectedPatient || !confirm('Are you sure you want to delete this report? This action cannot be undone.')) return

    setDeletingReportId(reportId)
    try {
      await apiClient.delete(`/medical-reports/${reportId}`)
      await fetchPatientMedicalReports(selectedPatient.patient_id)
      toast.success('Report deleted successfully')
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || 'Failed to delete report')
    } finally {
      setDeletingReportId(null)
    }
  }

  // Consent Forms handlers
  const handleCreateConsentForm = () => {
    setIsConsentFormDialogOpen(true)
  }

  const handleSubmitConsentForm = async (procedureDetails: string, explanationGiven: string) => {
    if (!selectedPatient || !user?.id) return

    setSubmittingConsentForm(true)
    try {
      const response = await apiClient.post(`/consent-forms`, {
        patient_id: selectedPatient.patient_id,
        dentist_id: user.id,
        procedure_details: procedureDetails,
        explanation_given: explanationGiven,
        status: 'pending'
      })

      if (response.status === 201) {
        toast.success('Consent form submitted successfully')
        await fetchConsentForms(selectedPatient.patient_id)
        setIsConsentFormDialogOpen(false)
      }
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message || 'Failed to submit consent form')
    } finally {
      setSubmittingConsentForm(false)
    }
  }

  const handleSignForm = async (doctorName: string) => {
    if (!selectedFormId) return

    setSigningForm(true)
    try {
      const response = await apiClient.put(`/consent-forms/${selectedFormId}`, {
        status: 'signed',
        sign: doctorName,
        signed_date: new Date().toISOString().split('T')[0]
      })

      if (response.status === 200) {
        toast.success('Consent form signed successfully')
        if (selectedPatient) {
          await fetchConsentForms(selectedPatient.patient_id)
        }
        setIsSignDialogOpen(false)
      }
    } catch (error) {
      console.error('Error signing consent form:', error)
      toast.error('Failed to sign consent form')
    } finally {
      setSigningForm(false)
      setSelectedFormId(null)
    }
  }

  const handleSignClick = (formId: string) => {
    setSelectedFormId(formId)
    setIsSignDialogOpen(true)
  }

  const handleViewForm = async (form: ConsentForm) => {
    try {
      const response = await apiClient.get(`/consent-forms/${form.form_id}`)
      if (response.status === 200) {
        setSelectedForm(response.data)
        setIsViewFormOpen(true)
      }
    } catch (error) {
      console.error('Error fetching consent form details:', error)
      toast.error('Failed to fetch consent form details')
    }
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this consent form?')) return

    setIsDeletingForm(true)
    try {
      const response = await apiClient.delete(`/consent-forms/${formId}`)
      if (response.status === 200) {
        toast.success('Consent form deleted successfully')
        if (selectedPatient) {
          await fetchConsentForms(selectedPatient.patient_id)
        }
      }
    } catch (error) {
      console.error('Error deleting consent form:', error)
      toast.error('Failed to delete consent form')
    } finally {
      setIsDeletingForm(false)
    }
  }

  // Helper function
  const getPatientCriticalConditions = (patientId: string): string[] => {
    const patientCondition = criticalConditions.find(c => c.patientId === patientId)
    return patientCondition?.conditions || []
  }

  // Effects
  useEffect(() => {
    if (selectedPatient) {
      fetchPatientMedicalHistory(selectedPatient.patient_id)
      fetchPatientMedicalReports(selectedPatient.patient_id)
      fetchPatientSOAPNotes(selectedPatient.patient_id)
      fetchConsentForms(selectedPatient.patient_id)
    } else {
      setMedicalHistory([])
      setMedicalReport([])
      setSoapNote([])
      setConsentForms([])
    }
  }, [selectedPatient, fetchConsentForms, fetchPatientMedicalHistory, fetchPatientMedicalReports, fetchPatientSOAPNotes])

  useEffect(() => {
    if (!user) return
    fetchPatients()
  }, [user, fetchPatients])

  useEffect(() => {
    if (isLoadingAuth) return
    if (!isLoggedIn) {
      toast.error("Login Error", { description: "Please Login" })
      router.push("/login")
    } else if (user.role !== "dentist") {
      toast.error("Access Denied", { description: "You do not have dentist privileges" })
      router.push("/login")
    }
  }, [isLoadingAuth, isLoggedIn, user, router])

  return (
    <div className="h-screen bg-gray-100">
      {/* Details Overlay */}
      {isDetailsOverlayOpen && selectedPatient && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-semibold">Patient Details</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDetailsOverlayOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <PatientDetailsContent
              selectedPatient={selectedPatient}
              criticalConditions={getPatientCriticalConditions(selectedPatient.patient_id)}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              medicalReports={medicalReport}
              onUploadReport={handleUploadReport}
              onDownloadReport={handleFileDownload}
              onDeleteReport={handleDeleteReport}
              deletingReportId={deletingReportId}
              soapNotes={soapNote}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              deletingNoteId={deletingNoteId}
              consentForms={consentForms}
              onCreateForm={handleCreateConsentForm}
              onSignForm={handleSignClick}
              onViewForm={handleViewForm}
              onDeleteForm={handleDeleteForm}
              isDeletingForm={isDeletingForm}
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 p-4 gap-4 overflow-hidden">
        {/* Patient List */}
        <div className={`${isMobileOverlayOpen ? 'hidden' : 'flex'} lg:flex`}>
          <PatientList
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            patients={fetchedPatients}
            criticalConditions={criticalConditions}
            selectedPatient={selectedPatient}
            onPatientSelect={handlePatientSelect}
            loadingPatients={loadingPatients}
            medicalHistory={medicalHistory}
            medicalReports={medicalReport}
            onDetailsOverlay={() => setIsDetailsOverlayOpen(true)}
          />
        </div>

        {/* Desktop Main Content */}
        <div className={`${isMobileOverlayOpen ? 'hidden' : 'hidden'} lg:flex flex-1 overflow-hidden`}>
          {selectedPatient ? (
            <div className="w-full">
              <PatientDetailsContent
                selectedPatient={selectedPatient}
                criticalConditions={getPatientCriticalConditions(selectedPatient.patient_id)}
                activeTab={activeTab}
                onTabChange={handleTabChange}
                medicalReports={medicalReport}
                onUploadReport={handleUploadReport}
                onDownloadReport={handleFileDownload}
                onDeleteReport={handleDeleteReport}
                deletingReportId={deletingReportId}
                soapNotes={soapNote}
                onAddNote={handleAddNote}
                onEditNote={handleEditNote}
                onDeleteNote={handleDeleteNote}
                deletingNoteId={deletingNoteId}
                consentForms={consentForms}
                onCreateForm={handleCreateConsentForm}
                onSignForm={handleSignClick}
                onViewForm={handleViewForm}
                onDeleteForm={handleDeleteForm}
                isDeletingForm={isDeletingForm}
              />
            </div>
          ) : (
            <div className="w-full flex items-center justify-center">
              <div className="text-center">
                <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Patient</h3>
                <p className="text-gray-500">Choose a patient from the list to view their details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileOverlayOpen && selectedPatient && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileOverlayOpen(false)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Patients
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileOverlayOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <PatientDetailsContent
              selectedPatient={selectedPatient}
              criticalConditions={getPatientCriticalConditions(selectedPatient.patient_id)}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              medicalReports={medicalReport}
              onUploadReport={handleUploadReport}
              onDownloadReport={handleFileDownload}
              onDeleteReport={handleDeleteReport}
              deletingReportId={deletingReportId}
              soapNotes={soapNote}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              deletingNoteId={deletingNoteId}
              consentForms={consentForms}
              onCreateForm={handleCreateConsentForm}
              onSignForm={handleSignClick}
              onViewForm={handleViewForm}
              onDeleteForm={handleDeleteForm}
              isDeletingForm={isDeletingForm}
            />
          </div>
        </div>
      )}

      {/* Desktop Patient Details */}
      {!isMobileOverlayOpen && selectedPatient && !isDetailsOverlayOpen && (
        <div className="hidden lg:block fixed inset-y-0 right-0 w-2/3 bg-white border-l border-gray-200 z-40">
          <div className="h-full p-6 overflow-auto">
            <PatientDetailsContent
              selectedPatient={selectedPatient}
              criticalConditions={getPatientCriticalConditions(selectedPatient.patient_id)}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              medicalReports={medicalReport}
              onUploadReport={handleUploadReport}
              onDownloadReport={handleFileDownload}
              onDeleteReport={handleDeleteReport}
              deletingReportId={deletingReportId}
              soapNotes={soapNote}
              onAddNote={handleAddNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              deletingNoteId={deletingNoteId}
              consentForms={consentForms}
              onCreateForm={handleCreateConsentForm}
              onSignForm={handleSignClick}
              onViewForm={handleViewForm}
              onDeleteForm={handleDeleteForm}
              isDeletingForm={isDeletingForm}
            />
          </div>
        </div>
      )}

      {/* Dialogs */}
      <SOAPNoteDialog
        isOpen={isAddNoteDialogOpen}
        onClose={() => {
          setIsAddNoteDialogOpen(false)
          setEditingNote(null)
        }}
        onSubmit={handleSubmitNote}
        editingNote={editingNote}
        submitting={isSubmittingNote}
      />

      <UploadReportDialog
        isOpen={isUploadReportDialogOpen}
        onClose={() => setIsUploadReportDialogOpen(false)}
        onSubmit={handleSubmitReport}
        submitting={isUploadingReport}
      />

      <ConsentFormDialog
        isOpen={isConsentFormDialogOpen}
        onClose={() => setIsConsentFormDialogOpen(false)}
        onSubmit={handleSubmitConsentForm}
        selectedPatient={selectedPatient}
        user={user}
        submitting={submittingConsentForm}
      />

      <SignConsentDialog
        isOpen={isSignDialogOpen}
        onClose={() => {
          setIsSignDialogOpen(false)
          setSelectedFormId(null)
        }}
        onSign={handleSignForm}
        submitting={signingForm}
      />

      <ViewConsentFormDialog
        isOpen={isViewFormOpen}
        onClose={() => {
          setIsViewFormOpen(false)
          setSelectedForm(null)
        }}
        form={selectedForm}
      />

    </div>
  )
}
