"use client";

import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Clock, Calendar, DollarSign, Clock as ClockIcon, Save, X, Camera } from 'lucide-react';
import { AuthContext } from '@/context/auth-context';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DentistData {
  dentist_id: string;
  name: string; // Clinic name
  dentist_name?: string; // Dentist's actual name
  email: string;
  phone_number: string;
  language?: string;
  service_types?: string;
  work_days_from: string;
  work_days_to: string;
  work_time_from: string;
  work_time_to: string;
  appointment_duration: string;
  appointment_fee: number;
  clinic_address?: string;
  profile_picture?: string;
}

const AdminProfilePage = () => {
  const { user, apiClient } = useContext(AuthContext);
  const [dentistData, setDentistData] = useState<DentistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [editedData, setEditedData] = useState({
    name: '', // Clinic name
    dentist_name: '', // Dentist's name
    email: '',
    phone_number: '',
    language: '',
    service_types: '',
    clinic_address: '',
    newProfilePicture: null as File | null,
    newProfilePicturePreview: '' as string,
    appointment_fee: 0,
    appointment_duration: '30',
    work_days_from: 'Monday',
    work_days_to: 'Friday',
    work_time_from: '09:00',
    work_time_to: '17:00'
  });

  useEffect(() => {
    fetchDentistProfile();
  }, []);

  const fetchDentistProfile = async () => {
    try {
      const response = await apiClient.get('/admin/dentist/profile');
      if (response.data) {
        setDentistData(response.data);
        setEditedData({
          name: response.data.name || '', // Clinic name
          dentist_name: response.data.dentist_name || '', // Dentist's name
          email: response.data.email || '',
          phone_number: response.data.phone_number || '',
          language: response.data.language || '',
          service_types: response.data.service_types || '',
          clinic_address: response.data.clinic_address || '',
          newProfilePicture: null,
          newProfilePicturePreview: '',
          appointment_fee: response.data.appointment_fee || 0,
          appointment_duration: response.data.appointment_duration || '30',
          work_days_from: response.data.work_days_from || 'Monday',
          work_days_to: response.data.work_days_to || 'Friday',
          work_time_from: response.data.work_time_from || '09:00',
          work_time_to: response.data.work_time_to || '17:00'
        });
      }
    } catch (error: any) {
      console.error('Error fetching dentist profile:', error);
      if (error.response?.status === 404) {
        setDentistData(null);
        setIsEditing(true); // Start in edit mode if no profile exists
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
  
    // Handle number inputs
    if (type === 'number') {
      setEditedData(prev => ({ ...prev, [name]: Number(value) }));
    } 
    // Handle checkbox inputs
    else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setEditedData(prev => ({ ...prev, [name]: target.checked }));
    }
    // Handle all other inputs (text, email, tel, etc.)
    else {
      setEditedData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setEditedData(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (dentistData) {
      setEditedData({
        name: dentistData.name || '', // Clinic name
        dentist_name: dentistData.dentist_name || '', // Dentist's name
        email: dentistData.email || '',
        phone_number: dentistData.phone_number || '',
        language: dentistData.language || '',
        service_types: dentistData.service_types || '',
        clinic_address: dentistData.clinic_address || '',
        newProfilePicture: null,
        newProfilePicturePreview: '',
        appointment_fee: dentistData.appointment_fee || 0,
        appointment_duration: dentistData.appointment_duration || '30',
        work_days_from: dentistData.work_days_from || 'Monday',
        work_days_to: dentistData.work_days_to || 'Friday',
        work_time_from: dentistData.work_time_from || '09:00',
        work_time_to: dentistData.work_time_to || '17:00'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      
      // Add all form data to FormData
      const formFields = {
        name: editedData.name, // Clinic name
        email: editedData.email || dentistData?.email || '',
        phone_number: editedData.phone_number,
        language: editedData.language,
        service_types: editedData.service_types,
        dentist_name: editedData.dentist_name, // Dentist's name
        clinic_address: editedData.clinic_address,
        appointment_fee: editedData.appointment_fee,
        appointment_duration: editedData.appointment_duration,
        work_days_from: editedData.work_days_from,
        work_days_to: editedData.work_days_to,
        work_time_from: editedData.work_time_from,
        work_time_to: editedData.work_time_to,
        existingProfilePicture: dentistData?.profile_picture || ''
      };

      // Append all fields to FormData
      Object.entries(formFields).forEach(([key, value]) => {
        formData.append(key, value !== null && value !== undefined ? value.toString() : '');
      });

      // Append the file if a new one was selected
      if (editedData.newProfilePicture) {
        formData.append('profile_picture', editedData.newProfilePicture);
      }

      // Use apiClient for proper authentication handling
      const response = await apiClient.post('/admin/dentist/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setDentistData(response.data);
      setEditedData(prev => ({
        ...prev,
        newProfilePicture: null,
        newProfilePicturePreview: ''
      }));
      setIsEditing(false);
      toast.success('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!dentistData && !isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">No profile data found</p>
          <Button onClick={() => setIsEditing(true)}>Setup Profile</Button>
        </div>
      </div>
    );
  }

  // Split the full name into first and last name for display
  const firstName = dentistData?.name ? dentistData.name.split(" ")[0] : '';
  const lastName = dentistData?.name ? dentistData.name.split(" ").slice(1).join(" ") : '';

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-white px-6 py-8 sm:px-8">
            <div className="text-center">
              {/* Profile Avatar */}
              <div className="relative mx-auto h-24 w-24 rounded-full border-2 border-emerald-500 overflow-hidden group">
                {(editedData.newProfilePicturePreview || dentistData?.profile_picture) ? (
                  <>
                    <img
                      src={editedData.newProfilePicturePreview || `${process.env.NEXT_PUBLIC_BACKEND_URL}${dentistData?.profile_picture}`}
                      alt={dentistData?.name || 'Profile'}
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
                      {dentistData?.name ? dentistData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD'}
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
                  className="text-sm text-red-600 hover:text-red-700 flex items-center justify-center mx-auto space-x-1 mt-2"
                >
                  <X className="h-4 w-4" />
                  <span>Remove new image</span>
                </button>
              )}

              {/* Name and Email */}
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1 mt-4">
                {dentistData?.name || 'Admin Profile'}
              </h1>
              <p className="text-sm sm:text-base text-gray-700 font-medium mb-1">
                <span className="text-gray-800">{dentistData?.dentist_id || 'dentaxdent001'}</span>
              </p>
              <p className="text-sm sm:text-base text-gray-500">
                {dentistData?.email || 'No email set'}
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
                    onClick={handleSubmit}
                    variant="default"
                    className="text-sm bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    Save
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
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Clinic Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={isEditing ? editedData.name : (dentistData?.name || '')}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>

                {/* Dentist Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dentist's Full Name
                  </label>
                  <input
                    type="text"
                    name="dentist_name"
                    value={isEditing ? editedData.dentist_name : (dentistData?.dentist_name || '')}
                    onChange={handleInputChange}
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
                    name="email"
                    value={isEditing && !dentistData?.email ? editedData.email : (dentistData?.email || '')}
                    onChange={handleInputChange}
                    readOnly={!isEditing || !!dentistData?.email}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing && !dentistData?.email ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing && !dentistData?.email ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                  {dentistData?.email && (
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed once set</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={isEditing ? editedData.phone_number : (dentistData?.phone_number || '')}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>

                

               
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="border-t border-gray-200 px-6 py-6 sm:px-8">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Professional Information</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Appointment Fee 
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Fee (LKR)
                  </label>
                  <input
                    type="number"
                    name="appointment_fee"
                    value={isEditing ? editedData.appointment_fee : (dentistData?.appointment_fee || 0)}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    min="0"
                    step="1"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>*/}

                {/* Appointment Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appointment Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="appointment_duration"
                    value={isEditing ? editedData.appointment_duration : (dentistData?.appointment_duration || 30)}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    min="5"
                    step="5"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Working Days From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days (From)
                  </label>
                  {isEditing ? (
                    <Select
                      value={editedData.work_days_from}
                      onValueChange={(value) => handleSelectChange('work_days_from', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map(day => (
                          <SelectItem key={`from-${day}`} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      type="text"
                      value={dentistData?.work_days_from || 'Monday'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm sm:text-base"
                    />
                  )}
                </div>

                {/* Working Days To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Days (To)
                  </label>
                  {isEditing ? (
                    <Select
                      value={editedData.work_days_to}
                      onValueChange={(value) => handleSelectChange('work_days_to', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {daysOfWeek.map(day => (
                          <SelectItem key={`to-${day}`} value={day}>{day}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <input
                      type="text"
                      value={dentistData?.work_days_to || 'Friday'}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900 text-sm sm:text-base"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Working Hours From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours (From)
                  </label>
                  <input
                    type="time"
                    name="work_time_from"
                    value={isEditing ? editedData.work_time_from : (dentistData?.work_time_from || '09:00')}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>

                {/* Working Hours To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Working Hours (To)
                  </label>
                  <input
                    type="time"
                    name="work_time_to"
                    value={isEditing ? editedData.work_time_to : (dentistData?.work_time_to || '17:00')}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <input
                    type="text"
                    name="language"
                    value={isEditing ? editedData.language : (dentistData?.language || '')}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    placeholder="e.g., English, Sinhala, Tamil"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>

                {/* Service Types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    name="service_types"
                    value={isEditing ? editedData.service_types : (dentistData?.service_types || '')}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    placeholder="e.g., General Dentistry, Orthodontics, Surgery"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>

                {/* Clinic Address */}
                <div className="col-span-full">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Address
                  </label>
                  <textarea
                    name="clinic_address"
                    value={isEditing ? editedData.clinic_address : (dentistData?.clinic_address || '')}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    rows={3}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                    placeholder="Enter full clinic address"
                  />
                </div>

                {/* Dentist Name (Display Name) 
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="dentist_name"
                    value={isEditing ? editedData.dentist_name : (dentistData?.dentist_name || '')}
                    onChange={handleInputChange}
                    readOnly={!isEditing}
                    placeholder="e.g., Dr. John Smith"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">This name will be displayed to patients</p>
                </div>*/}

                {/* Clinic Address 
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clinic Address
                  </label>
                  <textarea
                    name="clinic_address"
                    value={isEditing ? editedData.clinic_address : (dentistData?.clinic_address || '')}
                    onChange={(e) => handleSelectChange('clinic_address', e.target.value)}
                    readOnly={!isEditing}
                    rows={3}
                    placeholder="Enter full clinic address"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-50'
                      } text-gray-900 text-sm sm:text-base ${isEditing ? 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500' : ''
                      }`}
                  />
                </div>*/}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
