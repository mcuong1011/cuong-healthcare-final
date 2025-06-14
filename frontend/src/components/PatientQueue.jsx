import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { 
  UserIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function PatientQueue({ doctorId }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doctorId) {
      fetchQueue();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchQueue, 30000);
      return () => clearInterval(interval);
    }
  }, [doctorId]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      
      const response = await axios.get(`http://localhost:8000/api/appointments/`, {
        params: { 
          role: 'DOCTOR', 
          date: today,
          status: 'CONFIRMED'
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sort by scheduled time
      const sortedQueue = response.data.sort((a, b) => 
        new Date(a.scheduled_time) - new Date(b.scheduled_time)
      );
      
      setQueue(sortedQueue);
    } catch (err) {
      console.error('Error fetching queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/appointments/${appointmentId}/`, 
        { status: 'COMPLETED' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQueue();
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  const getCurrentPatient = () => {
    const now = new Date();
    return queue.find(apt => {
      const appointmentTime = parseISO(apt.scheduled_time);
      const timeDiff = Math.abs(now - appointmentTime);
      return timeDiff <= 30 * 60 * 1000; // Within 30 minutes
    });
  };

  const getUpcomingPatients = () => {
    const now = new Date();
    return queue.filter(apt => {
      const appointmentTime = parseISO(apt.scheduled_time);
      return appointmentTime > now;
    }).slice(0, 5);
  };

  const currentPatient = getCurrentPatient();
  const upcomingPatients = getUpcomingPatients();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Queue</h3>
        <p className="text-gray-600">Today's confirmed appointments</p>
      </div>

      {/* Current Patient */}
      {currentPatient && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Current Patient</h4>
                <p className="text-green-700 font-medium">
                  {currentPatient.patient_name || `Patient ID: ${currentPatient.patient_id}`}
                </p>
                <p className="text-sm text-gray-600">
                  {format(parseISO(currentPatient.scheduled_time), 'h:mm a')}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => markAsCompleted(currentPatient.id)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <CheckCircleIcon className="h-4 w-4" />
              <span>Mark Complete</span>
            </button>
          </div>
          
          {currentPatient.reason && (
            <div className="mt-4 p-3 bg-white rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Reason: </span>
                {currentPatient.reason}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upcoming Patients */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 mb-3">
          Upcoming Patients ({upcomingPatients.length})
        </h4>
        
        {upcomingPatients.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Upcoming Patients</h3>
            <p className="text-gray-500">Your schedule is clear for the rest of the day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingPatients.map((patient, index) => (
              <div
                key={patient.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {patient.patient_name || `Patient ID: ${patient.patient_id}`}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {format(parseISO(patient.scheduled_time), 'h:mm a')}
                        </span>
                        {patient.priority === 2 && (
                          <span className="flex items-center text-red-600">
                            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {patient.reason && patient.reason.length > 30 
                      ? `${patient.reason.substring(0, 30)}...` 
                      : patient.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Queue Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Today's Summary</h4>
            <p className="text-sm text-blue-700">
              {queue.length} total appointments • {queue.filter(apt => apt.status === 'COMPLETED').length} completed
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">
              {Math.round((queue.filter(apt => apt.status === 'COMPLETED').length / queue.length) * 100) || 0}%
            </div>
            <div className="text-sm text-blue-700">Completion Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}