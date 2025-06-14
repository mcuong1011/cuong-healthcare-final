import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import DoctorScheduleManager from '../components/DoctorScheduleManager';
import DoctorAppointmentList from '../components/DoctorAppointmentList';
import DoctorStats from '../components/DoctorStats';
import PatientQueue from '../components/PatientQueue';
import DoctorSettings from '../components/DoctorSettings';
import { 
  CalendarDaysIcon, 
  UserGroupIcon, 
  ClockIcon, 
  ChartBarIcon,
  Cog6ToothIcon 
} from '@heroicons/react/24/outline';

export default function DoctorDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, schedule, appointments, patients, settings
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    fetchDoctorInfo();
  }, []);

  const fetchDoctorInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/users/me/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setDoctorInfo(data);
    } catch (err) {
      console.error('Error fetching doctor info:', err);
    }
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: ChartBarIcon },
    { key: 'schedule', label: 'My Schedule', icon: CalendarDaysIcon },
    { key: 'appointments', label: 'Appointments', icon: ClockIcon },
    { key: 'patients', label: 'Patient Queue', icon: UserGroupIcon },
    { key: 'settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          {/* Doctor Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <UserGroupIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      Dr. {doctorInfo?.first_name} {doctorInfo?.last_name}
                    </h1>
                    <p className="text-green-100">
                      {doctorInfo?.specialization || 'General Practice'} • Doctor Dashboard
                    </p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="hidden md:flex space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-green-100 text-sm">Today's Patients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-green-100 text-sm">Waiting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">45</div>
                    <div className="text-green-100 text-sm">This Week</div>
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
              {activeTab === 'overview' && (
                <div className="p-6">
                  <DoctorStats doctorId={doctorInfo?.id} />
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="p-6">
                  <DoctorScheduleManager doctorId={doctorInfo?.id} />
                </div>
              )}

              {activeTab === 'appointments' && (
                <div className="p-6">
                  <DoctorAppointmentList doctorId={doctorInfo?.id} />
                </div>
              )}

              {activeTab === 'patients' && (
                <div className="p-6">
                  <PatientQueue doctorId={doctorInfo?.id} />
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-6">
                  <DoctorSettings doctorId={doctorInfo?.id} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}