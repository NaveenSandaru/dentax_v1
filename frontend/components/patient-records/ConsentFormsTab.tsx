'use client'

import React, { memo } from 'react'
import { Plus, Eye, Trash2, FileSignature, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

interface ConsentFormsTabProps {
  consentForms: ConsentForm[]
  onCreateForm: () => void
  onSignForm: (formId: string) => void
  onViewForm: (form: ConsentForm) => void
  onDeleteForm: (formId: string) => void
  isDeletingForm: boolean
}

const ConsentFormsTab = memo(({ 
  consentForms, 
  onCreateForm, 
  onSignForm, 
  onViewForm, 
  onDeleteForm, 
  isDeletingForm 
}: ConsentFormsTabProps) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  // Sort consent forms: signed forms first, then by date
  const sortedForms = [...consentForms].sort((a, b) => {
    // First sort by signed status
    if (a.status === 'signed' && b.status !== 'signed') return -1;
    if (a.status !== 'signed' && b.status === 'signed') return 1;

    // Then sort by date (newest first)
    const dateA = new Date(a.created_date).getTime();
    const dateB = new Date(b.created_date).getTime();
    return dateB - dateA;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Consent Forms
        </h3>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600"
          size="sm"
          onClick={onCreateForm}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Consent Form
        </Button>
      </div>

      <div className="space-y-4">
        {sortedForms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-white">
              <FileSignature className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No consent forms available</p>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600"
                variant="outline"
                size="sm"
                onClick={onCreateForm}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Consent Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          sortedForms.map((form) => (
            <div
              key={form.form_id}
              className={`bg-white rounded-lg border ${
                form.status === 'signed' ? 'border-emerald-200' : 'border-gray-200'
              } p-6 space-y-4`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Consent Form
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Created on {formatDate(form.created_date)}
                  </p>
                  {form.status === 'signed' && (
                    <p className="text-sm text-emerald-600 mt-1">
                      Signed on {formatDate(form.signed_date)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {form.status === 'signed' ? (
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
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Procedure Details</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                    {form.procedure_details}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Explanation Given</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                    {form.explanation_given}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewForm(form)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteForm(form.form_id.toString())}
                    className="text-red-600 hover:text-red-700"
                    disabled={isDeletingForm}
                  >
                    {isDeletingForm ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent mr-2"></div>
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
                {form.status !== 'signed' && (
                  <Button
                    size="sm"
                    onClick={() => onSignForm(form.form_id.toString())}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    Sign Form
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
})

ConsentFormsTab.displayName = 'ConsentFormsTab'

export default ConsentFormsTab
