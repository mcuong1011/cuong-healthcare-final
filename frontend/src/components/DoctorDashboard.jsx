import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weeklyAppointments: 0,
    totalPatients: 0,
    monthlyRevenue: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch appointments
      const appointmentsResponse = await axios.get('http://localhost:8000/api/appointments/?role=DOCTOR', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const appointments = appointmentsResponse.data;
      const today = new Date();
      
      // Filter today's appointments
      const todayAppts = appointments.filter(apt => 
        isToday(parseISO(apt.scheduled_time))
      );
      
      // Filter upcoming appointments (next 7 days)
      const upcomingAppts = appointments.filter(apt => {
        const aptDate = parseISO(apt.scheduled_time);
        const diffTime = aptDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 7;
      });

      setTodayAppointments(todayAppts);
      setUpcomingAppointments(upcomingAppts.slice(0, 5)); // Show only 5

      // Calculate stats
      setStats({
        todayAppointments: todayAppts.length,
        weeklyAppointments: upcomingAppts.length,
        totalPatients: new Set(appointments.map(apt => apt.patient_id)).size,
        monthlyRevenue: appointments.length * 100 // Simplified calculation
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/appointments/${appointmentId}/`, {
        status: action
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh data
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating appointment:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDateLabel = (dateString) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.weeklyAppointments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats.monthlyRevenue}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-600" />
              Today's Appointments
            </h3>
          </div>
          <div className="p-6">
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No appointments today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {appointment.patient_name ? appointment.patient_name.charAt(0) : 'P'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient_name || `Patient ${appointment.patient_id}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(appointment.scheduled_time), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{appointment.reason}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      {appointment.status === 'pending' && (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'confirmed')}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAppointmentAction(appointment.id, 'cancelled')}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-green-600" />
              Upcoming Appointments
            </h3>
          </div>
          <div className="p-6">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {appointment.patient_name ? appointment.patient_name.charAt(0) : 'P'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient_name || `Patient ${appointment.patient_id}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {getDateLabel(appointment.scheduled_time)} - {format(parseISO(appointment.scheduled_time), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}