import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import AppointmentBookingForm from "../components/AppointmentBookingForm";
import AppointmentList from "../components/AppointmentList";
import AppointmentCalendar from "../components/AppointmentCalendar";
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function AppointmentPage() {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

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
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-3xl font-bold">Book Your Appointment</h1>
                  <p className="mt-2 text-blue-100">
                    Schedule your medical appointment with ease
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Centered Booking Form */}
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <AppointmentBookingForm
                  selectedDate={selectedDate}
                  onDoctorSelected={handleDoctorSelected}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
