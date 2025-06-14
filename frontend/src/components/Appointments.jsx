// src/components/Appointments.jsx
import React, { useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon,
  ArrowRightIcon,
  PlusIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { getAppointments } from '../services/api'

export default function Appointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming') // upcoming, today, all

  useEffect(() => {
    fetchAppointments()
  }, [filter]) // Re-fetch when filter changes

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      
      // Get user info for the API call
      const userRole = localStorage.getItem('user_role')
      
      let params = {}
      if (userRole) {
        params.role = userRole
      }
      
      // Add filter params
      if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0]
        params.date = today
      } else if (filter === 'upcoming') {
        params.status = 'PENDING,CONFIRMED'
      }
      
      const response = await getAppointments(params)
      
      if (response.data && Array.isArray(response.data)) {
        // Sort by scheduled_time and take first 6
        const sortedAppointments = response.data
          .sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time))
          .slice(0, 6)
        setAppointments(sortedAppointments)
      } else {
        console.error('Unexpected API response format:', response.data)
        setAppointments([])
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
      // Fallback to mock data
      setAppointments(getMockAppointments())
    } finally {
      setLoading(false)
    }
  }

  const getMockAppointments = () => [
    {
      id: 1,
      doctor_name: 'Dr. Sarah Wilson',
      specialty: 'Cardiologist',
      scheduled_time: '2024-01-29T09:00:00Z',
      status: 'confirmed',
      type: 'Checkup',
      priority: 1
    },
    {
      id: 2,
      doctor_name: 'Dr. Michael Chen',
      specialty: 'Dermatologist',
      scheduled_time: '2024-01-29T14:30:00Z',
      status: 'pending',
      type: 'Consultation',
      priority: 2
    },
    {
      id: 3,
      doctor_name: 'Dr. Emily Rodriguez',
      specialty: 'Neurologist',
      scheduled_time: '2024-01-30T11:00:00Z',
      status: 'confirmed',
      type: 'Follow-up',
      priority: 1
    },
    {
      id: 4,
      doctor_name: 'Dr. James Parker',
      specialty: 'Orthopedist',
      scheduled_time: '2024-01-31T16:00:00Z',
      status: 'confirmed',
      type: 'Surgery',
      priority: 2
    }
  ]

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'confirmed':
        return {
          color: 'text-green-600',
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: CheckCircleIcon,
          label: 'Confirmed'
        }
      case 'pending':
        return {
          color: 'text-yellow-600',
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: ExclamationTriangleIcon,
          label: 'Pending'
        }
      default:
        return {
          color: 'text-gray-600',
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: ClockIcon,
          label: 'Scheduled'
        }
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.scheduled_time)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    switch (filter) {
      case 'today':
        return appointmentDate.toDateString() === new Date().toDateString()
      case 'upcoming':
        return appointmentDate >= today
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Appointments</h3>
            <p className="text-sm text-gray-500">{filteredAppointments.length} scheduled</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-1 bg-gray-50 p-1 rounded-lg">
          {[
            { key: 'today', label: 'Today' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'all', label: 'All' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === key
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Grid */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-8">
          <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-1">No appointments</h4>
          <p className="text-gray-500 mb-4">
            {filter === 'today' ? 'No appointments scheduled for today' : 
             filter === 'upcoming' ? 'No upcoming appointments' : 
             'No appointments found'}
          </p>
          <button className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <PlusIcon className="h-4 w-4" />
            <span>Schedule Appointment</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show max 4 appointments on dashboard */}
          {filteredAppointments.slice(0, 4).map((appointment) => {
            const statusConfig = getStatusConfig(appointment.status)
            const StatusIcon = statusConfig.icon

            return (
              <div 
                key={appointment.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer group"
              >
                <div className="flex items-center space-x-4">
                  {/* Doctor Avatar */}
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>

                  {/* Appointment Details */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {appointment.doctor_name || `Doctor ID: ${appointment.doctor_id}`}
                    </h4>
                    <p className="text-sm text-gray-600">{appointment.specialty || appointment.type}</p>
                    
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <CalendarDaysIcon className="h-3 w-3" />
                        <span>{formatDate(appointment.scheduled_time)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3" />
                        <span>{formatTime(appointment.scheduled_time)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status and Action */}
                <div className="flex items-center space-x-3">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                    <StatusIcon className="h-3 w-3" />
                    <span>{statusConfig.label}</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </div>
            )
          })}

          {/* View All Button */}
          {filteredAppointments.length > 4 && (
            <button className="w-full mt-4 py-3 text-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium">
              View All {filteredAppointments.length} Appointments
            </button>
          )}
        </div>
      )}
    </div>
  )
}
