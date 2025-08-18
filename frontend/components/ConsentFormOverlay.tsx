'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { User, FileText, AlertCircle, CheckCircle, Plus, FileSignature, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Patient {
  patient_id: string
  name: string
  email: string
  phone_number?: string
  profile_picture?: string
}

interface User {
  id: string
  name: string
  role: string
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

interface ConsentFormOverlayProps {
  isOpen: boolean
  onClose: () => void
  selectedPatient: Patient | null
  user: User | null
  apiClient: any
  backendURL: string
}

// ConsentFormContent component to prevent unnecessary re-renders
const ConsentFormContent = React.memo(({
  selectedPatient,
  user,
  onSubmit,
  onClose,
  submitting
}: {
  selectedPatient: Patient | null,
  user: any,
  onSubmit: (procedureDetails: string, explanationGiven: string) => void,
  onClose: () => void,
  submitting: boolean
}) => {
  const [procedureDetails, setProcedureDetails] = useState('');
  const [explanationGiven, setExplanationGiven] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(procedureDetails, explanationGiven);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${true ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs mt-2 text-gray-600">Details</span>
          </div>
          <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${procedureDetails ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs mt-2 text-gray-600">Procedure</span>
          </div>
          <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${explanationGiven ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xs mt-2 text-gray-600">Risks & Explanation</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left side - Form */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Patient & Doctor Information
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-700">Patient Name</Label>
                <Input
                  value={selectedPatient?.name || ''}
                  disabled
                  className="mt-1.5 bg-gray-50"
                />
              </div>
              <div>
                <Label className="text-gray-700">Doctor/Admin Name</Label>
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
                <Label className="text-gray-700">
                  Procedure Description
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  value={procedureDetails}
                  onChange={(e) => setProcedureDetails(e.target.value)}
                  placeholder="Describe the dental procedure in detail..."
                  className="mt-1.5 h-28 resize-none"
                />
                <p className="text-sm text-gray-500 mt-1.5">
                  Include specific details about the procedure, techniques, and materials to be used.
                </p>
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
                <Label className="text-gray-700">
                  Explanation Given to Patient
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Textarea
                  value={explanationGiven}
                  onChange={(e) => setExplanationGiven(e.target.value)}
                  placeholder="Document the explanation provided to the patient..."
                  className="mt-1.5 h-28 resize-none"
                />
                <p className="text-sm text-gray-500 mt-1.5">
                  Detail the information shared with the patient about benefits, risks, and alternatives.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Consent Information */}
        <div className="space-y-5">
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Consent Context</h4>
                <p className="text-sm text-blue-700 leading-relaxed">
                  This consent form documents the patient's agreement to undergo the specified dental procedure
                  after being fully informed of the risks, benefits, and alternatives.
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
              {[
                'Potential complications during or after the procedure',
                'Possible side effects from anesthesia or medications',
                'Recovery time and post-procedure care requirements',
                'Alternative treatment options'
              ].map((risk, index) => (
                <div key={index} className="flex items-start gap-2.5 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  </div>
                  <p className="text-sm text-gray-700">{risk}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-gray-100">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Requirements Checklist
            </h4>
            <div className="space-y-3">
              {[
                'Clear explanation of the procedure',
                'Documentation of patient understanding',
                'Signature from both patient and doctor',
                'Date of consent'
              ].map((requirement, index) => (
                <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <Checkbox
                    id={`req-${index}`}
                    checked={!!procedureDetails && !!explanationGiven}
                    disabled
                  />
                  <label
                    htmlFor={`req-${index}`}
                    className="text-sm text-gray-700 cursor-pointer select-none"
                  >
                    {requirement}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
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
  );
});

ConsentFormContent.displayName = 'ConsentFormContent';

// SignConsentDialog component
const SignConsentDialog = React.memo(({
  isOpen,
  onClose,
  onSign,
  submitting
}: {
  isOpen: boolean,
  onClose: () => void,
  onSign: (doctorName: string) => void,
  submitting: boolean
}) => {
  const [doctorName, setDoctorName] = useState('');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Sign Consent Form</DialogTitle>
          <DialogDescription>
            Please enter your name to sign this consent form.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Doctor&apos;s/Admin&apos;s Name</Label>
            <Input
              placeholder="Enter your full name"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => onSign(doctorName)}
            disabled={submitting || !doctorName.trim()}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            {submitting ? 'Signing...' : 'Sign Form'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

SignConsentDialog.displayName = 'SignConsentDialog';

// ViewConsentFormDialog component
const ViewConsentFormDialog = React.memo(({
  isOpen,
  onClose,
  form
}: {
  isOpen: boolean,
  onClose: () => void,
  form: any
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Consent Form Details</DialogTitle>
        </DialogHeader>

        {form && (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-between items-center">
              <Badge
                variant={form.status === 'signed' ? 'default' : 'secondary'}
                className={form.status === 'signed' ? 'bg-emerald-100 text-emerald-700' : ''}
              >
                {form.status === 'signed' ? 'Signed' : 'Pending'}
              </Badge>
              <div className="text-sm text-gray-500">
                Created: {formatDate(form.created_date)}
              </div>
            </div>

            {/* Patient & Doctor Info */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Patient Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {form.patient?.name}</p>
                  <p><span className="font-medium">Email:</span> {form.patient?.email}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Doctor Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {form.dentist?.name}</p>
                  <p><span className="font-medium">Email:</span> {form.dentist?.email}</p>
                </div>
              </div>
            </div>

            {/* Procedure Details */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Procedure Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{form.procedure_details}</p>
              </div>
            </div>

            {/* Explanation Given */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Explanation Given to Patient</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700">{form.explanation_given}</p>
              </div>
            </div>

            {/* Signature Info */}
            {form.status === 'signed' && form.sign && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Signature Details</h4>
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p><span className="font-medium">Signed by:</span> {form.sign}</p>
                      <p><span className="font-medium">Date:</span> {formatDate(form.signed_date)}</p>
                    </div>
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

ViewConsentFormDialog.displayName = 'ViewConsentFormDialog';

// ConsentFormsList component
const ConsentFormsList = React.memo(({
  consentForms,
  onSign,
  onView,
  onDelete
}: {
  consentForms: any[],
  onSign: (formId: string) => void,
  onView: (form: any) => void,
  onDelete: (formId: string) => void
}) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
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
    <div className="space-y-4">
      {sortedForms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No consent forms available
        </div>
      ) : (
        sortedForms.map((form) => (
          <div
            key={form.form_id}
            className={`bg-white rounded-lg border ${form.status === 'signed' ? 'border-emerald-200' : 'border-gray-200'
              } p-6 space-y-4`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={form.status === 'signed' ? 'default' : 'secondary'}
                    className={form.status === 'signed' ? 'bg-emerald-100 text-emerald-700' : ''}
                  >
                    {form.status === 'signed' ? 'Signed' : 'Pending'}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Created: {formatDate(form.created_date)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {form.procedure_details}
                </p>
              </div>
              <div className="flex gap-2">
                {form.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => onSign(form.form_id)}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <FileSignature className="h-4 w-4 mr-1" />
                    Sign
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onView(form)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(form.form_id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {form.status === 'signed' && form.signed_date && (
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <p className="text-sm text-emerald-700">
                  Signed by {form.sign} on {formatDate(form.signed_date)}
                </p>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
});

ConsentFormsList.displayName = 'ConsentFormsList';

// Main ConsentFormOverlay component
const ConsentFormOverlay: React.FC<ConsentFormOverlayProps> = ({
  isOpen,
  onClose,
  selectedPatient,
  user,
  apiClient,
  backendURL
}) => {
  const [view, setView] = useState<'list' | 'create' | null>(null);
  const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [signingForm, setSigningForm] = useState(false);
  const [submittingConsentForm, setSubmittingConsentForm] = useState(false);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [isViewFormOpen, setIsViewFormOpen] = useState(false);
  const [isDeletingForm, setIsDeletingForm] = useState(false);

  // Open create form
  const openCreateForm = useCallback(() => {
    setView('create');
  }, []);

  // Close dialog
  const closeDialog = useCallback(() => {
    setView(null);
    onClose();
  }, [onClose]);

  // Fetch consent forms
  const fetchConsentForms = useCallback(async (patientId: string) => {
    try {
      const response = await apiClient.get(`/consent-forms/patient/${patientId}`);
      if (response.status === 200) {
        setConsentForms(response.data);
      }
    } catch (error) {
      console.error('Error fetching consent forms:', error);
      toast.error('Failed to fetch consent forms');
    }
  }, [apiClient]);

  // Handle consent form submit
  const handleConsentFormSubmit = useCallback(async (procedureDetails: string, explanationGiven: string) => {
    if (!selectedPatient || !user?.id) return;

    setSubmittingConsentForm(true);
    try {
      // Use the current user's ID as dentist_id (works for both dentist and admin)
      const response = await apiClient.post(`/consent-forms`, {
        patient_id: selectedPatient.patient_id,
        dentist_id: 'knrsdent001',
        procedure_details: procedureDetails,
        explanation_given: explanationGiven,
        status: 'pending'
      });

      if (response.status === 201) {
        toast.success('Consent form created successfully');
        fetchConsentForms(selectedPatient.patient_id);
        setView('list');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit consent form');
    } finally {
      setSubmittingConsentForm(false);
    }
  }, [selectedPatient, user, apiClient, fetchConsentForms]);

  // Handle form signing
  const handleSignForm = useCallback(async (doctorName: string) => {
    if (!selectedFormId) return;

    setSigningForm(true);
    try {
      const response = await apiClient.put(`/consent-forms/${selectedFormId}`, {
        status: 'signed',
        sign: doctorName,
        signed_date: new Date().toISOString().split('T')[0]
      });

      if (response.status === 200) {
        toast.success('Consent form signed successfully');
        if (selectedPatient) {
          fetchConsentForms(selectedPatient.patient_id);
        }
        setIsSignDialogOpen(false);
      }
    } catch (error) {
      console.error('Error signing consent form:', error);
      toast.error('Failed to sign consent form');
    } finally {
      setSigningForm(false);
      setSelectedFormId(null);
    }
  }, [selectedFormId, apiClient, selectedPatient, fetchConsentForms]);

  // Handle sign button click
  const handleSignClick = useCallback((formId: string) => {
    setSelectedFormId(formId);
    setIsSignDialogOpen(true);
  }, []);

  // Handle view form
  const handleViewForm = useCallback(async (form: any) => {
    try {
      // Fetch complete consent form data including patient details
      const response = await apiClient.get(`/consent-forms/${form.form_id}`);
      if (response.status === 200) {
        setSelectedForm(response.data);
        setIsViewFormOpen(true);
      }
    } catch (error) {
      console.error('Error fetching consent form details:', error);
      toast.error('Failed to fetch consent form details');
      setIsViewFormOpen(false);
    }
  }, [apiClient]);

  // Handle delete form
  const handleDeleteForm = useCallback(async (formId: string) => {
    if (!confirm('Are you sure you want to delete this consent form?')) return;

    setIsDeletingForm(true);
    try {
      const response = await apiClient.delete(`/consent-forms/${formId}`);
      if (response.status === 200) {
        toast.success('Consent form deleted successfully');
        if (selectedPatient) {
          fetchConsentForms(selectedPatient.patient_id);
        }
      }
    } catch (error) {
      console.error('Error deleting consent form:', error);
      toast.error('Failed to delete consent form');
    } finally {
      setIsDeletingForm(false);
    }
  }, [apiClient, selectedPatient, fetchConsentForms]);

  // Fetch consent forms when patient changes
  React.useEffect(() => {
    if (selectedPatient && isOpen) {
      fetchConsentForms(selectedPatient.patient_id);
      setView('list'); // Default to list view
    }
  }, [selectedPatient, isOpen, fetchConsentForms]);

  // Memoize the ConsentFormDialog component
  const ConsentFormDialog = useMemo(() => {
    if (!view) return null;

    return (
      <Dialog open={true} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-[85%] sm:w-[1100px] overflow-y-auto max-h-[85vh]">
          {view === 'create' ? (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-semibold text-gray-900">New Consent Form</DialogTitle>
                <p className="text-sm text-gray-500">Please fill in the details below to create a new consent form.</p>
              </DialogHeader>

              <ConsentFormContent
                selectedPatient={selectedPatient}
                user={user}
                onSubmit={handleConsentFormSubmit}
                onClose={closeDialog}
                submitting={submittingConsentForm}
              />
            </>
          ) : (
            <>
              <DialogHeader className="space-y-3">
                <DialogTitle className="text-2xl font-semibold text-gray-900">Consent Forms</DialogTitle>
                <p className="text-sm text-gray-500">List of consent forms for {selectedPatient?.name}</p>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Consent Forms</h2>
                  <Button
                    onClick={openCreateForm}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Consent Form
                  </Button>
                </div>

                <ConsentFormsList
                  consentForms={consentForms}
                  onSign={handleSignClick}
                  onView={handleViewForm}
                  onDelete={handleDeleteForm}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }, [view, selectedPatient, user, handleConsentFormSubmit, submittingConsentForm, closeDialog, consentForms, handleSignClick, openCreateForm, handleViewForm, handleDeleteForm]);

  return (
    <>
      {ConsentFormDialog}

      {/* Sign Consent Dialog */}
      <SignConsentDialog
        isOpen={isSignDialogOpen}
        onClose={() => {
          setIsSignDialogOpen(false);
          setSelectedFormId(null);
        }}
        onSign={handleSignForm}
        submitting={signingForm}
      />

      {/* View Consent Form Dialog */}
      <ViewConsentFormDialog
        isOpen={isViewFormOpen}
        onClose={() => {
          setIsViewFormOpen(false);
          setSelectedForm(null);
        }}
        form={selectedForm}
      />
    </>
  );
};

export default ConsentFormOverlay;
