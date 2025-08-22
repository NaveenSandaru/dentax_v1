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
      <DialogContent className="sm:max-w-[95%] sm:w-[1100px] lg:max-w-[85%] overflow-y-auto max-h-[85vh] w-[95%] max-w-none">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-gray-900">Create Consent Form</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress Steps */}
          <div className="mb-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${true ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs mt-2 text-gray-600 text-center">Details</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-gray-200" />
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${procedureDetails ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs mt-2 text-gray-600 text-center">Procedure</span>
              </div>
              <div className="flex-1 h-0.5 mx-2 sm:mx-4 bg-gray-200" />
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${explanationGiven ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-xs mt-2 text-gray-600 text-center">Risks &amp; Explanation</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
            {/* Left side - Form */}
            <div className="space-y-5">
              <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  Patient &amp; Doctor Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 text-sm">Patient Name</Label>
                    <Input
                      value={selectedPatient?.name || ''}
                      disabled
                      className="mt-1.5 bg-gray-50 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 text-sm">Doctor Name</Label>
                    <Input
                      value={user?.name || ''}
                      disabled
                      className="mt-1.5 bg-gray-50 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  Procedure Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 text-sm">
                      Procedure Description
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      value={procedureDetails}
                      onChange={(e) => setProcedureDetails(e.target.value)}
                      placeholder="Describe the dental procedure in detail..."
                      className="mt-1.5 h-24 sm:h-28 resize-none text-sm"
                      required
                    />
                    <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
                      Include specific details about the procedure, techniques, and materials to be used.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-100 shadow-sm">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  Patient Explanation
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 text-sm">
                      Explanation Given to Patient
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      value={explanationGiven}
                      onChange={(e) => setExplanationGiven(e.target.value)}
                      placeholder="Document the explanation provided to the patient..."
                      className="mt-1.5 h-24 sm:h-28 resize-none text-sm"
                      required
                    />
                    <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
                      Detail the information shared with the patient about benefits, risks, and alternatives.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Consent Information */}
            <div className="space-y-5">
              <div className="bg-blue-50 p-4 sm:p-5 rounded-lg border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">Consent Context</h4>
                    <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">
                      This consent form documents the patient&apos;s agreement to undergo the specified dental procedure
                      after being fully informed of the risks, benefits, and alternatives.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                  Risk Factors
                </h4>
                <div className="space-y-3">
                  {[
                    'Potential complications during or after the procedure',
                    'Possible side effects from anesthesia or medications',
                    'Recovery time and post-procedure care requirements',
                    'Alternative treatment options'
                  ].map((risk, index) => (
                    <div key={index} className="flex items-start gap-2.5 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="mt-1.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      </div>
                      <p className="text-xs sm:text-sm text-gray-700">{risk}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-lg border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                  Requirements Checklist
                </h4>
                <div className="space-y-3">
                  {[
                    'Clear explanation of the procedure',
                    'Documentation of patient understanding',
                    'Patient has had opportunity to ask questions',
                    'All risks have been explained'
                  ].map((requirement, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-xs sm:text-sm text-gray-700">{requirement}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="px-4 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !procedureDetails || !explanationGiven}
              className="bg-emerald-500 hover:bg-emerald-600 px-4 w-full sm:w-auto"
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
