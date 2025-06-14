// src/components/ProfileCard.jsx
import React, { useState, useEffect } from 'react'
import { 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon, 
  CalendarIcon,
  CheckBadgeIcon,
  StarIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { getProfile } from '../services/api'

export default function ProfileCard() {
  const [activeTab, setActiveTab] = useState('profile')
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch user data from API
    const fetchUserData = async () => {
      setIsLoading(true)
      try {
        const response = await getProfile()
        const userData = response.data
        
        // Transform API data to component format
        const transformedUser = {
          name: userData.role === 'DOCTOR' 
            ? `Dr. ${userData.first_name} ${userData.last_name}`.trim() 
            : `${userData.first_name} ${userData.last_name}`.trim() || userData.username,
          role: userData.role === 'DOCTOR' ? userData.profile_data?.specialty || 'Doctor' :
                userData.role === 'PATIENT' ? 'Patient' :
                userData.role === 'NURSE' ? 'Nurse' :
                userData.role === 'PHARMACIST' ? 'Pharmacist' :
                userData.role === 'ADMIN' ? 'Administrator' : 'User',
          email: userData.email,
          phone: userData.phone_number,
          address: userData.profile_data?.address || userData.profile_data?.clinic_address || 'Not provided',
          joinDate: userData.date_joined ? new Date(userData.date_joined).toISOString().split('T')[0] : null,
          lastActive: userData.last_updated ? new Date(userData.last_updated).toLocaleString() : null,
          avatar: userData.avatar_url,
          rating: 4.8, // This would come from a ratings system
          reviews: 89, // This would come from a review system
          specializations: userData.role === 'DOCTOR' && userData.profile_data?.specialty 
            ? [userData.profile_data.specialty] 
            : [],
          achievements: userData.role === 'DOCTOR' && userData.profile_data?.practice_certificate
            ? ['Board Certified', userData.profile_data.practice_certificate]
            : ['Verified User'],
          profileData: userData.profile_data
        }
        
        setUser(transformedUser)
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Fallback to mock data
        setUser({
          name: 'User',
          role: 'Patient',
          email: 'user@example.com',
          phone: 'Not provided',
          address: 'Not provided',
          joinDate: null,
          lastActive: null,
          rating: 0,
          reviews: 0,
          specializations: [],
          achievements: ['Verified User']
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserData()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 animate-pulse">
        <div className="flex space-x-2 mb-4">
          <div className="h-8 bg-gray-200 rounded-full w-20"></div>
          <div className="h-8 bg-gray-200 rounded-full w-20"></div>
          <div className="h-8 bg-gray-200 rounded-full w-8"></div>
        </div>
        <div className="text-center space-y-3">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const tabData = {
    profile: {
      title: 'Profile',
      content: (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <UserIcon className="h-4 w-4 text-gray-400" />
            <span>{user.age} years old • {user.gender}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <MapPinIcon className="h-4 w-4 text-gray-400" />
            <span className="truncate">{user.address}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 text-gray-400" />
            <span>{user.phone}</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>Joined {new Date(user.joinDate).toLocaleDateString()}</span>
          </div>
        </div>
      )
    },
    achievements: {
      title: 'Achievements',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <StarIcon className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900">{user.rating}</span>
            </div>
            <span className="text-xs text-gray-500">{user.reviews} reviews</span>
          </div>
          {user.achievements.map((achievement, index) => (
            <div key={index} className="flex items-center space-x-2">
              <CheckBadgeIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-700">{achievement}</span>
            </div>
          ))}
        </div>
      )
    },
    activity: {
      title: 'Activity',
      content: (
        <div className="space-y-3">
          <div className="text-sm">
            <span className="text-gray-500">Last active:</span>
            <div className="font-medium text-gray-900">{user.lastActive}</div>
          </div>
          <div className="text-sm">
            <span className="text-gray-500">Specializations:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {user.specializations.map((spec, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-50 p-1 rounded-lg">
        {Object.entries(tabData).map(([key, tab]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === key
                ? 'bg-white text-blue-700 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      {/* Profile Section */}
      <div className="text-center mb-6">
        <div className="relative inline-block">
          <img 
            src={`https://i.pravatar.cc/150?u=${user.email}`}
            alt="Profile" 
            className="w-20 h-20 rounded-full border-4 border-gray-100 shadow-sm mx-auto"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <CheckBadgeIcon className="h-3 w-3 text-white" />
          </div>
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mt-3">{user.name}</h3>
        <div className="flex items-center justify-center space-x-2 mt-1">
          <span className="text-blue-600 font-medium">{user.role}</span>
          <div className="flex items-center space-x-1">
            <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
            <span className="text-sm text-gray-600">{user.rating}</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[120px]">
        {tabData[activeTab].content}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-2">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2">
          <UserIcon className="h-4 w-4" />
          <span>View Full Profile</span>
        </button>
        <button className="w-full bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-2">
          <span>Edit Information</span>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
  