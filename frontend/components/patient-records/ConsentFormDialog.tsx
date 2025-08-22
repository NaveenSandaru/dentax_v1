'use client'

import React, { memo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { User, FileText, AlertCircle, CheckCircle } from 'lucide-react'

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

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface ConsentFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (procedureDetails: string, explanationGiven: string) => void
  selectedPatient: Patient | null
  user: User | null
  submitting: boolean
}

const ConsentFormDialog = memo(({
  isOpen,
  onClose,
  onSubmit,
  selectedPatient,
  user,
  submitting
}: ConsentFormDialogProps) => {
  const [procedureDetails, setProcedureDetails] = useState('')
  const [explanationGiven, setExplanationGiven] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!procedureDetails.trim() || !explanationGiven.trim()) return
    onSubmit(procedureDetails.trim(), explanationGiven.trim())
  }

  const handleClose = () => {
    setProcedureDetails('')
    setExplanationGiven('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[85%] sm:w-[1100px] overflow-y-auto max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Create Consent Form</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${true ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2 text-gray-600">Details</span>
              </div>
              <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${procedureDetails ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2 text-gray-600">Procedure</span>
              </div>
              <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${explanationGiven ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <span className="text-xs mt-2 text-gray-600">Risks &amp; Explanation</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left side - Form */}
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-500" />
                  Patient &amp; Doctor Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Patient Name</Label>
                    <Input
                      value={selectedPatient?.name || ''}
                      disabled
                      className="mt-1.5 bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label>Doctor Name</Label>
                    <Input
                      value={user?.name || ''}
                      disabled
                      className="mt-1.5 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  Procedure Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Procedure Description *</Label>
                    <Textarea
                      value={procedureDetails}
                      onChange={(e) => setProcedureDetails(e.target.value)}
                      placeholder="Describe the dental procedure in detail..."
                      className="mt-1.5 h-28 resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-gray-500" />
                  Patient Explanation
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label>Explanation Given to Patient *</Label>
                    <Textarea
                      value={explanationGiven}
                      onChange={(e) => setExplanationGiven(e.target.value)}
                      placeholder="Describe the explanation given to the patient about risks, benefits, and alternatives..."
                      className="mt-1.5 h-28 resize-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Consent Information */}
            <div className="space-y-5">
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Informed Consent Process</h4>
                    <p className="text-blue-700 text-sm mt-1">
                      This form ensures that the patient has been properly informed about the procedure 
                      and understands all associated risks and benefits.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Risk Factors
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Bleeding and swelling risks
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Infection prevention measures
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Post-procedure care instructions
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  Requirements Checklist
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Patient understands the procedure
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    All risks have been explained
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Patient has had opportunity to ask questions
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !procedureDetails || !explanationGiven}
              className="bg-emerald-500 hover:bg-emerald-600 px-4"
            >
              {submitting ? 'Submitting...' : 'Submit Consent Form'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})

ConsentFormDialog.displayName = 'ConsentFormDialog'

export default ConsentFormDialog
