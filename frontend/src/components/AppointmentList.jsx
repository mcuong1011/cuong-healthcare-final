import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { 
  CalendarDaysIcon, 
  ClockIcon, 
  UserIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/appointments/?role=PATIENT', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDateLabel = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd, yyyy');
  };

  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = parseISO(appointment.scheduled_time);
    switch (filter) {
      case 'upcoming':
        return !isPast(appointmentDate);
      case 'past':
        return isPast(appointmentDate);
      default:
        return true;
    }
  }).sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time));

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-gray-600 mt-1">Manage your upcoming and past appointments</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'past', label: 'Past' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
          <p className="text-gray-500">
            {filter === 'upcoming' ? 'You have no upcoming appointments' : 
             filter === 'past' ? 'You have no past appointments' : 
             'You haven\'t booked any appointments yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const appointmentDate = parseISO(appointment.scheduled_time);
            const isAppointmentPast = isPast(appointmentDate);
            
            return (
              <div
                key={appointment.id}
                className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${
                  isAppointmentPast ? 'opacity-75' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* Main Content */}
                    <div className="flex space-x-4 flex-1">
                      {/* Doctor Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                      
                      {/* Appointment Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Dr. {appointment.doctor_name || `Doctor ID: ${appointment.doctor_id}`}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                            {appointment.status || 'Pending'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                            <span>{getDateLabel(appointment.scheduled_time)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-4 w-4 text-gray-400" />
                            <span>{format(appointmentDate, 'h:mm a')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <ExclamationCircleIcon className="h-4 w-4 text-gray-400" />
                            <span className="capitalize">
                              {appointment.priority === 2 ? 'Urgent' : 'Normal'} Priority
                            </span>
                          </div>
                        </div>
                        
                        {appointment.reason && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Reason: </span>
                              {appointment.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex space-x-2 ml-4">
                      {!isAppointmentPast && appointment.status !== 'cancelled' && (
                        <>
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {isAppointmentPast && appointment.status !== 'completed' && (
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Appointment Timing Indicator */}
                {!isAppointmentPast && (
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {isToday(appointmentDate) ? 'Today' :
                         isTomorrow(appointmentDate) ? 'Tomorrow' :
                         `In ${Math.ceil((appointmentDate - new Date()) / (1000 * 60 * 60 * 24))} days`}
                      </span>
                      
                      {appointment.status === 'confirmed' && (
                        <span className="flex items-center text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}