"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  X,
  Phone,
  Mail,
  FileText,
  Upload,
  Download,
  Plus,
  AlertTriangle,
  User,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import MedicalHistoryForm from "@/components/medicalhistoryform";
import type { AxiosInstance } from "axios";

interface MedicalHistory {
  id: number;
  condition: string;
  date: string;
  notes?: string;
}

interface Patient {
  patient_id: string;
  hospital_patient_id: string;
  name: string;
  email: string;
  phone_number: string;
  address: string;
  nic: string;
  blood_group: string;
  date_of_birth: string;
  gender: string;
  password: string;
  profile_picture: string;
}

interface SOAPNote {
  note_id: number;
  patient_id: string;
  note: string;
  date?: string;
}

interface MedicalReport {
  report_id: number;
  patient_id: string;
  record_url: string;
  record_name?: string;
}

interface CriticalCondition {
  patientId: string;
  conditions: string[];
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
  patient?: {
    name: string;
    email: string;
  };
  dentist?: {
    name: string;
    email: string;
  };
}

interface PatientDetailsOverlayProps {
  selectedPatient: Patient;
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  medicalHistory?: MedicalHistory[];
  medicalReports: MedicalReport[];
  soapNotes: SOAPNote[];
  criticalConditions: CriticalCondition[];
  consentForms?: ConsentForm[];
  loadingMedicalHistory?: boolean;
  onRefreshMedicalHistory: (patientId: string) => void;
  onRefreshMedicalReports: (patientId: string) => void;
  onRefreshSOAPNotes: (patientId: string) => void;
  onRefreshConsentForms?: (patientId: string) => void;
  user?: { id: string; name: string; role: string }; // Add user prop
  apiClient: {
    post: (
      url: string,
      data?: unknown,
      config?: unknown
    ) => Promise<{ status: number; data?: unknown }>;
    put: (
      url: string,
      data?: unknown
    ) => Promise<{ status: number; data?: unknown }>;
    delete: (url: string) => Promise<{ status: number; data?: unknown }>;
  };
  backendURL: string;
}

