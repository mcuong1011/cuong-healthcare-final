import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserGroupIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  ArrowTrendingUpIcon,
  ChartPieIcon
} from '@heroicons/react/24/outline';

export default function DoctorStats({ doctorId }) {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weeklyAppointments: 0,
    monthlyAppointments: 0,
    waitingPatients: 0,
    completedToday: 0,
    avgRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doctorId) {
      fetchStats();
    }
  }, [doctorId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch appointments for today
      const today = new Date().toISOString().split('T')[0];
      const todayResponse = await axios.get(`http://localhost:8000/api/appointments/`, {
        params: { role: 'DOCTOR', date: today },
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch all appointments to calculate weekly/monthly stats
      const allResponse = await axios.get(`http://localhost:8000/api/appointments/`, {
        params: { role: 'DOCTOR' },
        headers: { Authorization: `Bearer ${token}` }
      });

      const allAppointments = allResponse.data;
      const todayAppointments = todayResponse.data;

      // Calculate stats
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const weeklyCount = allAppointments.filter(apt => 
        new Date(apt.scheduled_time) >= weekStart
      ).length;

      const monthlyCount = allAppointments.filter(apt => 
        new Date(apt.scheduled_time) >= monthStart
      ).length;

      const waitingCount = todayAppointments.filter(apt => 
        apt.status === 'CONFIRMED' || apt.status === 'PENDING'
      ).length;

      const completedCount = todayAppointments.filter(apt => 
        apt.status === 'COMPLETED'
      ).length;

      setStats({
        todayAppointments: todayAppointments.length,
        weeklyAppointments: weeklyCount,
        monthlyAppointments: monthlyCount,
        waitingPatients: waitingCount,
        completedToday: completedCount,
        avgRating: 4.8 // Mock data - you can implement rating system later
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: CalendarDaysIcon,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: "Waiting Patients",
      value: stats.waitingPatients,
      icon: ClockIcon,
      color: 'bg-orange-500',
      change: '3 urgent'
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      change: `${Math.round((stats.completedToday / stats.todayAppointments) * 100)}%`
    },
    {
      title: "This Week",
      value: stats.weeklyAppointments,
      icon: ArrowTrendingUpIcon,
      color: 'bg-purple-500',
      change: '+8%'
    },
    {
      title: "Average Rating",
      value: stats.avgRating.toFixed(1),
      icon: ChartPieIcon,
      color: 'bg-yellow-500',
      change: '⭐⭐⭐⭐⭐'
    },
    {
      title: "This Month",
      value: stats.monthlyAppointments,
      icon: CalendarDaysIcon,
      color: 'bg-indigo-500',
      change: '+15%'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-8 bg-gray-200 rounded"></div>
              </div>
              <div className="mt-4 w-24 h-4 bg-gray-200 rounded"></div>
              <div className="mt-2 w-16 h-3 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                  <div className="text-sm text-green-600 font-medium">{card.change}</div>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500">{card.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <CalendarDaysIcon className="h-6 w-6 text-blue-500 mb-2" />
            <div className="font-medium">View Today's Schedule</div>
            <div className="text-sm text-gray-500">Check your appointments</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <UserGroupIcon className="h-6 w-6 text-green-500 mb-2" />
            <div className="font-medium">Patient Records</div>
            <div className="text-sm text-gray-500">Review medical histories</div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <ClockIcon className="h-6 w-6 text-orange-500 mb-2" />
            <div className="font-medium">Update Availability</div>
            <div className="text-sm text-gray-500">Manage your schedule</div>
          </button>
        </div>
      </div>
    </div>
  );
}