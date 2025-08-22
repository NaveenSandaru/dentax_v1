'use client'

import React, { memo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { User, FileText, AlertCircle, CheckCircle, FileSignature } from 'lucide-react'
import { format } from 'date-fns'

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

interface ViewConsentFormDialogProps {
  isOpen: boolean
  onClose: () => void
  form: ConsentForm | null
}

const ViewConsentFormDialog = memo(({
  isOpen,
  onClose,
  form
}: ViewConsentFormDialogProps) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Consent Form - {form?.patient?.name}
          </DialogTitle>
          <DialogDescription className="text-gray-500 mt-1.5">
            Patient ID: {form?.patient_id}
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            {form?.status === 'signed' ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <CheckCircle className="h-3 w-3 mr-1" />
                Signed
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-200 text-orange-600">
                <AlertCircle className="h-3 w-3 mr-1" />
                Pending
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient and Doctor Information */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                Patient &amp; Doctor Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Patient Name</label>
                  <p className="text-gray-900">{form?.patient?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Doctor Name</label>
                  <p className="text-gray-900">{form?.dentist?.name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consent Context */}
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <FileSignature className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Informed Consent</h4>
                <p className="text-blue-700 text-sm mt-1">
                  This form documents that the patient has been informed about the procedure 
                  and understands the risks involved.
                </p>
              </div>
            </div>
          </div>

          {/* Procedure Details */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                Procedure Details
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">{form?.procedure_details}</p>
            </CardContent>
          </Card>

          {/* Risk Areas */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                Risk Areas
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Bleeding and swelling risks explained
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Infection prevention measures discussed
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Post-procedure care instructions provided
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explanation Given */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-500" />
                Explanation Given
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">{form?.explanation_given}</p>
            </CardContent>
          </Card>

          {/* Requirements Checklist */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Requirements Checklist
              </h3>
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
            </CardContent>
          </Card>

          {/* Signature Information */}
          {form?.status === 'signed' && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-emerald-500" />
                  Signature Information
                </h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Signed by:</span> {form.sign}</p>
                  <p><span className="font-medium">Date signed:</span> {formatDate(form.signed_date)}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Metadata */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Form ID: {form?.form_id}</span>
              <span>Created: {formatDate(form?.created_date)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})

ViewConsentFormDialog.displayName = 'ViewConsentFormDialog'

export default ViewConsentFormDialog
