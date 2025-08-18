"use client";
import React, { useContext, useEffect, useState } from 'react';
import { Plus, Edit, Trash2, X, Phone, Mail, MapPin, User, Calendar, Droplets, Search, Eye, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthContext } from '@/context/auth-context';
import Image from 'next/image';
import PatientDetailsOverlay from '@/components/PatientDetailsOverlay';

type Patient = {
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
};

type TempPatient = {
  temp_patient_id: string;
  name: string;
  phone_number: string;
  email?: string;
  created_at: string;
  converted_to?: string;
  converted_at?: string;
};

// Additional interfaces for patient details
interface SOAPNote {
  note_id: number;
  patient_id: string;
  note: string;
  date?: string;
}

interface MedicalHistory {
  patient_id: string;
  medical_question_id: number;
  medical_question_answer: string;
  question: { question_id: string, question: string };
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
}

const PatientManagement = () => {

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();
  const { isLoadingAuth, isLoggedIn, user, apiClient } = useContext(AuthContext);

  const [loadingPatient, setLoadingPatient] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([
    {
      hospital_patient_id: '',
      patient_id: '',
      password: '',
      name: '',
      profile_picture: '',
      email: '',
      phone_number: '',
      address: '',
      nic: '',
      blood_group: '',
      date_of_birth: '',
      gender: '',
    }
  ]);

  const [tempPatients, setTempPatients] = useState<TempPatient[]>([]);
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<'full' | 'temp'>('full'); // New state for view mode

  const [showOverlay, setShowOverlay] = useState(false);
  const [showConvertOverlay, setShowConvertOverlay] = useState(false); // New state for convert overlay
  const [showTempPatientOverlay, setShowTempPatientOverlay] = useState(false); // New state for temp patient overlay
  const [convertingTempPatient, setConvertingTempPatient] = useState<TempPatient | null>(null); // Current temp patient being converted

  // Patient details overlay states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientDetailsOverlay, setShowPatientDetailsOverlay] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
  const [soapNotes, setSoapNotes] = useState<SOAPNote[]>([]);
  const [criticalConditions, setCriticalConditions] = useState<CriticalCondition[]>([]);
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false);
  const [loadingMedicalReports, setLoadingMedicalReports] = useState(false);
  const [loadingSOAPNotes, setLoadingSOAPNotes] = useState(false);
  const [deletingTempPatient, setDeletingTempPatient] = useState(false);
  const [deletingTempPatientID, setDeletingTempPatientID] = useState("");
  const [consentForms, setConsentForms] = useState<ConsentForm[]>([]);
  const [tempPatientId, setTempPatientId] = useState("");

  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState<Patient>({
    hospital_patient_id: '',
    patient_id: '',
    password: '',
    name: '',
    profile_picture: '',
    email: '',
    phone_number: '',
    address: '',
    nic: '',
    blood_group: '',
    date_of_birth: '',
    gender: '',
  });

  const [convertFormData, setConvertFormData] = useState({
    password: '',
    email: '',
    address: '',
    nic: '',
    blood_group: '',
    date_of_birth: '',
    gender: '',
    profile_picture: '',
  });

  const [tempPatientForm, setTempPatientForm] = useState({
    name: '',
    phone_number: '',
    email: '',
  });

  const [searchTerm, setSearchTerm] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female'];

  const resetForm = () => {
    setFormData({
      hospital_patient_id: '',
      patient_id: '',
      password: '',
      name: '',
      profile_picture: '',
      email: '',
      phone_number: '',
      address: '',
      nic: '',
      blood_group: '',
      date_of_birth: '',
      gender: '',
    });
  };

  const handleAddPatient = () => {
    if (viewMode === 'temp') {
      // Handle temp patient creation
      handleAddTempPatient();
    } else {
      // Handle normal patient creation
      setEditingPatient(null);
      resetForm();
      setShowOverlay(true);
    }
  };

  const handleAddTempPatient = () => {
    // Set temp patient form to default and show temp patient overlay
    setShowTempPatientOverlay(true);
    setTempPatientForm({
      name: '',
      phone_number: '',
      email: ''
    });
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setFormData({ ...patient });
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setEditingPatient(null);
    resetForm();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editingPatient) {
      try {
        const response = await apiClient.put(
          `/patients/${editingPatient.patient_id}`,
          {
            name: formData.name,
            profile_picture: formData.profile_picture,
            email: formData.email,
            phone_number: formData.phone_number,
            address: formData.address,
            nic: formData.nic,
            blood_group: formData.blood_group,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender
          },
          {
            withCredentials: true,
            headers: {
              "Content-type": "application/json"
            }
          }
        );
        if (response.status != 202) {
          throw new Error("Error updating patient");
        }
        const updatedPatient = response.data;
        toast.success("Patient Updated Successfully");
        
        // Update existing patient
        setPatients(prev =>
          prev?.map(patient =>
            patient.patient_id === editingPatient.patient_id
              ? updatedPatient
              : patient
          )
        );
      }
      catch (err: any) {
        toast.error(err.message);
      }
      finally {

      }
    } else {
      // Add new patient
      const newPatientId = `P${String(patients.length + 1).padStart(3, '0')}`;
      try {
        const response = await apiClient.post(
          `/patients`, {
          hospital_patient_id: formData.hospital_patient_id,
          patient_id: newPatientId,
          name: formData.name,
          profile_picture: formData.profile_picture,
          email: formData.email,
          phone_number: formData.phone_number,
          address: formData.address,
          nic: formData.nic,
          blood_group: formData.blood_group,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
        },
          {
            withCredentials: true,
            headers: {
              "Content-type": "application/json"
            }
          }
        );
        if (response.status != 201) {
          throw new Error("Error Creating Patient");
        }

        else {
          const newPatient = response.data;
          toast.success("Patient Created Successfully");
          setPatients(prev => [...prev, newPatient]);
        }
      }
      catch (err: any) {
        if (err.response?.status === 409) {
          toast.error("User Already Exists");
        } else {
          toast.error(err.message);
        }
      }

      finally {

      }
    }

    handleCloseOverlay();
  };

  const handleDeletePatient = async (patientId: string) => {
    try {
      const response = await apiClient.delete(
        `/patients/${patientId}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setPatients(prev => prev.filter(patient => patient.patient_id !== patientId));
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {

    }
  };

  const handleDeleteTempPatient = async (patientId: string) => {
    setDeletingTempPatient(true);
    setDeletingTempPatientID(patientId);
    try {
      const response = await apiClient.delete(
        `/temp-patients/${patientId}`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setTempPatients(prev => prev.filter(patient => patient.temp_patient_id !== patientId));
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setDeletingTempPatient(false);
      setDeletingTempPatientID("");
    }
  };

  const handleConvertTempPatient = (tempPatient: TempPatient) => {
    setConvertingTempPatient(tempPatient);
    setConvertFormData({
      password: '',
      email: tempPatient.email || '',
      address: '',
      nic: '',
      blood_group: '',
      date_of_birth: '',
      gender: '',
      profile_picture: '',
    });
    setShowConvertOverlay(true);
  };

  const handleConvertSubmit = async () => {
    if (!convertingTempPatient) return;

    // Basic validation
    if (!convertFormData.email) {
      toast.error("Email is required for patient conversion");
      return;
    }

    try {
      const response = await apiClient.post(
        `/temp-patients/${convertingTempPatient.temp_patient_id}/convert`,
        convertFormData,
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );

      if (response.status !== 201) {
        throw new Error("Error converting temp patient");
      }

      toast.success("Temp patient converted to a patient successfully!");
      // Update any appointments for this temp patient to 'confirmed' status
      try {
        const updateResponse = await apiClient.put(
          `/appointments/update-temp-to-patient/${convertingTempPatient.temp_patient_id}`,
          { status: 'confirmed' },
          {
            withCredentials: true,
            headers: {
              "Content-type": "application/json"
            }
          }
        );

        if (updateResponse.status !== 200) {
          console.warn("Warning: Could not update appointment status");
        }
      } catch (updateError) {
        console.error("Error updating appointment status:", updateError);
      }

      // Refresh both lists
      fetchPatients();
      fetchTempPatients();

      setShowConvertOverlay(false);
      setConvertingTempPatient(null);
    }
    catch (err: any) {
      if (err.response?.status === 409) {
        toast.error("Email or NIC already exists");
      } else {
        toast.error(err.message);
      }
    }
  };

  const handleConvertInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setConvertFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTempPatientInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setTempPatientForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTempPatientSubmit = async () => {
    // Basic validation
    if (!tempPatientForm.name || !tempPatientForm.phone_number) {
      toast.error("Name and phone number are required");
      return;
    }

    try {
      const response = await apiClient.post(
        `/temp-patients`,
        tempPatientForm,
        {
          withCredentials: true,
          headers: {
            "Content-type": "application/json"
          }
        }
      );

      if (response.status !== 201) {
        throw new Error("Error creating temp patient");
      }

      toast.success("Temp patient created successfully!");

      // Refresh temp patients list
      fetchTempPatients();

      setShowTempPatientOverlay(false);
      setTempPatientForm({
        name: '',
        phone_number: '',
        email: '',
      });
    }
    catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to create temp patient");
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone_number.includes(searchTerm) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTempPatients = tempPatients
    .filter(patient => !patient.converted_to) // Filter out converted patients
    .map(patient => ({
      ...patient,
      highlighted: searchParams?.get('tempPatientId') === patient.temp_patient_id
    }))
    .filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.temp_patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (patient.phone_number && patient.phone_number.includes(searchTerm))
    );

  const getInitials = (name: string) => {
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
  };

  const fetchPatients = async () => {
    setLoadingPatient(true);
    try {
      const response = await apiClient.get(
        `/patients`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setPatients(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingPatient(false);
    }
  };

  const fetchTempPatients = async () => {
    setLoadingPatient(true);
    try {
      const response = await apiClient.get(
        `/temp-patients`
      );
      if (response.status == 500) {
        throw new Error("Internal Server Error");
      }
      setTempPatients(response.data);
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setLoadingPatient(false);
    }
  };

  // Fetch functions for patient details overlay
  const fetchPatientMedicalHistory = async (patient_id: string) => {
    setLoadingMedicalHistory(true);
    try {
      const response = await apiClient.get(`/medical-history/${patient_id}`);
      if (response.status === 200) {
        setMedicalHistory(response.data);

        // Extract critical conditions
        const criticalConditions: string[] = [];
        const criticalKeywords = ['heart', 'diabetes', 'hypertension', 'cancer', 'epilepsy', 'asthma', 'kidney', 'liver'];

        response.data.forEach((item: MedicalHistory) => {
          if (item.medical_question_answer.toLowerCase() === 'yes') {
            const question = item.question.question.toLowerCase();
            criticalKeywords.forEach(keyword => {
              if (question.includes(keyword)) {
                criticalConditions.push(item.question.question);
              }
            });
          }
        });

        setCriticalConditions([{ patientId: patient_id, conditions: criticalConditions }]);
      }
    } catch (err: any) {
      toast.error('Failed to fetch medical history');
    } finally {
      setLoadingMedicalHistory(false);
    }
  };

  const fetchPatientMedicalReports = async (patient_id: string) => {
    setLoadingMedicalReports(true);
    try {
      const response = await apiClient.get(`/medical-reports/forpatient/${patient_id}`);
      if (response.status === 200) {
        setMedicalReports(response.data);
      }
    } catch (err: any) {
      toast.error('Failed to fetch medical reports');
    } finally {
      setLoadingMedicalReports(false);
    }
  };

  const fetchPatientSOAPNotes = async (patient_id: string) => {
    setLoadingSOAPNotes(true);
    try {
      const response = await apiClient.get(`/soap-notes/forpatient/${patient_id}`);
      if (response.status === 200) {
        setSoapNotes(response.data);
      }
    } catch (err: any) {
      toast.error('Failed to fetch SOAP notes');
    } finally {
      setLoadingSOAPNotes(false);
    }
  };

  // Fetch consent forms
  const fetchPatientConsentForms = async (patient_id: string) => {
    try {
      const response = await apiClient.get(`/consent-forms/patient/${patient_id}`);
      if (response.status === 200) {
        setConsentForms(response.data);
      }
    } catch (err: any) {
      toast.error('Failed to fetch consent forms');
    }
  };

  // Handle patient selection for details overlay
  const handlePatientDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setActiveTab('details');
    setShowPatientDetailsOverlay(true);

    // Fetch patient data
    fetchPatientMedicalHistory(patient.patient_id);
    fetchPatientMedicalReports(patient.patient_id);
    fetchPatientSOAPNotes(patient.patient_id);
    fetchPatientConsentForms(patient.patient_id);
  };
  const closePatientDetailsOverlay = () => {
    setShowPatientDetailsOverlay(false);
    setSelectedPatient(null);
    setMedicalHistory([]);
    setMedicalReports([]);
    setSoapNotes([]);
    setCriticalConditions([]);
    setConsentForms([]);
  };

  useEffect(() => {
    fetchPatients();
    fetchTempPatients();
  }, []);

    useEffect(() => {
      const id = searchParams.get("tempPatientId");
      if (id) {
        setTempPatientId(id);
      }
    }, [searchParams]);
  
    useEffect(() => {
      if (!tempPatients.length) return;
      if (!tempPatientId) return;
  
      const match = tempPatients.find(temp => temp.temp_patient_id === tempPatientId);
      if (match) {
        setViewMode("temp");
        handleConvertTempPatient(match);
  
        // Clear the query param from the URL
        router.replace("/admin/patients");
      }
    }, [tempPatientId, tempPatients]);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Session Expired", { description: "Please Login" });
      router.push("/login");
    }
    else if (user.role != "admin") {
      toast.error("Access Denied", { description: "You do not have access to this user role" });
      router.push("/login");
    }
  }, [isLoadingAuth]);


  return (
    <div className="min-h-screen bg-gray-50  p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:hidden">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Patient Directory</h1>
            <p className="text-gray-600 mt-1">Manage patient details</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('full')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'full'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Patients
            </button>
            <button
              onClick={() => setViewMode('temp')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'temp'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Temp Patients
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-4/5">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={`Search ${viewMode === 'full' ? 'patients' : 'temp patients'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-lg "
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <Button
            onClick={handleAddPatient}
            className="bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Patient
          </Button>

        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-green-50 px-6 py-3 border-b border-green-200">
            <div className="grid grid-cols-8 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-1">Profile</div>
              <div className="col-span-1">{viewMode === 'full' ? 'Patient ID' : 'Temp ID'}</div>
              <div className="col-span-1">Name</div>
              <div className="col-span-2">{viewMode === 'full' ? 'Address' : 'Phone'}</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-1">Action</div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loadingPatient ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading patients...</p>
              </div>
            ) : viewMode === 'full' ? (
              filteredPatients.map((patient) => (
                <div key={patient.patient_id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-8 gap-4 items-center">
                    <div className="flex items-center justify-start col-span-1">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden">
                          {patient.profile_picture ? (
                            <Image
                              src={patient.profile_picture.startsWith('http')
                                ? patient.profile_picture
                                : `${backendURL}${patient.profile_picture}`}
                              alt={patient.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.parentElement?.querySelector('.initials-fallback') as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className={`initials-fallback w-full h-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium ${patient.profile_picture ? 'hidden' : 'flex'}`}
                          >
                            {getInitials(patient.name)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-900 col-span-1">{patient.patient_id}</div>
                    <div className="text-sm text-gray-900 col-span-1">{patient.name}</div>
                    <div className="text-sm text-gray-600 col-span-2">{patient.address}</div>
                    <div className="text-sm text-gray-600 col-span-2 truncate" title={patient.email}>
                      {patient.email}
                    </div>
                    <div className="flex items-center gap-2 col-span-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePatientDetails(patient)}
                        className="p-1 h-8 w-8 text-green-600 hover:text-green-700"
                        title="View Patient Details"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPatient(patient)}
                        className="p-1 h-8 w-8 text-blue-600 hover:text-blue-600"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toast.success("Patient deleted successfully");
                          handleDeletePatient(patient.patient_id)
                        }}
                        className="p-1 h-8 w-8 text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              filteredTempPatients.map((tempPatient) => (
                <div key={tempPatient.temp_patient_id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-8 gap-4 items-center justify-center">
                    <div className="flex items-center justify-start col-span-1">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-medium">
                        {getInitials(tempPatient.name)}
                      </div>
                    </div>
                    <div className="text-sm  text-gray-900 col-span-1">{tempPatient.temp_patient_id}</div>
                    <div className="text-sm  text-gray-900 col-span-1">{tempPatient.name}</div>
                    <div className="text-sm  text-gray-600 col-span-2">{tempPatient.phone_number}</div>
                    <div className="text-sm  text-gray-600 col-span-2 truncate" title={tempPatient.email || 'No email'}>
                      {tempPatient.email || 'No email'}
                    </div>
                    <div className="flex items-center gap-2 col-span-1">
                      <Button
                        onClick={() => handleConvertTempPatient(tempPatient)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 h-8"
                      >
                        Register
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDeleteTempPatient(tempPatient.temp_patient_id)}
                        className="p-1 h-8 w-8 text-red-500 hover:text-red-600"
                        disabled={deletingTempPatient && deletingTempPatientID == tempPatient.temp_patient_id}
                      >
                        {deletingTempPatient && deletingTempPatientID == tempPatient.temp_patient_id ? <Loader /> : <Trash2 />}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )
            }

            {viewMode === 'temp' && filteredTempPatients.length === 0 && (
              <div className="px-6 py-6  justify-center items-center text-center text-gray-500 text-sm">
                No temp patients yet.
              </div>
            )}

           
            {viewMode === 'full' && filteredPatients.length === 0 && (
              <div className="px-6 py-6 justify-center items-center text-center text-gray-500 text-sm">
                No patients yet.
              </div>
            )}

          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {loadingPatient ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading patients...</p>
            </div>
          ) : viewMode === 'full' ? (
            filteredPatients.map((patient) => (
              <div key={patient.patient_id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500">
                        {patient.profile_picture ? (
                          <Image
                            src={patient.profile_picture.startsWith('http')
                              ? patient.profile_picture
                              : `${backendURL}${patient.profile_picture}`}
                            alt={patient.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.initials-fallback') as HTMLElement;
                              if (fallback) {
                                fallback.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={`initials-fallback w-full h-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-medium text-lg ${patient.profile_picture ? 'hidden' : 'flex'}`}
                        >
                          {getInitials(patient.name)}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                      <p className="text-sm text-gray-500">{patient.patient_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePatientDetails(patient)}
                      className="p-2 h-8 w-8 text-green-600 hover:text-green-700"
                      title="View Patient Details"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPatient(patient)}
                      className="p-2 h-8 w-8 text-blue-600 hover:text-blue-600"
                    >
                      <Edit size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePatient(patient.patient_id)}
                      className="p-2 h-8 w-8 text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{patient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{patient.phone_number}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{patient.address}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User size={16} />
                      <span>{patient.gender}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Droplets size={16} />
                      <span>{patient.blood_group}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>{patient.date_of_birth}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredTempPatients.map((tempPatient) => (
              <div key={tempPatient.temp_patient_id} className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-medium text-lg border-2 border-orange-300">
                      {getInitials(tempPatient.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tempPatient.name}</h3>
                      <p className="text-sm text-gray-500">{tempPatient.temp_patient_id}</p>
                      <p className="text-xs text-orange-600 font-medium">Temporary Patient</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleConvertTempPatient(tempPatient)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2"
                  >
                    Register
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone size={16} />
                    <span>{tempPatient.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={16} />
                    <span>{tempPatient.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>Created: {new Date(tempPatient.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Overlay Form */}
        {showOverlay && (
          <Dialog open={showOverlay} onOpenChange={setShowOverlay}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  {editingPatient ? 'Edit Patient' : 'Add New Patient'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hospital_patient_id" className="text-sm font-medium">Hospital Patient ID</Label>
                    <Input
                      id="hospital_patient_id"
                      name="hospital_patient_id"
                      value={formData.hospital_patient_id}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  {/* <div className="space-y-2">
                    <Label htmlFor="patient_id" className="text-sm font-medium">Patient ID</Label>
                    <Input
                      id="patient_id"
                      name="patient_id"
                      value={formData.patient_id}
                      onChange={handleInputChange}
                      disabled={editingPatient ? true : false}
                      className="w-full"
                    />
                  </div>*/}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone_number" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nic" className="text-sm font-medium">NIC</Label>
                    <Input
                      id="nic"
                      name="nic"
                      value={formData.nic}
                      onChange={handleInputChange}
                      className="w-full"
                      disabled={editingPatient !== null}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="blood_group" className="text-sm font-medium">Blood Group</Label>
                    <Select
                      value={formData.blood_group}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, blood_group: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Blood Group" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map(group => (
                          <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth" className="text-sm font-medium">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">Gender</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map(gender => (
                          <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password </Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_picture" className="text-sm font-medium">Profile Picture URL</Label>
                  <Input
                    id="profile_picture"
                    type="url"
                    name="profile_picture"
                    value={formData.profile_picture}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>*/}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseOverlay}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
                  >
                    {editingPatient ? 'Update Patient' : 'Add Patient'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Convert Temp Patient Overlay */}
        {showConvertOverlay && convertingTempPatient && (
          <Dialog open={showConvertOverlay} onOpenChange={setShowConvertOverlay}>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  Convert Temp Patient to a Patient
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Converting: <span className="font-medium">{convertingTempPatient.name}</span>
                </p>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="convert_email" className="text-sm font-medium">Email *</Label>
                    <Input
                      id="convert_email"
                      name="email"
                      type="email"
                      value={convertFormData.email}
                      onChange={handleConvertInputChange}
                      required
                      className="w-full"
                    />
                  </div>

                  {/*<div className="space-y-2">
                    <Label htmlFor="convert_password" className="text-sm font-medium">Password</Label>
                    <Input
                      id="convert_password"
                      name="password"
                      type="password"
                      value={convertFormData.password}
                      onChange={handleConvertInputChange}
                      placeholder="Leave empty to auto-generate"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">If left empty, a password will be auto-generated</p>
                  </div>*/}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="convert_address" className="text-sm font-medium">Address</Label>
                  <Textarea
                    id="convert_address"
                    name="address"
                    value={convertFormData.address}
                    onChange={handleConvertInputChange}
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="convert_nic" className="text-sm font-medium">NIC</Label>
                    <Input
                      id="convert_nic"
                      name="nic"
                      value={convertFormData.nic}
                      onChange={handleConvertInputChange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="convert_blood_group" className="text-sm font-medium">Blood Group</Label>
                    <select
                      id="convert_blood_group"
                      name="blood_group"
                      value={convertFormData.blood_group}
                      onChange={handleConvertInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Blood Group</option>
                      {bloodGroups.map((group) => (
                        <option key={group} value={group}>
                          {group}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="convert_date_of_birth" className="text-sm font-medium">Date of Birth</Label>
                    <Input
                      id="convert_date_of_birth"
                      name="date_of_birth"
                      type="date"
                      value={convertFormData.date_of_birth}
                      onChange={handleConvertInputChange}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="convert_gender" className="text-sm font-medium">Gender</Label>
                    <select
                      id="convert_gender"
                      name="gender"
                      value={convertFormData.gender}
                      onChange={handleConvertInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select Gender</option>
                      {genders.map((gender) => (
                        <option key={gender} value={gender}>
                          {gender}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowConvertOverlay(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConvertSubmit}
                    className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
                  >
                    Convert to a Patient
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Temp Patient Overlay */}
        {showTempPatientOverlay && (
          <Dialog open={showTempPatientOverlay} onOpenChange={setShowTempPatientOverlay}>
            <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">
                  Add Temporary Patient
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Create a temporary patient record
                </p>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="temp_name" className="text-sm font-medium">Name *</Label>
                  <Input
                    id="temp_name"
                    name="name"
                    type="text"
                    value={tempPatientForm.name}
                    onChange={handleTempPatientInputChange}
                    required
                    placeholder="Enter patient name"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temp_phone" className="text-sm font-medium">Phone Number *</Label>
                  <Input
                    id="temp_phone"
                    name="phone_number"
                    type="tel"
                    value={tempPatientForm.phone_number}
                    onChange={handleTempPatientInputChange}
                    required
                    placeholder="Enter phone number"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temp_email" className="text-sm font-medium">Email (Optional)</Label>
                  <Input
                    id="temp_email"
                    name="email"
                    type="email"
                    value={tempPatientForm.email}
                    onChange={handleTempPatientInputChange}
                    placeholder="Enter email address"
                    className="w-full"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowTempPatientOverlay(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTempPatientSubmit}
                    className="bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto"
                  >
                    Create Temp Patient
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Patient Details Overlay */}
        <PatientDetailsOverlay
          selectedPatient={selectedPatient!}
          isOpen={showPatientDetailsOverlay}
          onClose={closePatientDetailsOverlay}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          medicalHistory={medicalHistory}
          medicalReports={medicalReports}
          soapNotes={soapNotes}
          criticalConditions={criticalConditions}
          consentForms={consentForms}
          loadingMedicalHistory={loadingMedicalHistory}
          loadingMedicalReports={loadingMedicalReports}
          loadingSOAPNotes={loadingSOAPNotes}
          onRefreshMedicalHistory={fetchPatientMedicalHistory}
          onRefreshMedicalReports={fetchPatientMedicalReports}
          onRefreshSOAPNotes={fetchPatientSOAPNotes}
          onRefreshConsentForms={fetchPatientConsentForms}
          user={user}
          apiClient={apiClient}
          backendURL={backendURL || ''}
        />
      </div>
    </div>
  );
};

export default PatientManagement;