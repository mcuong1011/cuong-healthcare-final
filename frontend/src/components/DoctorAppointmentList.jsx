import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { 
  UserIcon, 
  CalendarDaysIcon, 
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

export default function DoctorAppointmentList({ doctorId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today'); // today, upcoming, all
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
    }
  }, [doctorId, filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let params = { role: 'DOCTOR' };
      if (filter === 'today') {
        params.date = new Date().toISOString().split('T')[0];
      }

      const response = await axios.get(`http://localhost:8000/api/appointments/`, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let filteredAppointments = response.data;
      
      if (filter === 'upcoming') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        filteredAppointments = response.data.filter(apt => 
          new Date(apt.scheduled_time) >= tomorrow
        );
      }

      setAppointments(filteredAppointments.sort((a, b) => 
        new Date(a.scheduled_time) - new Date(b.scheduled_time)
      ));
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/appointments/${appointmentId}/`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAppointments();
    } catch (err) {
      console.error('Error updating appointment:', err);
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

  const getPriorityColor = (priority) => {
    return priority === 2 ? 'text-red-600' : 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
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
      {/* Header and Filters */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Patient Appointments</h3>
          <p className="text-gray-600">Manage your patient appointments</p>
        </div>
        
        <div className="flex space-x-2">
          {[
            { key: 'today', label: 'Today' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'all', label: 'All' }
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
      {appointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments</h3>
          <p className="text-gray-500">
            {filter === 'today' ? 'No appointments scheduled for today' : 
             filter === 'upcoming' ? 'No upcoming appointments' : 
             'No appointments found'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => {
            const appointmentDate = parseISO(appointment.scheduled_time);
            
            return (
              <div
                key={appointment.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Patient Info */}
                  <div className="flex space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {appointment.patient_name || `Patient ID: ${appointment.patient_id}`}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {appointment.status || 'Pending'}
                        </span>
                        {appointment.priority === 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Urgent
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                          <span>
                            {isToday(appointmentDate) ? 'Today' :
                             isTomorrow(appointmentDate) ? 'Tomorrow' :
                             format(appointmentDate, 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span>{format(appointmentDate, 'h:mm a')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-400" />
                          <span className={getPriorityColor(appointment.priority)}>
                            {appointment.priority === 2 ? 'High Priority' : 'Normal Priority'}
                          </span>
                        </div>
                      </div>
                      
                      {appointment.reason && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Reason: </span>
                            {appointment.reason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedAppointment(appointment)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {appointment.status === 'PENDING' && (
                      <button
                        onClick={() => updateAppointmentStatus(appointment.id, 'CONFIRMED')}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Confirm Appointment"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </button>
                    )}
                    
                    {(appointment.status === 'CONFIRMED' || appointment.status === 'PENDING') && (
                      <>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'COMPLETED')}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Mark as Completed"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'CANCELLED')}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Appointment"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Patient</label>
                    <p className="text-gray-900">{selectedAppointment.patient_name || `Patient ID: ${selectedAppointment.patient_id}`}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="text-gray-900">{selectedAppointment.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date & Time</label>
                    <p className="text-gray-900">
                      {format(parseISO(selectedAppointment.scheduled_time), 'PPP p')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <p className="text-gray-900">
                      {selectedAppointment.priority === 2 ? 'High Priority' : 'Normal Priority'}
                    </p>
                  </div>
                </div>
                
                {selectedAppointment.reason && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Reason for Visit</label>
                    <p className="text-gray-900 mt-1">{selectedAppointment.reason}</p>
                  </div>
                )}
                
                {selectedAppointment.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes</label>
                    <p className="text-gray-900 mt-1">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex space-x-3">
                {selectedAppointment.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'CONFIRMED');
                      setSelectedAppointment(null);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Confirm Appointment
                  </button>
                )}
                
                {(selectedAppointment.status === 'CONFIRMED' || selectedAppointment.status === 'PENDING') && (
                  <button
                    onClick={() => {
                      updateAppointmentStatus(selectedAppointment.id, 'COMPLETED');
                      setSelectedAppointment(null);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Mark as Completed
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}