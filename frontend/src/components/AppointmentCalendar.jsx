import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isBefore } from 'date-fns';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function AppointmentCalendar({ onDateSelected, onAppointmentClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Fetch patient calendar data
  useEffect(() => {
    const fetchPatientCalendar = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Please login to view your appointments');
          return;
        }

        const response = await axios.get(
          `http://localhost:8000/api/appointments/patient-calendar/`, 
          {
            params: {
              year: currentDate.getFullYear(),
              month: currentDate.getMonth() + 1
            },
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        setCalendarData(response.data.calendar_data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching patient calendar:', err);
        if (err.response?.status === 401) {
          setError('Please login to view your appointments');
        } else {
          setError('Could not load your appointment calendar');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPatientCalendar();
  }, [currentDate]);

  // Calendar navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleDateClick = (dateString, dayData) => {
    setSelectedDate(dateString);
    onDateSelected?.(dateString, dayData);
  };

  const handleAppointmentClick = (appointment, e) => {
    e.stopPropagation();
    onAppointmentClick?.(appointment);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    if (priority === 2) {
      return <ExclamationTriangleIcon className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  // Generate calendar days
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Create header row with day names
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const header = daysOfWeek.map(day => (
      <div key={day} className="py-3 text-center text-sm font-semibold text-gray-500 uppercase tracking-wide">
        {day}
      </div>
    ));

    // Prepare calendar grid
    let calendarGrid = [];
    let week = [];

    // Add empty cells for days before month start
    const startDay = getDay(monthStart);
    for (let i = 0; i < startDay; i++) {
      week.push(
        <div key={`empty-start-${i}`} className="aspect-square p-1"></div>
      );
    }

    // Fill in days of the month
    days.forEach(day => {
      const dateString = format(day, 'yyyy-MM-dd');
      const dayData = calendarData.find(d => d.date === dateString);
      const hasAppointments = dayData && dayData.appointments.length > 0;

      const isPast = isBefore(day, new Date()) && !isToday(day);
      const isSelected = selectedDate === dateString;
      const isTodayDate = isToday(day);

      let bgColor = 'bg-white hover:bg-gray-50'; // Default
      let borderColor = 'border-gray-200';
      let cursor = 'cursor-pointer';

      if (hasAppointments) {
        bgColor = 'bg-blue-50 hover:bg-blue-100';
        borderColor = 'border-blue-200';
      }

      if (isSelected) {
        bgColor = 'bg-blue-600 text-white';
        borderColor = 'border-blue-600';
      }

      if (isTodayDate && !isSelected) {
        borderColor = 'border-blue-500 ring-2 ring-blue-200';
      }

      week.push(
        <div
          key={day.toString()}
          className={`aspect-square p-1 border ${borderColor} ${bgColor} ${cursor} 
                     transition-all duration-200 relative group flex flex-col`}
          onClick={() => handleDateClick(dateString, dayData)}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-sm font-medium ${isTodayDate ? 'font-bold' : ''} ${isSelected ? 'text-white' : ''}`}>
              {format(day, 'd')}
            </span>
            {isTodayDate && !isSelected && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          
          {hasAppointments && (
            <div className="flex-1 space-y-1 overflow-hidden">
              {dayData.appointments.slice(0, 2).map((appointment, index) => (
                <div
                  key={appointment.id}
                  className={`text-xs p-1 rounded border cursor-pointer transition-all hover:shadow-sm ${
                    isSelected ? 'bg-white/20 text-white border-white/30' : getStatusColor(appointment.status)
                  }`}
                  onClick={(e) => handleAppointmentClick(appointment, e)}
                  title={`${appointment.time} - ${appointment.doctor_name}: ${appointment.reason}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">
                      {appointment.time}
                    </span>
                    {getPriorityIcon(appointment.priority)}
                  </div>
                  <div className="truncate opacity-75">
                    {appointment.doctor_name}
                  </div>
                </div>
              ))}
              
              {dayData.appointments.length > 2 && (
                <div className={`text-xs text-center font-medium ${isSelected ? 'text-white' : 'text-blue-600'}`}>
                  +{dayData.appointments.length - 2} more
                </div>
              )}
            </div>
          )}
          
          {hasAppointments && !isSelected && (
            <div className="absolute top-1 right-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
          )}
        </div>
      );

      // Create a new row when we reach Saturday
      if (week.length === 7) {
        calendarGrid.push(
          <div key={`week-${calendarGrid.length}`} className="grid grid-cols-7 gap-1">
            {week}
          </div>
        );
        week = [];
      }
    });

    // Add empty cells for days after month end and finalize last week
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(
          <div key={`empty-end-${week.length}`} className="aspect-square p-1"></div>
        );
      }
      calendarGrid.push(
        <div key={`week-${calendarGrid.length}`} className="grid grid-cols-7 gap-1">
          {week}
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {header}
        </div>
        {calendarGrid}
      </div>
    );
  };

  const getTotalAppointments = () => {
    return calendarData.reduce((total, day) => total + day.count, 0);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex justify-between items-center">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              My Appointments {getTotalAppointments() > 0 && `(${getTotalAppointments()})`}
            </p>
          </div>
          
          <button 
            onClick={goToNextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Calendar Body */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-7 gap-1">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <CalendarIcon className="h-12 w-12 text-red-300 mx-auto mb-3" />
            <p>{error}</p>
          </div>
        ) : (
          renderCalendar()
        )}
      </div>
      
      {/* Selected Date Details */}
      {selectedDate && calendarData.find(d => d.date === selectedDate) && (
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">
            Appointments on {format(new Date(selectedDate), 'MMMM d, yyyy')}
          </h4>
          <div className="space-y-2">
            {calendarData.find(d => d.date === selectedDate).appointments.map(appointment => (
              <div 
                key={appointment.id}
                className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${getStatusColor(appointment.status)}`}
                onClick={() => onAppointmentClick?.(appointment)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-4 w-4" />
                    <span className="font-medium">{appointment.time}</span>
                    {getPriorityIcon(appointment.priority)}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/50">
                    {appointment.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{appointment.doctor_name}</span>
                </div>
                <div className="text-sm mt-1 opacity-75">
                  {appointment.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Legend */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-gray-600">Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span className="text-gray-600">Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
}