const PatientDetailsOverlay: React.FC<PatientDetailsOverlayProps> = ({
  selectedPatient,
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  medicalReports,
  soapNotes,
  criticalConditions,
  consentForms = [],
  loadingMedicalHistory = false,
  onRefreshMedicalHistory,
  onRefreshMedicalReports,
  onRefreshSOAPNotes,
  onRefreshConsentForms,
  user,
  apiClient,
  backendURL,
}) => {
  const [isAddNoteDialogOpen, setIsAddNoteDialogOpen] = useState(false);
  const [isUploadReportDialogOpen, setIsUploadReportDialogOpen] =
    useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNote, setEditingNote] = useState<SOAPNote | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [isDeletingNote, setIsDeletingNote] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<null | number>(null);
  const [isDeleteNoteDialogOpen, setIsDeleteNoteDialogOpen] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<null | number>(null);
  const [isDeleteReportDialogOpen, setIsDeleteReportDialogOpen] =
    useState(false);
  const [consentFormToDelete, setConsentFormToDelete] = useState<null | string>(
    null
  );
  const [isDeleteConsentFormDialogOpen, setIsDeleteConsentFormDialogOpen] =
    useState(false);
  const [isSubmittingConsentForm, setIsSubmittingConsentForm] = useState(false);
  const [newConsentFormData, setNewConsentFormData] = useState({
    procedureDetails: "",
    explanationGiven: "",
  });

  // ConsentFormOverlay integration states
  const [consentFormView, setConsentFormView] = useState<"list" | "create">(
    "list"
  );
  const [selectedForm, setSelectedForm] = useState<ConsentForm | null>(null);
  const [isViewFormOpen, setIsViewFormOpen] = useState(false);
  const [showReadOnlyView, setShowReadOnlyView] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false);
  const [pendingSignFormId, setPendingSignFormId] = useState<string | null>(
    null
  );
  const [signerName, setSignerName] = useState<string>(user?.name || "");

  // Question field mapping for user-friendly labels
  const questionFieldMap: Record<string, string> = {
    "Do you have any heart disease?": "Heart Disease",
    "Do you have diabetes?": "Diabetes",
    "Do you have hypertension?": "Hypertension",
    "Do you have asthma?": "Asthma",
    "Do you have any kidney disease?": "Kidney Disease",
    "Do you have any liver disease?": "Liver Disease",
    "Do you have any blood disorders?": "Blood Disorders",
    "Are you pregnant?": "Pregnancy",
    "What is your smoking status?": "Smoking Status",
    "What is your alcohol consumption?": "Alcohol Consumption",
    "When was your last dental visit?": "Last Dental Visit",
    "Do you have any dental concerns?": "Dental Concerns",
    "Do you have any medication allergies?": "Medication Allergies",
    "Family medical history": "Family Medical History",
    "Additional notes": "Additional Notes",
  };

  // Helper function to get user-friendly condition labels
  const getConditionLabel = (condition: string): string => {
    return questionFieldMap[condition] || condition;
  };

  // Helper function to get critical conditions for a patient
  const getPatientCriticalConditions = (patientId: string): string[] => {
    const patientCondition = criticalConditions.find(
      (c) => c.patientId === patientId
    );
    return patientCondition?.conditions || [];
  };

  // Add SOAP Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const endpoint = editingNote
        ? `/soap-notes/${editingNote.note_id}`
        : `/soap-notes`;
      const method = editingNote ? "put" : "post";

      const response = await apiClient[method](endpoint, {
        patient_id: selectedPatient.patient_id,
        note: newNoteText,
      });

      if (response.status === 201 || response.status === 200) {
        toast.success(
          editingNote
            ? "SOAP note updated successfully"
            : "SOAP note added successfully"
        );
        setNewNoteText("");
        setEditingNote(null);
        setIsAddNoteDialogOpen(false);
        onRefreshSOAPNotes(selectedPatient.patient_id);
      }
    } catch {
      toast.error(
        editingNote ? "Failed to update SOAP note" : "Failed to add SOAP note"
      );
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Edit SOAP Note
  const handleEditNote = (note: SOAPNote) => {
    setEditingNote(note);
    setNewNoteText(note.note);
    setIsAddNoteDialogOpen(true);
  };

  // Delete SOAP Note
  const handleDeleteNote = (noteId: number) => {
    setNoteToDelete(noteId);
    setIsDeleteNoteDialogOpen(true);
  };

  const confirmDeleteNote = async () => {
    if (noteToDelete == null) return;
    setIsDeletingNote(true);
    try {
      const response = await apiClient.delete(`/soap-notes/${noteToDelete}`);
      if (response.status === 200) {
        toast.success("SOAP note deleted successfully");
        onRefreshSOAPNotes(selectedPatient.patient_id);
      }
    } catch {
      toast.error("Failed to delete SOAP note");
    } finally {
      setIsDeletingNote(false);
      setIsDeleteNoteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  // Delete Medical Report
  const handleDeleteReport = (reportId: number) => {
    setReportToDelete(reportId);
    setIsDeleteReportDialogOpen(true);
  };

  const confirmDeleteReport = async () => {
    if (reportToDelete == null) return;
    setIsDeletingReport(true);
    try {
      const response = await apiClient.delete(
        `/medical-reports/${reportToDelete}`
      );
      if (response.status === 200) {
        toast.success("Medical report deleted successfully");
        onRefreshMedicalReports(selectedPatient.patient_id);
      }
    } catch {
      toast.error("Failed to delete medical report");
    } finally {
      setIsDeletingReport(false);
      setIsDeleteReportDialogOpen(false);
      setReportToDelete(null);
    }
  };

  // Upload Medical Report
  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedFile || !reportName.trim()) return;

    setIsUploadingReport(true);

    try {
      // First upload the file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const fileResponse = await apiClient.post("/files", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (fileResponse.status === 201) {
        // Then create the medical report record
        const reportResponse = await apiClient.post("/medical-reports", {
          patient_id: selectedPatient.patient_id,
          record_url: (fileResponse.data as { url: string })?.url,
          record_name: reportName,
        });

        if (reportResponse.status === 201) {
          toast.success("Medical report uploaded successfully");
          setSelectedFile(null);
          setReportName("");
          setIsUploadReportDialogOpen(false);
          onRefreshMedicalReports(selectedPatient.patient_id);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      }
    } catch {
      toast.error("Failed to upload medical report");
    } finally {
      setIsUploadingReport(false);
    }
  };

  // Handle file download
  const handleFileDownload = async (record_url: string) => {
    try {
      const response = await fetch(`${backendURL}${record_url}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = record_url.split("/").pop() || "medical-report";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download file");
    }
  };

  // Handle create consent form
  const handleCreateConsentForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedPatient ||
      !newConsentFormData.procedureDetails.trim() ||
      !newConsentFormData.explanationGiven.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user?.id) {
      toast.error("User not found. Please log in again.");
      return;
    }

    setIsSubmittingConsentForm(true);
    try {
      const requestData = {
        patient_id: selectedPatient.patient_id,
        dentist_id: user.id,
        procedure_details: newConsentFormData.procedureDetails,
        explanation_given: newConsentFormData.explanationGiven,
        status: "pending",
      };

      console.log("Creating consent form with data:", requestData);

      const response = await apiClient.post("/consent-forms", requestData);

      if (response.status === 201) {
        toast.success("Consent form created successfully");
        setNewConsentFormData({ procedureDetails: "", explanationGiven: "" });
        setConsentFormView("list");
        if (onRefreshConsentForms) {
          onRefreshConsentForms(selectedPatient.patient_id);
        }
      }
    } catch (error) {
      console.error("Error creating consent form:", error);
      toast.error("Failed to create consent form");
    } finally {
      setIsSubmittingConsentForm(false);
    }
  };

  // Handle form signing
  const handleSignForm = useCallback(
    async (formId: string, signer: string) => {
      try {
        const response = await apiClient.put(`/consent-forms/${formId}`, {
          status: "signed",
          sign: signer,
          signed_date: new Date().toISOString().split("T")[0],
        });

        if (response.status === 200) {
          toast.success("Consent form signed successfully");
          if (selectedPatient && onRefreshConsentForms) {
            onRefreshConsentForms(selectedPatient.patient_id);
          }
        }
      } catch (error) {
        console.error("Error signing consent form:", error);
        toast.error("Failed to sign consent form");
      }
    },
    [apiClient, selectedPatient, onRefreshConsentForms]
  );

  // Show overlay on sign click
  const handleSignClick = useCallback((formId: string) => {
    setPendingSignFormId(formId);
    setIsSignDialogOpen(true);
  }, []);

  // Confirm signing
  const confirmSign = useCallback(() => {
    if (pendingSignFormId) {
      handleSignForm(pendingSignFormId, signerName);
    }
    setIsSignDialogOpen(false);
    setPendingSignFormId(null);
    setSignerName("");
  }, [pendingSignFormId, signerName, handleSignForm]);

  // Handle view form
  const handleViewForm = useCallback(
    async (form: ConsentForm) => {
      try {
        // Use fetch directly since apiClient doesn't have a get method
        const response = await fetch(
          `${backendURL}/consent-forms/${form.form_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSelectedForm(data);
          setShowReadOnlyView(true);
        } else {
          throw new Error("Failed to fetch consent form details");
        }
      } catch (error) {
        console.error("Error fetching consent form details:", error);
        toast.error("Failed to fetch consent form details");
      }
    },
    [backendURL]
  );

  // Handle delete form
  const handleDeleteForm = (formId: string) => {
    setConsentFormToDelete(formId);
    setIsDeleteConsentFormDialogOpen(true);
  };

  const confirmDeleteConsentForm = async () => {
    if (!consentFormToDelete) return;
    try {
      const response = await apiClient.delete(
        `/consent-forms/${consentFormToDelete}`
      );
      if (response.status === 200) {
        toast.success("Consent form deleted successfully");
        if (selectedPatient && onRefreshConsentForms) {
          onRefreshConsentForms(selectedPatient.patient_id);
        }
      }
    } catch (error) {
      console.error("Error deleting consent form:", error);
      toast.error("Failed to delete consent form");
    } finally {
      setIsDeleteConsentFormDialogOpen(false);
      setConsentFormToDelete(null);
    }
  };

  if (!isOpen || !selectedPatient) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
        {/* Enhanced Backdrop with stronger blur */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />

        {/* Overlay Content with improved design and proper scrolling */}
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 zoom-in-95 duration-300 border overflow-hidden">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 sm:px-4 py-3 flex items-start sm:items-center justify-between rounded-t-lg flex-shrink-0">
            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white/20 flex-shrink-0">
                {selectedPatient.profile_picture ? (
                  <AvatarImage
                    src={`${backendURL}${selectedPatient.profile_picture}`}
                    alt={selectedPatient.name}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="bg-emerald-600 text-white font-semibold text-sm sm:text-base">
                    {selectedPatient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold truncate">{selectedPatient.name}</h2>
                
                {/* Mobile: Stack info vertically */}
                <div className="mt-1 space-y-1 sm:hidden">
                  <p className="text-emerald-100 text-xs">
                    <span>ID: {selectedPatient.patient_id}</span>
                  </p>
                  <p className="text-emerald-100 text-xs flex items-center gap-1">
                    <Phone className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{selectedPatient.phone_number}</span>
                  </p>
                  <p className="text-emerald-100 text-xs flex items-center gap-1">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{selectedPatient.email}</span>
                  </p>
                </div>
                
                {/* Desktop: Show info in one line */}
                <p className="text-emerald-100 hidden sm:flex items-center gap-3 mt-1 text-xs">
                  <span>ID: {selectedPatient.patient_id}</span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {selectedPatient.phone_number}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {selectedPatient.email}
                  </span>
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 hover:text-white transition-colors p-1.5 sm:p-2 rounded-full ml-2 flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
          {/* Critical Conditions Alert */}
          {getPatientCriticalConditions(selectedPatient.patient_id).length >
            0 && (
            <div className="mx-4 mt-2 p-2 bg-red-50 border-l-4 border-red-400 rounded-r-lg flex-shrink-0">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800 text-sm">
                    ⚠️ Critical Medical Conditions
                  </h3>
                  <p className="text-red-700 mt-1 mb-2 text-xs">
                    This patient has medical conditions requiring special
                    attention:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {getPatientCriticalConditions(
                      selectedPatient.patient_id
                    ).map((condition, idx) => (
                      <Badge
                        key={idx}
                        variant="destructive"
                        className="bg-red-100 text-red-800 border-red-300 px-2 py-0.5 text-xs"
                      >
                        {getConditionLabel(condition)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sign Confirmation Dialog */}
          <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Sign Consent Form</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <Label htmlFor="signerName">Signer Name</Label>
                <Input
                  id="signerName"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="flex justify-end mt-4 space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSignDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmSign} disabled={!signerName.trim()}>
                  Confirm
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Content with proper scrolling */}
          <div className="flex-1 overflow-auto">
            <Tabs
              value={activeTab}
              onValueChange={onTabChange}
              className="p-3 h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-5 bg-gray-50/80 m-0 rounded-none border-b border-gray-200 h-10 flex-shrink-0">
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 font-medium text-xs py-2 transition-all duration-200"
                >
                  <User className="hidden sm:block w-3 h-3 mr-1" />
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="medical-history"
                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 font-medium text-xs py-2 transition-all duration-200"
                >
                  <FileText className="hidden sm:block w-3 h-3 mr-1" />
                    {/* Mobile: short text */}
  <span className="block sm:hidden">History</span>
  
  {/* Tablet/Desktop: full text */}
  <span className="hidden sm:block"> Medical History</span>
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 font-medium text-xs py-2 transition-all duration-200"
                >
                  <FileText className=" hidden sm:block w-3 h-3 mr-1" />
                  Reports
                </TabsTrigger>
                <TabsTrigger
                  value="soap-notes"
                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 font-medium text-xs py-2 transition-all duration-200"
                >
                  <FileText className=" hidden sm:block w-3 h-3 mr-1" />
                   {/* Mobile: short text */}
  <span className="block sm:hidden">SOAP</span>
  
  {/* Tablet/Desktop: full text */}
  <span className="hidden sm:block">SOAP Notes</span>
                </TabsTrigger>
                <TabsTrigger
                  value="consent-forms"
                  className="data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 font-medium text-xs py-2 transition-all duration-200"
                >
                  <FileText className=" hidden sm:block w-3 h-3 mr-1" />

                   {/* Mobile: short text */}
  <span className="block sm:hidden">Consent</span>
  
  {/* Tablet/Desktop: full text */}
  <span className="hidden sm:block">Consent Forms</span>

                </TabsTrigger>
              </TabsList>

              <div
                className="flex-1 overflow-y-auto"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#cbd5e1 #f1f5f9",
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    width: 6px;
                  }
                  div::-webkit-scrollbar-track {
                    background: #f1f5f9;
                  }
                  div::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 3px;
                  }
                  div::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                  }
                `}</style>
                <TabsContent
                  value="details"
                  className="m-0 p-3 bg-gradient-to-br from-gray-50 to-white"
                >
                  <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm overflow-auto">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        Patient Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-gray-700">
                            Date of Birth
                          </label>
                          <p className="text-gray-900 text-sm">
                            {selectedPatient.date_of_birth || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700">
                            Gender
                          </label>
                          <p className="text-gray-900 text-sm">
                            {selectedPatient.gender || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700">
                            Blood Group
                          </label>
                          <p className="text-gray-900 text-sm">
                            {selectedPatient.blood_group || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700">
                            NIC
                          </label>
                          <p className="text-gray-900 text-sm">
                            {selectedPatient.nic || "Not provided"}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-medium text-gray-700">
                            Address
                          </label>
                          <p className="text-gray-900 text-sm">
                            {selectedPatient.address || "Not provided"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent
                  value="medical-history"
                  className="m-0 p-3 bg-gradient-to-br from-blue-50 to-white"
                >
                  {loadingMedicalHistory ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="text-blue-600 ml-2 text-sm">
                        Loading medical history...
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border-0 overflow-y-auto">
                      <MedicalHistoryForm
                        patientId={selectedPatient.patient_id}
                        onSave={() =>
                          onRefreshMedicalHistory(selectedPatient.patient_id)
                        }
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent
                  value="reports"
                  className="m-0 p-3 bg-gradient-to-br from-purple-50 to-white"
                >
                  <div className="flex justify-between items-center mb-3 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-gray-800">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Medical Reports
                      <Badge
                        variant="secondary"
                        className="bg-purple-100 text-purple-700 text-xs"
                      >
                        {medicalReports.length} reports
                      </Badge>
                    </h3>
                    <Button
                      className="bg-emerald-500 hover:bg-emerald-600 shadow-md transition-all duration-200"
                      size="sm"
                      onClick={() => setIsUploadReportDialogOpen(true)}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                       

  
  {/* Tablet/Desktop: full text */}
  <span className="hidden sm:block">Upload Report</span>
                    </Button>
                  </div>

                  <div className="grid gap-2">
                    {medicalReports.map((report) => (
                      <Card
                        key={report.report_id}
                        className="hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-blue-100 rounded-lg">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 text-sm">
                                  {report.record_name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {report.record_url.split("/").pop()}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                className="hover:bg-emerald-100"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleFileDownload(report.record_url)
                                }
                              >
                                <Download className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                className="hover:bg-red-100 text-red-600"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleDeleteReport(report.report_id)
                                }
                                disabled={isDeletingReport}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {medicalReports.length === 0 && (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 mb-2 text-sm">
                            No medical reports available
                          </p>
                          <Button
                            className="bg-emerald-500 hover:bg-emerald-600"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsUploadReportDialogOpen(true)}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload First Report
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="soap-notes"
                  className="m-0 p-3 bg-gradient-to-br from-green-50 to-white"
                >
                  <div className="flex justify-between items-center mb-3 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border">
                    <h3 className="text-base font-semibold flex items-center gap-2 text-gray-800">
                      <FileText className="w-4 h-4 text-green-600" />
                      SOAP Notes
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700 text-xs"
                      >
                        {soapNotes.length} notes
                      </Badge>
                    </h3>
                    <Button
                      className="bg-emerald-500 hover:bg-emerlad-600 shadow-md transition-all duration-200"
                      size="sm"
                      onClick={() => setIsAddNoteDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />

  
  {/* Tablet/Desktop: full text */}
  <span className="hidden sm:block">Add Note</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {soapNotes.map((note) => (
                      <Card key={note.note_id}>
                        <CardContent className="p-2">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs text-gray-500">
                              {note.date}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditNote(note)}
                                className="h-6 w-6 p-0 hover:bg-blue-100"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteNote(note.note_id)}
                                disabled={isDeletingNote}
                                className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-gray-900 whitespace-pre-wrap text-sm">
                            {note.note}
                          </p>
                        </CardContent>
                      </Card>
                    ))}

                    {soapNotes.length === 0 && (
                      <Card>
                        <CardContent className="p-4 text-center">
                          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            No SOAP notes available for this patient
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="consent-forms"
                  className="m-0 p-3 bg-gradient-to-br from-amber-50 to-white"
                >
                  {consentFormView === "create" ? (
                    // Create Form View - Full ConsentFormOverlay functionality
                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border">
                        <h3 className="text-base font-semibold text-gray-800">
                          New Consent Form
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setConsentFormView("list");
                            setNewConsentFormData({
                              procedureDetails: "",
                              explanationGiven: "",
                            });
                          }}
                        >
                          Back to List
                        </Button>
                      </div>

                      <form
                        onSubmit={handleCreateConsentForm}
                        className="space-y-6"
                      >
                        {/* Progress Steps */}
                        <div className="mb-6">
                          <div className="flex items-center justify-between max-w-2xl mx-auto">
                            <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                                <User className="w-5 h-5" />
                              </div>
                              <span className="text-xs mt-2 text-gray-600">
                                Details
                              </span>
                            </div>
                            <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  newConsentFormData.procedureDetails
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                <FileText className="w-5 h-5" />
                              </div>
                              <span className="text-xs mt-2 text-gray-600">
                                Procedure
                              </span>
                            </div>
                            <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  newConsentFormData.explanationGiven
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-gray-100 text-gray-400"
                                }`}
                              >
                                <AlertCircle className="w-5 h-5" />
                              </div>
                              <span className="text-xs mt-2 text-gray-600">
                                Risks & Explanation
                              </span>
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
                                  <Label className="text-gray-700">
                                    Patient Name
                                  </Label>
                                  <Input
                                    value={selectedPatient?.name || ""}
                                    disabled
                                    className="mt-1.5 bg-gray-50"
                                  />
                                </div>
                                <div>
                                  <Label className="text-gray-700">
                                    Doctor/Admin Name
                                  </Label>
                                  <Input
                                    value={
                                      selectedForm?.dentist?.name ||
                                      user?.name ||
                                      "Unkown"
                                    }
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
                                    value={newConsentFormData.procedureDetails}
                                    onChange={(e) =>
                                      setNewConsentFormData((prev) => ({
                                        ...prev,
                                        procedureDetails: e.target.value,
                                      }))
                                    }
                                    placeholder="Describe the dental procedure in detail..."
                                    className="mt-1.5 h-28 resize-none"
                                    required
                                  />
                                  <p className="text-sm text-gray-500 mt-1.5">
                                    Include specific details about the
                                    procedure, techniques, and materials to be
                                    used.
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
                                    value={newConsentFormData.explanationGiven}
                                    onChange={(e) =>
                                      setNewConsentFormData((prev) => ({
                                        ...prev,
                                        explanationGiven: e.target.value,
                                      }))
                                    }
                                    placeholder="Document the explanation provided to the patient..."
                                    className="mt-1.5 h-28 resize-none"
                                    required
                                  />
                                  <p className="text-sm text-gray-500 mt-1.5">
                                    Detail the information shared with the
                                    patient about benefits, risks, and
                                    alternatives.
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
                                  <h4 className="font-medium text-blue-900 mb-2">
                                    Consent Context
                                  </h4>
                                  <p className="text-sm text-blue-700 leading-relaxed">
                                    This consent form documents the
                                    patient&apos;s agreement to undergo the
                                    specified dental procedure after being fully
                                    informed of the risks, benefits, and
                                    alternatives.
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
                                  "Potential complications during or after the procedure",
                                  "Possible side effects from anesthesia or medications",
                                  "Recovery time and post-procedure care requirements",
                                  "Alternative treatment options",
                                ].map((risk, index) => (
                                  <div
                                    key={index}
                                    className="flex items-start gap-2.5 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                  >
                                    <div className="mt-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    </div>
                                    <p className="text-sm text-gray-700">
                                      {risk}
                                    </p>
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
                                  "Clear explanation of the procedure",
                                  "Documentation of patient understanding",
                                  "Signature from both patient and doctor",
                                  "Date of consent",
                                ].map((requirement, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                  >
                                    <Checkbox
                                      id={`req-${index}`}
                                      checked={
                                        !!newConsentFormData.procedureDetails &&
                                        !!newConsentFormData.explanationGiven
                                      }
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
                            onClick={() => {
                              setConsentFormView("list");
                              setNewConsentFormData({
                                procedureDetails: "",
                                explanationGiven: "",
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={
                              isSubmittingConsentForm ||
                              !newConsentFormData.procedureDetails ||
                              !newConsentFormData.explanationGiven
                            }
                            className="bg-emerald-500 hover:bg-emerald-600"
                          >
                            {isSubmittingConsentForm
                              ? "Submitting..."
                              : "Submit Consent Form"}
                          </Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    // List View - Full ConsentFormOverlay list functionality
                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border">
                        <h3 className="text-base font-semibold flex items-center gap-2 text-gray-800">
                          <FileText className="w-4 h-4 text-amber-600" />
                          Consent Forms
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-700 text-xs"
                          >
                            {consentForms.length} forms
                          </Badge>
                        </h3>
                       {/* <Button
                          onClick={() => setConsentFormView("create")}
                          className="bg-emerald-500 hover:bg-emerald-600"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                         
  
 
  <span className="hidden sm:block">New Consent Form</span>
                        </Button>*/}
                      </div>

                      <div className="space-y-4">
                        {consentForms.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm mb-3">
                              No consent forms available for this patient
                            </p>
                            {/*<Button
                              onClick={() => setConsentFormView("create")}
                              className="bg-emerald-500 hover:bg-emerald-600"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Consent Form
                            </Button>*/}
                          </div>
                        ) : (
                          [...consentForms]
                            .sort((a, b) => {
                              // First sort by signed status
                              if (
                                a.status === "signed" &&
                                b.status !== "signed"
                              )
                                return -1;
                              if (
                                a.status !== "signed" &&
                                b.status === "signed"
                              )
                                return 1;
                              // Then sort by date (newest first)
                              const dateA = new Date(a.created_date).getTime();
                              const dateB = new Date(b.created_date).getTime();
                              return dateB - dateA;
                            })
                            .map((form) => (
                              <div
                                key={form.form_id}
                                className={`bg-white rounded-lg border ${
                                  form.status === "signed"
                                    ? "border-emerald-200"
                                    : "border-gray-200"
                                } p-6 space-y-4`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant={
                                          form.status === "signed"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className={
                                          form.status === "signed"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : ""
                                        }
                                      >
                                        {form.status === "signed"
                                          ? "Signed"
                                          : "Pending"}
                                      </Badge>
                                      <span className="text-sm text-gray-500">
                                        Created:{" "}
                                        {format(
                                          new Date(form.created_date),
                                          "MMM dd, yyyy"
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {form.procedure_details}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    {form.status === "pending" && (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleSignClick(
                                            form.form_id.toString()
                                          )
                                        }
                                        className="bg-emerald-500 hover:bg-emerald-600"
                                      >
                                        <FileSignature className="h-4 w-4 mr-1" />
                                        Sign
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewForm(form)}
                                    >
                                      <FileText className="h-4 w-4 mr-1" />
                                      View
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleDeleteForm(
                                          form.form_id.toString()
                                        )
                                      }
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>

                                {form.status === "signed" &&
                                  form.signed_date && (
                                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                                      <p className="text-sm text-emerald-700">
                                        Signed by {form.sign} on{" "}
                                        {format(
                                          new Date(form.signed_date),
                                          "MMM dd, yyyy"
                                        )}
                                      </p>
                                    </div>
                                  )}
                              </div>
                            ))
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add SOAP Note Dialog */}
      {isAddNoteDialogOpen && (
        <Dialog
          open={isAddNoteDialogOpen}
          onOpenChange={setIsAddNoteDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? "Edit SOAP Note" : "Add SOAP Note"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  placeholder="Enter SOAP note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="min-h-[120px]"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddNoteDialogOpen(false);
                    setNewNoteText("");
                    setEditingNote(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600"
                  disabled={isSubmittingNote}
                >
                  {isSubmittingNote
                    ? "Saving..."
                    : editingNote
                    ? "Update Note"
                    : "Add Note"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete SOAP Note Confirmation Dialog */}
      <Dialog
        open={isDeleteNoteDialogOpen}
        onOpenChange={setIsDeleteNoteDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete SOAP Note</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this SOAP note?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteNoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteNote}
              disabled={isDeletingNote}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeletingNote ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Report Dialog */}
      {isUploadReportDialogOpen && (
        <Dialog
          open={isUploadReportDialogOpen}
          onOpenChange={setIsUploadReportDialogOpen}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Medical Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadReport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  placeholder="Enter report name"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsUploadReportDialogOpen(false);
                    setSelectedFile(null);
                    setReportName("");
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600"
                  disabled={isUploadingReport}
                >
                  {isUploadingReport ? "Uploading..." : "Upload Report"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Medical Report Confirmation Dialog */}
      <Dialog
        open={isDeleteReportDialogOpen}
        onOpenChange={setIsDeleteReportDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Medical Report</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this medical report?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteReportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteReport}
              disabled={isDeletingReport}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeletingReport ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Consent Form Dialog */}
      <Dialog open={isViewFormOpen} onOpenChange={setIsViewFormOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consent Form Details</DialogTitle>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <Badge
                  variant={
                    selectedForm.status === "signed" ? "default" : "secondary"
                  }
                  className={
                    selectedForm.status === "signed"
                      ? "bg-emerald-100 text-emerald-700"
                      : ""
                  }
                >
                  {selectedForm.status === "signed" ? "Signed" : "Pending"}
                </Badge>
                <div className="text-sm text-gray-500">
                  Created:{" "}
                  {format(new Date(selectedForm.created_date), "MMM dd, yyyy")}
                </div>
              </div>

              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Patient Information
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedPatient?.name}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedPatient?.email}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Doctor Information
                  </h4>
                  <div className="space-y-2">
                    <p>
                      <span className="font-medium">Name:</span> {user?.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Procedure Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Procedure Details
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {selectedForm.procedure_details}
                  </p>
                </div>
              </div>

              {/* Explanation Given */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Explanation Given to Patient
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">
                    {selectedForm.explanation_given}
                  </p>
                </div>
              </div>

              {/* Signature Info */}
              {selectedForm.status === "signed" && selectedForm.sign && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Signature Details
                  </h4>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p>
                          <span className="font-medium">Signed by:</span>{" "}
                          {selectedForm.sign}
                        </p>
                        <p>
                          <span className="font-medium">Date:</span>{" "}
                          {format(
                            new Date(selectedForm.signed_date),
                            "MMM dd, yyyy"
                          )}
                        </p>
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

      {/* Delete Consent Form Confirmation Dialog */}
      <Dialog
        open={isDeleteConsentFormDialogOpen}
        onOpenChange={setIsDeleteConsentFormDialogOpen}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Consent Form</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this consent form?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConsentFormDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteConsentForm}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Read-Only Consent Form View Dialog */}
      <Dialog open={showReadOnlyView} onOpenChange={setShowReadOnlyView}>
        <DialogContent className="sm:max-w-[85%] sm:w-[1100px] overflow-y-auto max-h-[85vh]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              Consent Form - Read Only
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {selectedForm?.status === "signed" ? "Signed" : "Pending"} consent
              form for {selectedPatient?.name}
            </p>
          </DialogHeader>

          {selectedForm && (
            <div className="space-y-6">
              {/* Progress Steps - All completed for read-only */}
              <div className="mb-6">
                <div className="flex items-center justify-between max-w-2xl mx-auto">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs mt-2 text-gray-600">Details</span>
                  </div>
                  <div className="flex-1 h-0.5 mx-4 bg-emerald-200" />
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xs mt-2 text-gray-600">
                      Procedure
                    </span>
                  </div>
                  <div className="flex-1 h-0.5 mx-4 bg-emerald-200" />
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-xs mt-2 text-gray-600">
                      Risks & Explanation
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left side - Form Content */}
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
                          value={
                            selectedForm.patient?.name ||
                            selectedPatient?.name ||
                            ""
                          }
                          disabled
                          className="mt-1.5 bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700">
                          Doctor/Admin Name
                        </Label>
                        <Input
                          value={selectedForm.dentist?.name || "Dr. Smith"}
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
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {selectedForm.procedure_details}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-gray-500" />
                      Patient Explanation
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        {selectedForm.explanation_given}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side - Status and Info */}
                <div className="space-y-5">
                  <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-900 mb-2">
                          Consent Status
                        </h4>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            variant={
                              selectedForm.status === "signed"
                                ? "default"
                                : "secondary"
                            }
                            className={
                              selectedForm.status === "signed"
                                ? "bg-emerald-100 text-emerald-700"
                                : ""
                            }
                          >
                            {selectedForm.status === "signed"
                              ? "Signed"
                              : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700 leading-relaxed">
                          Created on{" "}
                          {format(
                            new Date(selectedForm.created_date),
                            "MMM dd, yyyy"
                          )}
                          {selectedForm.signed_date && (
                            <>
                              <br />
                              Signed on{" "}
                              {format(
                                new Date(selectedForm.signed_date),
                                "MMM dd, yyyy"
                              )}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedForm.status === "signed" && selectedForm.sign && (
                    <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-100">
                      <h4 className="font-medium text-emerald-900 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        Digital Signature
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-emerald-700">
                          <span className="font-medium">Signed by:</span>{" "}
                          {selectedForm.sign}
                        </p>
                        <p className="text-sm text-emerald-700">
                          <span className="font-medium">Date:</span>{" "}
                          {format(
                            new Date(selectedForm.signed_date),
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-5 rounded-lg border border-gray-100">
                    <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Risk Factors Disclosed
                    </h4>
                    <div className="space-y-3">
                      {[
                        "Potential complications during or after the procedure",
                        "Possible side effects from anesthesia or medications",
                        "Recovery time and post-procedure care requirements",
                        "Alternative treatment options",
                      ].map((risk, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2.5 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <div className="mt-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          </div>
                          <p className="text-sm text-gray-700">{risk}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowReadOnlyView(false)}
                  className="px-4"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientDetailsOverlay;
