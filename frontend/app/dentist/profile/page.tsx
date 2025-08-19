"use client";

import React, { useEffect, useState, useContext } from 'react';
import { User, Mail, Phone, Lock, Shield, Camera, X as CloseIcon, Search, Plus, Check } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Carattere } from 'next/font/google';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface InvoiceService {
  service_id: number;
  service_name: string;
  amount: number;
  description?: string;
  ref_code: string;
  tax_type?: string;
  tax_percentage: number;
  treatment_group?: number;
  treatment_type?: string;
  Consumable_charge?: number;
  Lab_charge?: number;
  is_active: boolean;
  duration?: number;
  treatment?: {
    no: number;
    treatment_group: string;
  };
}

interface DentistData {
  dentist_id: string;
  email: string;
  name: string;
  phone_number: string;
  profile_picture: string | null;
  appointment_fee: number;
  appointment_duration: string;
  work_days_from: string;
  work_days_to: string;
  work_time_from: string;
  work_time_to: string
}

const ProfilePage = () => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const { user, isLoadingAuth, apiClient, isLoggedIn } = useContext(AuthContext);
  const [DentistData, setDentistData] = useState<DentistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [assignedServices, setAssignedServices] = useState<InvoiceService[]>([]);
  const [allServices, setAllServices] = useState<InvoiceService[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [selectedTreatmentGroup, setSelectedTreatmentGroup] = useState<string>('all');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [editedData, setEditedData] = useState({
    firstName: '',
    lastName: '',
    phone_number: '',
    newProfilePicture: null as File | null,
    newProfilePicturePreview: '' as string,
    appointment_fee: 0,
    appointment_duration: '',
    work_days_from: '',
    work_days_to: '',
    work_time_from: '',
    work_time_to: ''
  });
  const router = useRouter();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!isLoggedIn) {
      toast.error("Please Log in");
      router.push("/login");
      return;
    }
    else if (user.role !== "dentist") {
      toast.error("Access Denied");
      router.push("/login");
      return;
    }
    fetchDentistData();
    fetchServices();
  }, [isLoadingAuth]);

  const fetchDentistData = async () => {
    try {
      const response = await apiClient.get(
        `/dentists/${user?.id}`
      );

      setDentistData(response.data);

      const [firstName, ...lastNameParts] = response.data.name.split(" ");
      setEditedData({
        firstName,
        lastName: lastNameParts.join(" "),
        phone_number: response.data.phone_number,
        newProfilePicture: null,
        newProfilePicturePreview: '',
        appointment_fee: response.data.appointment_fee,
        appointment_duration: response.data.appointment_duration,
        work_days_from: response.data.work_days_from,
        work_days_to: response.data.work_days_to,
        work_time_from: response.data.work_time_from,
        work_time_to: response.data.work_time_to
      });
    } catch (error: any) {
      toast.error("Failed to fetch profile data", {
        description: error.response?.data?.error || "An error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    if (!user?.id) return;
    
    setLoadingServices(true);
    try {
      // Fetch all available services
      const allServicesResponse = await apiClient.get('/invoice-services');
      console.log('All services response:', allServicesResponse.data);
      
      // Don't filter by is_active - show all services for selection
      setAllServices(allServicesResponse.data);

      // Fetch services assigned to this dentist
      const assignedResponse = await apiClient.get(`/dentist-service-assign/dentist/${user.id}`);
      console.log('Assigned services response:', assignedResponse.data);
      
      const assignedServicesList = assignedResponse.data.map((assignment: any) => assignment.invoice_services);
      setAssignedServices(assignedServicesList);
      setSelectedServiceIds(assignedServicesList.map((service: InvoiceService) => service.service_id));
    } catch (error: any) {
      console.error('Error fetching services:', error);
      toast.error("Failed to fetch services", {
        description: error.response?.data?.error || "An error occurred"
      });
    } finally {
      setLoadingServices(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (DentistData) {
      const [firstName, ...lastNameParts] = DentistData.name.split(" ");
      setEditedData({
        firstName,
        lastName: lastNameParts.join(" "),
        phone_number: DentistData.phone_number,
        newProfilePicture: null,
        newProfilePicturePreview: '',
        appointment_fee: DentistData.appointment_fee,
        appointment_duration: DentistData.appointment_duration,
        work_days_from: DentistData.work_days_from,
        work_days_to: DentistData.work_days_to,
        work_time_from: DentistData.work_time_from,
        work_time_to: DentistData.work_time_to
      });
    }
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large", {
          description: "Please select an image under 5MB"
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid file type", {
          description: "Please select an image file"
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedData(prev => ({
          ...prev,
          newProfilePicture: file,
          newProfilePicturePreview: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setEditedData(prev => ({
      ...prev,
      newProfilePicture: null,
      newProfilePicturePreview: ''
    }));
  };

  const handleSave = async () => {
    if (!DentistData || !user?.id) return;

    setSavingProfile(true);
    try {
      let profilePicturePath = DentistData.profile_picture;

      // If there's a new profile picture, upload it first
      if (editedData.newProfilePicture) {
        const formData = new FormData();
        formData.append('image', editedData.newProfilePicture);

        const uploadResponse = await apiClient.post(
          `/photos`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (uploadResponse.data.url) {
          profilePicturePath = uploadResponse.data.url;
        }
      }

      // Update dentist information
      const response = await apiClient.put(`/dentists/${user.id}`, {
        name: `${editedData.firstName} ${editedData.lastName}`.trim(),
        phone_number: editedData.phone_number,
        profile_picture: profilePicturePath,
        appointment_fee: editedData.appointment_fee,
        appointment_duration: editedData.appointment_duration,
        work_days_from: editedData.work_days_from,
        work_days_to: editedData.work_days_to,
        work_time_from: editedData.work_time_from,
        work_time_to: editedData.work_time_to
      });

      // Update service assignments
      await apiClient.put(`/dentist-service-assign/dentist/${user.id}`, {
        service_ids: selectedServiceIds
      });

      setDentistData(response.data);
      await fetchServices(); // Refresh services
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Failed to update profile", {
        description: error.response?.data?.error || "An error occurred"
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const getSelectedServicesText = () => {
    if (selectedServiceIds.length === 0) return "No services selected";
    if (selectedServiceIds.length === 1) {
      const service = allServices.find(s => s.service_id === selectedServiceIds[0]);
      return service?.service_name || "1 service selected";
    }
    return `${selectedServiceIds.length} services selected`;
  };

  const getFilteredServices = () => {
    let filtered = allServices;

    // Filter by search query
    if (serviceSearchQuery) {
      filtered = filtered.filter(service =>
        service.service_name.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
        service.description?.toLowerCase().includes(serviceSearchQuery.toLowerCase()) ||
        service.ref_code.toLowerCase().includes(serviceSearchQuery.toLowerCase())
      );
    }

    // Filter by treatment group
    if (selectedTreatmentGroup !== 'all') {
      filtered = filtered.filter(service => 
        service.treatment?.treatment_group === selectedTreatmentGroup
      );
    }

    return filtered;
  };

  const getTreatmentGroups = () => {
    const groups = new Set<string>();
    allServices.forEach(service => {
      if (service.treatment?.treatment_group) {
        groups.add(service.treatment.treatment_group);
      }
    });
    return Array.from(groups).sort();
  };

  const removeService = (serviceId: number) => {
    setSelectedServiceIds(prev => prev.filter(id => id !== serviceId));
  };

  const handleChangePassword = () => {
    if (DentistData?.email) {
      router.push(`/changepassword?email=${encodeURIComponent(DentistData.email)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!DentistData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">No profile data found</div>
      </div>
    );
  }

  // Split the full name into first and last name for display
  const [firstName, ...lastNameParts] = DentistData.name.split(" ");
  const lastName = lastNameParts.join(" ");

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-white px-6 py-8 sm:px-8">
            <div className="text-center">
              {/* Profile Avatar */}
              <div className="relative mx-auto h-24 w-24 rounded-full border-2 border-emerald-500 overflow-hidden group">
                {(editedData.newProfilePicturePreview || DentistData.profile_picture) ? (
                  <>
                    <img
                      src={editedData.newProfilePicturePreview || `${process.env.NEXT_PUBLIC_BACKEND_URL}${DentistData.profile_picture}`}
                      alt={DentistData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                    <div
                      className="initials-fallback w-full h-full bg-emerald-100 text-emerald-700 flex:hidden items-center justify-center font-medium text-2xl hidden"
                    >
                      {DentistData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-emerald-100 flex items-center justify-center">
                    <User className="h-12 w-12 text-emerald-700" />
                  </div>
                )}

                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label htmlFor="profile-picture" className="cursor-pointer p-2 rounded-full bg-white bg-opacity-90 hover:bg-opacity-100">
                      <Camera className="h-5 w-5 text-gray-700" />
                    </label>
                    <input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {isEditing && editedData.newProfilePicturePreview && (
                <button
                  onClick={handleRemoveImage}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center justify-center mx-auto space-x-1"
                >
                  <CloseIcon className="h-4 w-4" />
                  <span>Remove new image</span>
                </button>
              )}

              {/* Name and Email */}
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
                {DentistData.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-1">
                <span className="text-gray-800">{DentistData.dentist_id}</span>
              </p>
              <p className="text-sm sm:text-base text-gray-500">
                {DentistData.email}
              </p>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
              {!isEditing ? (
                <Button
                  onClick={handleEdit}
                  variant="outline"
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button
                    onClick={handleSave}
                    variant="default"
                    className="text-sm bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={savingProfile}
                  >
                    {savingProfile ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.firstName : firstName}
                    onChange={(e) => setEditedData({ ...editedData, firstName: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editedData.lastName : lastName}
                    onChange={(e) => setEditedData({ ...editedData, lastName: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={DentistData.email}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={isEditing ? editedData.phone_number : DentistData.phone_number}
                    onChange={(e) => setEditedData({ ...editedData, phone_number: e.target.value })}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Work Information Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Work Information</h2>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Work Days From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Days - From
                  </label>
                  <Select
                    disabled={!isEditing}
                    value={editedData.work_days_from}
                    onValueChange={(value) =>
                      setEditedData({ ...editedData, work_days_from: value })
                    }
                  >
                    <SelectTrigger className="focus:ring-emerald-200">
                      <SelectValue placeholder="Select Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek
                        .filter((d) => !editedData.work_days_to || d !== editedData.work_days_to)
                        .map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Work Days To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Days - To
                  </label>
                  <Select
                    disabled={!isEditing}
                    value={editedData.work_days_to}
                    onValueChange={(value) =>
                      setEditedData({ ...editedData, work_days_to: value })
                    }
                  >
                    <SelectTrigger className="focus:ring-emerald-200">
                      <SelectValue placeholder="Select Day" />
                    </SelectTrigger>
                    <SelectContent>
                      {daysOfWeek
                        .filter((d) => !editedData.work_days_from || d !== editedData.work_days_from)
                        .map((day) => (
                          <SelectItem key={day} value={day}>
                            {day}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Work Hours From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Hours - From
                  </label>
                  <Input
                    readOnly={!isEditing}
                    id="workTimeFrom"
                    type="time"
                    value={editedData.work_time_from}
                    onChange={(e) => setEditedData({ ...editedData, work_time_from: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>

                {/* Work Hours To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Hours - To
                  </label>
                  <Input
                    readOnly={!isEditing}
                    id="workTimeFrom"
                    type="time"
                    value={editedData.work_time_to}
                    onChange={(e) => setEditedData({ ...editedData, work_time_to: e.target.value })}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                    } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Services Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">Assigned Services</h2>
            </div>

            <div className="space-y-6">
              {/* Services Display/Edit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services
                </label>
                {isEditing ? (
                  <div className="space-y-3">
                    {/* Selected Services Display */}
                    {selectedServiceIds.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-600">Selected Services:</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedServiceIds.map(serviceId => {
                            const service = allServices.find(s => s.service_id === serviceId);
                            if (!service) return null;
                            return (
                              <Badge
                                key={serviceId}
                                variant="secondary"
                                className="flex items-center gap-1 px-2 py-1"
                              >
                                <span className="text-xs">{service.service_name}</span>
                                <button
                                  onClick={() => removeService(serviceId)}
                                  className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                >
                                  <CloseIcon className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Add Services Button */}
                    <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-center"
                          disabled={loadingServices}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          {loadingServices ? "Loading services..." : "Add Services"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>Select Services</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Search and Filter Controls */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="Search services..."
                                value={serviceSearchQuery}
                                onChange={(e) => setServiceSearchQuery(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            <Select
                              value={selectedTreatmentGroup}
                              onValueChange={setSelectedTreatmentGroup}
                            >
                              <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter by category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {getTreatmentGroups().map(group => (
                                  <SelectItem key={group} value={group}>
                                    {group}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Services Grid */}
                          <div className="max-h-96 overflow-y-auto border rounded-lg">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                              {getFilteredServices().map((service) => (
                                <div
                                  key={service.service_id}
                                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                    selectedServiceIds.includes(service.service_id)
                                      ? 'border-teal-500 bg-teal-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                  onClick={() => handleServiceToggle(service.service_id)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          checked={selectedServiceIds.includes(service.service_id)}
                                          onChange={() => handleServiceToggle(service.service_id)}
                                        />
                                        <div className="font-medium text-sm text-gray-900 truncate">
                                          {service.service_name}
                                        </div>
                                      </div>
                                      <div className="mt-1 text-xs text-gray-500">
                                        <div className="font-semibold text-teal-600">
                                          Rs {service.amount.toFixed(2)}
                                        </div>
                                        {service.description && (
                                          <div className="mt-1 line-clamp-2">
                                            {service.description}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                            {service.ref_code}
                                          </span>
                                          {service.treatment && (
                                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                              {service.treatment.treatment_group}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {selectedServiceIds.includes(service.service_id) && (
                                      <Check className="h-4 w-4 text-teal-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {getFilteredServices().length === 0 && (
                              <div className="p-8 text-center text-gray-500">
                                <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <div className="text-sm">
                                  {serviceSearchQuery || selectedTreatmentGroup !== 'all'
                                    ? 'No services match your search criteria'
                                    : 'No services available'
                                  }
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Summary */}
                          <div className="flex items-center justify-between pt-3 border-t">
                            <div className="text-sm text-gray-600">
                              {selectedServiceIds.length} service{selectedServiceIds.length !== 1 ? 's' : ''} selected
                            </div>
                            <Button
                              onClick={() => setServicesDialogOpen(false)}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
                              Done
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedServices.length > 0 ? (
                      assignedServices.map((service) => (
                        <div key={service.service_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {service.service_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              Rs {service.amount.toFixed(2)}
                              {service.description && ` • ${service.description}`}
                            </div>
                          </div>
                          {service.treatment && (
                            <div className="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">
                              {service.treatment.treatment_group}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500 text-center bg-gray-50 rounded-md">
                        No services assigned
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Password</h2>
              <ChangePasswordDialog userType="dentist" />
            </div>

            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <div className="text-gray-400 text-sm sm:text-base tracking-wider">
                  ••••••••••••••••••••••••••••••••
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;