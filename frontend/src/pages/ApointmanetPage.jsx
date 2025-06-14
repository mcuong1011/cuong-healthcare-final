import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AppointmentBookingForm from '../components/AppointmentBookingForm';
import AppointmentList from '../components/AppointmentList';
import AppointmentCalendar from '../components/AppointmentCalendar';
import { CalendarDaysIcon, ClockIcon, UserIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function AppointmentPage() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState('book'); // 'book', 'calendar', 'list'

  const handleDoctorSelected = (doctorId) => {
    setSelectedDoctor(doctorId);
  };

  const handleDateSelected = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Appointment Management</h1>
                  <p className="mt-2 text-blue-100">Schedule and manage your medical appointments</p>
                </div>
                <div className="hidden md:flex space-x-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">12</div>
                    <div className="text-sm text-blue-100">This Month</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <ClockIcon className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-2xl font-bold">3</div>
                    <div className="text-sm text-blue-100">Upcoming</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-b border-gray-200 bg-white rounded-t-lg -mt-4 relative z-10 shadow-sm">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { key: 'book', label: 'Book Appointment', icon: PlusIcon },
                  { key: 'calendar', label: 'Calendar View', icon: CalendarDaysIcon },
                  { key: 'list', label: 'My Appointments', icon: UserIcon },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`${
                      activeTab === key
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
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
              {activeTab === 'book' && (
                <div className="p-6">
                  <AppointmentBookingForm 
                    selectedDate={selectedDate}
                    onDoctorSelected={handleDoctorSelected}
                  />
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Doctor Availability Calendar</h3>
                    <p className="text-gray-600">Select a doctor to view their availability</p>
                  </div>
                  {selectedDoctor ? (
                    <AppointmentCalendar 
                      doctorId={selectedDoctor} 
                      onDateSelected={handleDateSelected}
                    />
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Doctor</h3>
                      <p className="text-gray-500">Choose a doctor from the booking form to view their calendar</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'list' && (
                <div className="p-6">
                  <AppointmentList />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}