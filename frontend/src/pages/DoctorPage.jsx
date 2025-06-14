import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DoctorDashboard from '../components/DoctorDashboard';
import DoctorSettings from '../components/DoctorSettings';
import AppointmentList from '../components/AppointmentList';
import AppointmentCalendar from '../components/AppointmentCalendar';
import {
  HomeIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CogIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function DoctorPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [doctorId, setDoctorId] = useState(null);

  useEffect(() => {
    // Get doctor ID from token or user context
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setDoctorId(user.id);
  }, []);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { key: 'appointments', label: 'Appointments', icon: CalendarDaysIcon },
    { key: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
    { key: 'patients', label: 'Patients', icon: UserGroupIcon },
    { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
    { key: 'settings', label: 'Settings', icon: CogIcon }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Doctor Portal</h1>
                  <p className="mt-2 text-green-100">Manage your practice and patients</p>
                </div>
                <div className="hidden md:flex space-x-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-sm text-green-100">Today</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <UserGroupIcon className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">156</div>
                    <div className="text-sm text-green-100">Patients</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-b border-gray-200 bg-white rounded-t-lg -mt-4 relative z-10 shadow-sm">
              <nav className="-mb-px flex space-x-8 px-6">
                {tabs.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`${
                      activeTab === key
                        ? 'border-green-500 text-green-600 bg-green-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 rounded-t-lg transition-colors`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-b-lg shadow-sm mb-8">
              {activeTab === 'dashboard' && (
                <div className="p-6">
                  <DoctorDashboard />
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="p-6">
                  <AppointmentList />
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">My Calendar</h3>
                    <p className="text-gray-600">View your appointment schedule</p>
                  </div>
                  {doctorId && (
                    <AppointmentCalendar 
                      doctorId={doctorId} 
                      onDateSelected={(date) => console.log('Selected date:', date)}
                    />
                  )}
                </div>
              )}

              {activeTab === 'patients' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Management</h3>
                    <p className="text-gray-500">Patient management features coming soon</p>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="p-6">
                  <div className="text-center py-12">
                    <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
                    <p className="text-gray-500">Analytics and reporting features coming soon</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-6">
                  {doctorId && <DoctorSettings doctorId={doctorId} />}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}