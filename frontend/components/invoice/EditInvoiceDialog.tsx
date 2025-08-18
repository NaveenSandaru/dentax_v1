'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Users, FileText, DollarSign, Search, X } from 'lucide-react';
import { format } from "date-fns";
import { toast } from 'sonner';
import { AuthContext } from '@/context/auth-context';

interface Patient {
  patient_id: string;
  hospital_patient_id: string | null;
  name: string;
  email: string;
  phone_number: string;
  profile_picture: string;
}

interface Dentist {
  dentist_id: string;
  name: string;
  email: string;
  phone_number: string;
  profile_picture: string;
  invoice_service_id: number | null;
}

interface SelectedInvoice {
  invoice_id: string;
  patient_id: string;
  dentist_id: string;
  payment_type: string;
  discount: number;
  date: string;
  note: string;
  services: number[];
}

interface InvoiceService {
  service_id: number;
  service_name: string;
  amount: number;
  description?: string;
  tax_percentage: number;
  Lab_charge: number;
  Consumable_charge: number;
  tax_type?: string;
}

interface InvoiceFormData {
  patient_id: string;
  dentist_id?: string; // Optional since we'll set it automatically
  payment_type: string;
  discount: number;
  date: string;
  note: string;
  services: number[];
}

interface EditInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  availableServices: InvoiceService[];
  onSubmit: (e: React.FormEvent) => void;
  formSubmitting: boolean;
  canApplyDiscounts: boolean;
  paymentTypes: string[];
  selectedInvoice: SelectedInvoice;
}

