'use client';

import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { DollarSign, FileText, Users, Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '@/context/auth-context';

// Types
interface Patient {
  patient_id: string;
  phone_number: string;
  hospital_patient_id: string | null;
  password: string;
  name: string;
  profile_picture: string;
  email: string;
  address: string;
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

interface CreateInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: InvoiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<InvoiceFormData>>;
  availableServices: InvoiceService[];
  onSubmit: (e: React.FormEvent) => void;
  formSubmitting: boolean;
  canApplyDiscounts: boolean;
  paymentTypes: string[];
}

const CreateInvoiceDialog: React.FC<CreateInvoiceDialogProps> = ({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  availableServices,
  onSubmit,
  formSubmitting,
  canApplyDiscounts,
  paymentTypes,
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Patient search states - similar to AppointmentDialog
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patientValidated, setPatientValidated] = useState(true);
  const [patientErrorMessage, setPatientErrorMessage] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  
  const { apiClient } = useContext(AuthContext);

  // Search for patients by name, ID, or email - similar to AppointmentDialog
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

  // Handle patient selection from dropdown
  const handlePatientSelect = (patient: Patient) => {
    setFormData(prev => ({ ...prev, patient_id: patient.patient_id }));
    setPatientSearchTerm(`${patient.name} (${patient.patient_id})`);
    setShowPatientDropdown(false);
    setPatientValidated(true);
    setPatientErrorMessage('');
    setSelectedPatient(patient);
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

  // Update form data when date changes
  useEffect(() => {
    if (date) {
      setFormData(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    }
  }, [date, setFormData]);

  // Automatically set dentist_id to the hardcoded value
  useEffect(() => {
    setFormData(prev => ({ ...prev, dentist_id: 'knrsdent001' }));
  }, [setFormData]);

  const calculateSubtotal = () => {
    const selectedServices = availableServices.filter(service => formData.services.includes(service.service_id));
    return selectedServices.reduce((total, service) => total + service.amount, 0);
  };

  const calculateEstimatedTax = () => {
    const selectedServices = availableServices.filter(service => formData.services.includes(service.service_id));
    return selectedServices.reduce((totalTax, service) => {
      const taxAmount = (service.amount * Number(service.tax_percentage || 0)) / 100;
      return totalTax + taxAmount;
    }, 0);
  };

  const calculateEstimatedLabCost = () => {
    const selectedServices = availableServices.filter(service => formData.services.includes(service.service_id));
    return selectedServices.reduce((totalLabCost, service) => {
      return totalLabCost + Number(service.Lab_charge || 0);
    }, 0);
  };

  const calculateEstimatedConsumableCost = () => {
    const selectedServices = availableServices.filter(service => formData.services.includes(service.service_id));
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

  // Custom submit handler that adds the hardcoded dentist_id
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

    // Ensure dentist_id is set to the hardcoded value
    if (formData.dentist_id !== 'knrsdent001') {
      setFormData(prev => ({ ...prev, dentist_id: 'knrsdent001' }));
    }

    // Call the original onSubmit
    onSubmit(e);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw] !max-w-none max-h-[90vh] overflow-y-auto overflow-x-visible">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-emerald-700">Create New Invoice</DialogTitle>
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
                {availableServices.map((service) => (
                  <div key={service.service_id} className="flex items-start space-x-3 p-3 bg-white border border-gray-200 hover:border-emerald-300 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      id={`service-${service.service_id}`}
                      checked={formData.services.includes(service.service_id)}
                      onChange={() => handleServiceToggle(service.service_id)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5"
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
                        onClick={() => setCalendarOpen(true)}
                      >
                        <CalendarIcon className="mr-2 h-5 w-5 text-emerald-600" />
                        {date ? format(date, 'PPP') : <span className="text-gray-500">Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          setDate(newDate);
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
                id="note"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={4}
                placeholder="Add any additional notes for this invoice..."
                className="w-full text-base border-2 focus:border-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* Invoice Summary */}
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
                    <span className="text-gray-700 font-medium">Lab Cost:</span>
                    <span className="text-lg font-semibold text-gray-900">Rs. {calculateEstimatedLabCost().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Consumable Cost:</span>
                    <span className="text-lg font-semibold text-gray-900">Rs. {calculateEstimatedConsumableCost().toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Discount:</span>
                    <span className="text-lg font-semibold text-red-600">-Rs. {formData.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700 font-medium">Tax:</span>
                    <span className="text-lg font-semibold text-gray-900">Rs. {calculateEstimatedTax().toFixed(2)}</span>
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
              disabled={formSubmitting || !formData.patient_id}
            >
              {formSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  Creating Invoice...
                </>
              ) : (
                <>
                  <FileText size={18} className="mr-2" />
                  Create Invoice
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateInvoiceDialog;