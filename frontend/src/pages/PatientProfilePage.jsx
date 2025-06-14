// src/pages/PatientProfilePage.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  MapPinIcon,
  IdentificationIcon,
  HeartIcon,
  DocumentTextIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { getProfile, updateProfile, uploadAvatar } from '../services/api'

export default function PatientProfilePage() {
  const navigate = useNavigate()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact: '',
    blood_type: '',
    allergies: '',
    medical_conditions: '',
    insurance_number: '',
    gender: ''
  })
  const [editedData, setEditedData] = useState({})

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const response = await getProfile()
      setUserData(response.data)
      setEditedData(response.data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedData({ ...userData })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData({ ...userData })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await updateProfile(editedData)
      setUserData(response.data)
      setIsEditing(false)
      
      // Update localStorage
      localStorage.setItem('user_data', JSON.stringify(response.data))
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await uploadAvatar(formData)
      
      // Update user data with new avatar
      setUserData(response.data.user)
      
      // Update localStorage
      localStorage.setItem('user_data', JSON.stringify(response.data.user))
      
      alert('Avatar updated successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return ''
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const ProfileField = ({ icon: Icon, label, value, field, type = 'text', options = null }) => (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="flex items-start space-x-3">
        <Icon className="h-5 w-5 text-gray-500 mt-0.5" />
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
          {isEditing ? (
            type === 'select' ? (
              <select
                value={editedData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select {label}</option>
                {options?.map(option => (
                  typeof option === 'object' ? (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ) : (
                    <option key={option} value={option}>{option}</option>
                  )
                ))}
              </select>
            ) : type === 'textarea' ? (
              <textarea
                value={editedData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <input
                type={type}
                value={editedData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )
          ) : (
            <p className="text-gray-900">
              {type === 'date' ? formatDate(value) : 
               type === 'select' && typeof options?.[0] === 'object' ? 
                 options?.find(opt => opt.value === value)?.label || value :
               value || 'Not provided'}
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                  <p className="text-gray-600 mt-2">Manage your personal information and medical details</p>
                </div>
                <div className="flex space-x-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                      >
                        <CheckIcon className="h-4 w-4" />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Profile Picture & Basic Info */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={
                          userData.avatar_url || 
                          userData.avatar || 
                          `https://i.pravatar.cc/150?u=${userData.email || 'user'}`
                        }
                        alt="Profile"
                        className="w-24 h-24 rounded-full border-4 border-gray-200 mx-auto object-cover"
                      />
                      <input
                        type="file"
                        id="avatar-upload"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <button 
                        onClick={() => document.getElementById('avatar-upload').click()}
                        disabled={uploadingAvatar}
                        className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                      >
                        {uploadingAvatar ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CameraIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mt-4">
                      {userData.first_name} {userData.last_name}
                    </h3>
                    <p className="text-gray-600">Patient</p>
                    {userData.date_of_birth && (
                      <p className="text-sm text-gray-500 mt-2">
                        Age: {calculateAge(userData.date_of_birth)} years
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Info</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Blood Type</span>
                      <span className="font-medium text-red-600">{userData.blood_type || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Gender</span>
                      <span className="font-medium">{userData.gender || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Insurance</span>
                      <span className="font-medium">{userData.insurance_number ? 'Active' : 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Detailed Information */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField
                      icon={UserIcon}
                      label="First Name"
                      value={userData.first_name}
                      field="first_name"
                    />
                    <ProfileField
                      icon={UserIcon}
                      label="Last Name"
                      value={userData.last_name}
                      field="last_name"
                    />
                    <ProfileField
                      icon={EnvelopeIcon}
                      label="Email"
                      value={userData.email}
                      field="email"
                      type="email"
                    />
                    <ProfileField
                      icon={PhoneIcon}
                      label="Phone"
                      value={userData.phone}
                      field="phone"
                      type="tel"
                    />
                    <ProfileField
                      icon={CalendarDaysIcon}
                      label="Date of Birth"
                      value={userData.date_of_birth}
                      field="date_of_birth"
                      type="date"
                    />
                    <ProfileField
                      icon={IdentificationIcon}
                      label="Gender"
                      value={userData.gender}
                      field="gender"
                      type="select"
                      options={[
                        { value: 'M', label: 'Male' },
                        { value: 'F', label: 'Female' },
                        { value: 'O', label: 'Other' }
                      ]}
                    />
                  </div>

                  <div className="mt-6">
                    <ProfileField
                      icon={MapPinIcon}
                      label="Address"
                      value={userData.address}
                      field="address"
                      type="textarea"
                    />
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-6">Medical Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField
                      icon={HeartIcon}
                      label="Blood Type"
                      value={userData.blood_type}
                      field="blood_type"
                      type="select"
                      options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']}
                    />
                    <ProfileField
                      icon={PhoneIcon}
                      label="Emergency Contact"
                      value={userData.emergency_contact}
                      field="emergency_contact"
                      type="tel"
                    />
                    <ProfileField
                      icon={IdentificationIcon}
                      label="Insurance Number"
                      value={userData.insurance_number}
                      field="insurance_number"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 mt-6">
                    <ProfileField
                      icon={DocumentTextIcon}
                      label="Allergies"
                      value={userData.allergies}
                      field="allergies"
                      type="textarea"
                    />
                    <ProfileField
                      icon={DocumentTextIcon}
                      label="Medical Conditions"
                      value={userData.medical_conditions}
                      field="medical_conditions"
                      type="textarea"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