const EditInvoiceDialog: React.FC<EditInvoiceDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  availableServices,
  onSubmit,
  formSubmitting,
  canApplyDiscounts,
  paymentTypes,
  selectedInvoice,
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Patient search states - similar to CreateInvoiceDialog
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientValidated, setPatientValidated] = useState(true);
  const [patientErrorMessage, setPatientErrorMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  // Dentist search states
  const [dentistSearchTerm, setDentistSearchTerm] = useState('');
  const [dentistSearchResults, setDentistSearchResults] = useState<Dentist[]>([]);
  const [showDentistDropdown, setShowDentistDropdown] = useState(false);
  const [dentistValidated, setDentistValidated] = useState(true);
  const [dentistErrorMessage, setDentistErrorMessage] = useState('');
  const [selectedDentist, setSelectedDentist] = useState<Dentist | null>(null);
  const [dentistServices, setDentistServices] = useState<InvoiceService[]>([]);
  
  const { apiClient } = useContext(AuthContext);

  // Search for patients by name, ID, or email - similar to CreateInvoiceDialog
  const searchPatients = async (term: string) => {
    if (term.length < 2) {
      setPatientSearchResults([]);
      return;
    }
    
    try {
      const response = await apiClient.get(`/patients/search?q=${encodeURIComponent(term)}`);
      if (response.data) {
        setPatientSearchResults(response.data);
        
        // If no patients were found matching the search term
        if (response.data.length === 0 && term.length > 2) {
          setPatientValidated(false);
          setPatientErrorMessage('No matching patients found. Please select a patient from the dropdown.');
        }
      }
    } catch (err) {
      console.error('Error searching patients:', err);
      setPatientSearchResults([]);
    }
  };

  // Search for dentists by name, ID, or email
  const searchDentists = async (term: string) => {
    if (term.length < 2) {
      setDentistSearchResults([]);
      return;
    }
    
    try {
      const response = await apiClient.get(`/dentists/search?q=${encodeURIComponent(term)}`);
      if (response.data) {
        setDentistSearchResults(response.data);
        
        // If no dentists were found matching the search term
        if (response.data.length === 0 && term.length > 2) {
          setDentistValidated(false);
          setDentistErrorMessage('No matching dentists found. Please select a dentist from the dropdown.');
        }
      }
    } catch (err) {
      console.error('Error searching dentists:', err);
      setDentistSearchResults([]);
    }
  };

  // Fetch services for selected dentist
  const fetchDentistServices = async (dentistId: string) => {
    try {
      const response = await apiClient.get(`/invoice-services/dentist/${dentistId}`);
      if (response.data) {
        setDentistServices(response.data);
      }
    } catch (err) {
      console.error('Error fetching dentist services:', err);
      setDentistServices([]);
    }
  };

  // Handle patient selection from dropdown
  const handlePatientSelect = (patient: Patient) => {
    setFormData(prev => ({ ...prev, patient_id: patient.patient_id }));
    setPatientSearchTerm(`${patient.name} (${patient.patient_id})`);
    setShowPatientDropdown(false);
    setPatientValidated(true);
    setPatientErrorMessage('');
    setSelectedPatient(patient);
  };

  // Handle dentist selection from dropdown
  const handleDentistSelect = (dentist: Dentist) => {
    setFormData(prev => ({ ...prev, dentist_id: dentist.dentist_id, services: [] })); // Clear selected services
    setDentistSearchTerm(`${dentist.name} (${dentist.dentist_id})`);
    setShowDentistDropdown(false);
    setDentistValidated(true);
    setDentistErrorMessage('');
    setSelectedDentist(dentist);
    fetchDentistServices(dentist.dentist_id);
  };

  // Handle patient search term change
  const handlePatientSearchChange = (value: string) => {
    setPatientSearchTerm(value);
    
    // Reset patientId if the input field is cleared or modified
    if (!value || (formData.patient_id && !value.includes(formData.patient_id))) {
      setFormData(prev => ({ ...prev, patient_id: '' }));
      setSelectedPatient(null);
      setPatientValidated(false);
      if (value.length > 0) {
        setPatientErrorMessage('Please select a patient from the dropdown list');
      } else {
        setPatientErrorMessage('');
      }
    }
    
    searchPatients(value);
    setShowPatientDropdown(true);
  };

  // Handle dentist search term change
  const handleDentistSearchChange = (value: string) => {
    setDentistSearchTerm(value);
    
    // Reset dentistId if the input field is cleared or modified
    if (!value || (formData.dentist_id && !value.includes(formData.dentist_id))) {
      setFormData(prev => ({ ...prev, dentist_id: '', services: [] }));
      setSelectedDentist(null);
      setDentistValidated(false);
      setDentistServices([]);
      if (value.length > 0) {
        setDentistErrorMessage('Please select a dentist from the dropdown list');
      } else {
        setDentistErrorMessage('');
      }
    }
    
    searchDentists(value);
    setShowDentistDropdown(true);
  };

  // Update form data when date changes
  useEffect(() => {
    if (date) {
      setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    }
  }, [date, setFormData]);

  // Initialize date from formData
  useEffect(() => {
    if (formData.date) {
      setDate(new Date(formData.date));
    }
  }, [formData.date]);

  // Initialize dentist validation state only when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDentistValidated(true);
      setDentistErrorMessage('');
    }
  }, [isOpen]);

  // Initialize patient search term when formData.patient_id changes
  useEffect(() => {
    if (formData.patient_id && selectedPatient?.patient_id !== formData.patient_id) {
      // If we have a patient_id but no selected patient, we need to find and set the patient
      const findPatient = async () => {
        try {
          const response = await apiClient.get(`/patients/${formData.patient_id}`);
          if (response.data) {
            setSelectedPatient(response.data);
            setPatientSearchTerm(`${response.data.name} (${response.data.patient_id})`);
            setPatientValidated(true);
          }
        } catch (err) {
          console.error('Error fetching patient details:', err);
        }
      };
      findPatient();
    }
  }, [formData.patient_id, selectedPatient, apiClient]);

  // Initialize dentist search term when formData.dentist_id changes
  useEffect(() => {
    if (formData.dentist_id && selectedDentist?.dentist_id !== formData.dentist_id) {
      // If we have a dentist_id but no selected dentist, we need to find and set the dentist
      const findDentist = async () => {
        try {
          const response = await apiClient.get(`/dentists/${formData.dentist_id}`);
          if (response.data) {
            setSelectedDentist(response.data);
            setDentistSearchTerm(`${response.data.name} (${response.data.dentist_id})`);
            setDentistValidated(true);
            fetchDentistServices(response.data.dentist_id);
          }
        } catch (err) {
          console.error('Error fetching dentist details:', err);
        }
      };
      findDentist();
    }
  }, [formData.dentist_id, selectedDentist, apiClient]);

  const calculateSubtotal = () => {
    const servicesToUse = selectedDentist ? dentistServices : availableServices;
    const selectedServices = servicesToUse.filter(service => formData.services.includes(service.service_id));
    return selectedServices.reduce((total, service) => total + service.amount, 0);
  };

  const calculateEstimatedTax = () => {
    const servicesToUse = selectedDentist ? dentistServices : availableServices;
    const selectedServices = servicesToUse.filter(service => formData.services.includes(service.service_id));
    return selectedServices.reduce((totalTax, service) => {
      const taxAmount = (service.amount * Number(service.tax_percentage || 0)) / 100;
      return totalTax + taxAmount;
    }, 0);
  };

  const calculateEstimatedLabCost = () => {
    const servicesToUse = selectedDentist ? dentistServices : availableServices;
    const selectedServices = servicesToUse.filter(service => formData.services.includes(service.service_id));
    return selectedServices.reduce((totalLabCost, service) => {
      return totalLabCost + Number(service.Lab_charge || 0);
    }, 0);
  };

  const calculateEstimatedConsumableCost = () => {
    const servicesToUse = selectedDentist ? dentistServices : availableServices;
    const selectedServices = servicesToUse.filter(service => formData.services.includes(service.service_id));
    return selectedServices.reduce((totalConsumableCost, service) => {
      return totalConsumableCost + Number(service.Consumable_charge || 0);
    }, 0);
  };

  const calculateEstimatedTotal = () => {
    const subtotal = calculateSubtotal();
    const estimatedTax = calculateEstimatedTax();
    const estimatedLabCost = calculateEstimatedLabCost();
    const estimatedConsumableCost = calculateEstimatedConsumableCost();
    return subtotal + estimatedTax + estimatedLabCost + estimatedConsumableCost - formData.discount;
  };

  const handleServiceToggle = (serviceId: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  // Custom submit handler that validates patient and ensures dentist_id is set
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate patient selection
    if (!formData.patient_id) {
      setPatientValidated(false);
      setPatientErrorMessage('Please select a patient from the dropdown');
      toast.error('Patient selection required');
      return;
    }

    // Validate dentist selection
    if (!formData.dentist_id) {
      setDentistValidated(false);
      setDentistErrorMessage('Please select a dentist from the dropdown');
      toast.error('Dentist selection required');
      return;
    }

    // Call the original onSubmit
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw] !max-w-none max-h-[90vh] overflow-y-auto overflow-x-visible">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-emerald-700">
            Edit Invoice #{selectedInvoice?.invoice_id}
          </DialogTitle>
        </DialogHeader>
        
        <form
          onSubmit={handleSubmit}
          className="space-y-6 pt-4 overflow-visible"
        >
          {/* Client Information Section */}
          <div className="bg-white border rounded-lg shadow-sm overflow-visible">
            <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                Patient Information
              </h4>
            </div>
            <div className="p-6 overflow-visible">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="patient" className="font-medium text-gray-900">
                    Patient <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative overflow-visible">
                    <input
                      type="text"
                      value={patientSearchTerm}
                      onChange={(e) => handlePatientSearchChange(e.target.value)}
                      onFocus={() => {
                        setShowPatientDropdown(true);
                        if (!formData.patient_id && patientSearchTerm.length > 0) {
                          setPatientValidated(false);
                          setPatientErrorMessage('Please select a patient from the dropdown list');
                        }
                      }}
                      onBlur={() => setTimeout(() => {
                        setShowPatientDropdown(false);
                        // Check if a valid patient was selected
                        if (!formData.patient_id && patientSearchTerm.length > 0) {
                          setPatientValidated(false);
                          setPatientErrorMessage('Please select a patient from the dropdown list');
                        }
                      }, 200)}
                      placeholder="Search by patient name, ID, or email..."
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${!patientValidated ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'}`}
                      disabled={formSubmitting}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    
                    {showPatientDropdown && patientSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-2xl max-h-60 rounded-lg py-1 text-base border-2 border-emerald-200 overflow-auto focus:outline-none z-[9999]" style={{ zIndex: 9999 }}>
                        {patientSearchResults.map((patient) => (
                          <div
                            key={patient.patient_id}
                            className="cursor-pointer hover:bg-emerald-50 px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent onBlur from firing before onClick
                              handlePatientSelect(patient);
                            }}
                          >
                            <div className="font-semibold text-gray-900">{patient.name}</div>
                            <div className="text-xs text-gray-500 mt-1">ID: {patient.patient_id}</div>
                            {patient.email && <div className="text-xs text-emerald-600">{patient.email}</div>}
                            <div className="text-xs text-gray-500">{patient.phone_number}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!patientValidated && patientErrorMessage && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X size={14} />
                        {patientErrorMessage}
                      </div>
                    )}
                  </div>
                  
                  {selectedPatient && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-emerald-900 text-lg">{selectedPatient.name}</div>
                          <div className="text-sm text-emerald-700 mt-1">{selectedPatient.email}</div>
                          <div className="text-sm text-emerald-600">{selectedPatient.phone_number}</div>
                          <div className="text-xs text-emerald-600 mt-1">ID: {selectedPatient.patient_id}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, patient_id: '' }));
                            setPatientSearchTerm('');
                            setSelectedPatient(null);
                            setPatientValidated(false);
                            setPatientErrorMessage('');
                          }}
                          className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100"
                          disabled={formSubmitting}
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dentist Information Section */}
          <div className="bg-white border rounded-lg shadow-sm overflow-visible">
            <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" />
                Dentist Information
              </h4>
            </div>
            <div className="p-6 overflow-visible">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="dentist" className="font-medium text-gray-900">
                    Dentist <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative overflow-visible">
                    <input
                      type="text"
                      value={dentistSearchTerm}
                      onChange={(e) => handleDentistSearchChange(e.target.value)}
                      onFocus={() => {
                        setShowDentistDropdown(true);
                        if (!formData.dentist_id && dentistSearchTerm.length > 0) {
                          setDentistValidated(false);
                          setDentistErrorMessage('Please select a dentist from the dropdown list');
                        }
                      }}
                      onBlur={() => setTimeout(() => {
                        setShowDentistDropdown(false);
                        // Check if a valid dentist was selected
                        if (!formData.dentist_id && dentistSearchTerm.length > 0) {
                          setDentistValidated(false);
                          setDentistErrorMessage('Please select a dentist from the dropdown list');
                        }
                      }, 200)}
                      placeholder="Search by dentist name, ID, or email..."
                      className={`w-full px-4 py-3 text-base border-2 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${!dentistValidated ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-300'}`}
                      disabled={formSubmitting}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    
                    {showDentistDropdown && dentistSearchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-2xl max-h-60 rounded-lg py-1 text-base border-2 border-emerald-200 overflow-auto focus:outline-none z-[9999]" style={{ zIndex: 9999 }}>
                        {dentistSearchResults.map((dentist) => (
                          <div
                            key={dentist.dentist_id}
                            className="cursor-pointer hover:bg-emerald-50 px-4 py-3 text-sm text-gray-700 border-b border-gray-100 last:border-b-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent onBlur from firing before onClick
                              handleDentistSelect(dentist);
                            }}
                          >
                            <div className="font-semibold text-gray-900">{dentist.name}</div>
                            <div className="text-xs text-gray-500 mt-1">ID: {dentist.dentist_id}</div>
                            {dentist.email && <div className="text-xs text-emerald-600">{dentist.email}</div>}
                            <div className="text-xs text-gray-500">{dentist.phone_number}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {!dentistValidated && dentistErrorMessage && (
                      <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X size={14} />
                        {dentistErrorMessage}
                      </div>
                    )}
                  </div>
                  
                  {selectedDentist && (
                    <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold text-emerald-900 text-lg">{selectedDentist.name}</div>
                          <div className="text-sm text-emerald-700 mt-1">{selectedDentist.email}</div>
                          <div className="text-sm text-emerald-600">{selectedDentist.phone_number}</div>
                          <div className="text-xs text-emerald-600 mt-1">ID: {selectedDentist.dentist_id}</div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, dentist_id: '', services: [] }));
                            setDentistSearchTerm('');
                            setSelectedDentist(null);
                            setDentistValidated(false);
                            setDentistErrorMessage('');
                            setDentistServices([]);
                          }}
                          className="text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100"
                          disabled={formSubmitting}
                        >
                          <X size={18} />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                Services * (Tax & costs calculated automatically)
              </h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                {selectedDentist && dentistServices.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Loading dentist services...
                  </div>
                )}
                {!selectedDentist && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    Please select a dentist to view available services
                  </div>
                )}
                {(selectedDentist ? dentistServices : availableServices).map((service) => (
                  <div key={service.service_id} className="flex items-start space-x-3 p-3 bg-white border border-gray-200 hover:border-emerald-300 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      id={`service-${service.service_id}`}
                      checked={formData.services.includes(service.service_id)}
                      onChange={() => handleServiceToggle(service.service_id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
                      disabled={formSubmitting}
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={`service-${service.service_id}`} 
                        className="block text-sm font-medium text-gray-900 cursor-pointer hover:text-emerald-600 leading-tight"
                      >
                        {service.service_name}
                      </label>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-lg font-bold text-emerald-600">
                          Rs. {service.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <span>Tax: {service.tax_percentage || 0}%</span>
                        {service.Lab_charge > 0 && <span>• Lab: Rs.{service.Lab_charge}</span>}
                        {service.Consumable_charge > 0 && <span>• Mat: Rs.{service.Consumable_charge}</span>}
                      </div>
                      {service.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {availableServices.length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <div className="text-lg font-medium mb-2">No services available</div>
                    <div className="text-sm">Services will appear here when loaded</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" />
                Financial Details
              </h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {canApplyDiscounts && (
                  <div className="space-y-3">
                    <Label htmlFor="discount" className="font-medium text-gray-900">Discount (Rs.)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                      <Input
                        id="discount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.discount}
                        onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        className="pl-10 py-3 text-base border-2 focus:border-emerald-500"
                        placeholder="0.00"
                        disabled={formSubmitting}
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  <Label htmlFor="payment_type" className="font-medium text-gray-900">
                    Payment Method <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.payment_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value }))}
                    disabled={formSubmitting}
                  >
                    <SelectTrigger className="py-3 text-base border-2 focus:border-emerald-500">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((type) => (
                        <SelectItem key={type} value={type} className="py-3">
                          {type.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="date" className="font-medium text-gray-900">
                    Invoice Date <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full py-3 text-base border-2 focus:border-emerald-500 justify-start text-left font-normal hover:bg-emerald-50"
                        disabled={formSubmitting}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5 text-emerald-600" />
                        {date ? format(date, "PPP") : <span className="text-gray-500">Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(selectedDate) => {
                          setDate(selectedDate);
                          setCalendarOpen(false);
                        }}
                        initialFocus
                        className="rounded-md border shadow"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="bg-emerald-50 border-b border-emerald-100 px-5 py-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                Notes
              </h4>
            </div>
            <div className="p-6">
              <Textarea
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Add any additional notes for this invoice..."
                rows={4}
                className="w-full text-base border-2 focus:border-emerald-500 resize-none"
                disabled={formSubmitting}
              />
            </div>
          </div>

          {/* Invoice Summary Section */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg shadow-sm overflow-hidden">
            <div className="bg-emerald-100 border-b border-emerald-200 px-5 py-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-600" />
                Invoice Summary
              </h4>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Subtotal:</span>
                    <span className="text-lg font-semibold text-gray-900">Rs. {calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Discount:</span>
                    <span className="text-lg font-semibold text-red-600">-Rs. {formData.discount.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Lab Cost:</span>
                    <span className="text-lg font-semibold text-gray-900">Rs. {calculateEstimatedLabCost().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Tax:</span>
                    <span className="text-lg font-semibold text-gray-900">Rs. {calculateEstimatedTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Consumable Cost:</span>
                    <span className="text-lg font-semibold text-gray-900">Rs. {calculateEstimatedConsumableCost().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t-2 border-emerald-300 mt-6 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    Rs. {calculateEstimatedTotal().toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-8 py-3 text-base font-medium border-2 hover:bg-gray-50"
              disabled={formSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-8 py-3 text-base font-medium bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={formSubmitting || formData.services.length === 0 || !formData.patient_id || !formData.payment_type}
            >
              {formSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  Updating Invoice...
                </>
              ) : (
                <>
                  <FileText size={18} className="mr-2" />
                  Update Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceDialog;
