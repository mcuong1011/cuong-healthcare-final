import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarIcon, ClockIcon, UserIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export default function AppointmentBookingForm({ selectedDate, onDoctorSelected }) {
  const [form, setForm] = useState({ 
    date: selectedDate || '', 
    selectedSlot: null,
    doctor: '', 
    reason: '',
    priority: 'normal'
  });
  const [doctors, setDoctors] = useState([]);
  const [availableSlotsData, setAvailableSlotsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setForm(prev => ({ ...prev, date: selectedDate, selectedSlot: null }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (form.doctor && form.date) {
      fetchAvailableSlots();
    } else {
      setAvailableSlotsData(null);
      setForm(prev => ({ ...prev, selectedSlot: null }));
    }
  }, [form.doctor, form.date]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/doctors/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setDoctors(response.data);
    } catch (err) {
      setError('Failed to load doctors');
      console.error('Error fetching doctors:', err);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Sử dụng API trực tiếp từ appointment service
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/appointments/available-slots/', {
        params: {
          doctor_id: form.doctor,
          date: form.date
        },
        headers: {
          Authorization: `Bearer ${token}`
        } 
      });
      
      console.log('Available slots response:', response.data);
      setAvailableSlotsData(response.data);
      setForm(prev => ({ ...prev, selectedSlot: null }));
    } catch (err) {
      console.error('Error fetching slots:', err);
      if (err.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else if (err.response?.status === 404) {
        setError('No schedule found for this doctor on the selected date.');
      } else {
        setError(err.response?.data?.error || 'Failed to load available slots');
      }
      setAvailableSlotsData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (name === 'doctor') {
      onDoctorSelected?.(value);
      setForm(prev => ({ ...prev, selectedSlot: null }));
    }
  };

  const handleSlotSelect = (slot) => {
    if (slot.is_available) {
      setForm(prev => ({ ...prev, selectedSlot: slot }));
    }
  };

  const formatTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeRange = (startTime, endTime) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const formatDoctorName = (doctor) => {
    if (doctor.first_name && doctor.last_name) {
      return `${doctor.first_name} ${doctor.last_name}`;
    }
    // Fallback to username formatting
    return doctor.username.split('.').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join(' ');
  };

  const getDoctorSpecialty = (doctor) => {
    return doctor.specialization || doctor.specialty || 'General Practice';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      
      if (!form.selectedSlot) {
        throw new Error('Please select a time slot');
      }

      // Sử dụng gateway để create appointment (vì cần patient_id injection)
      await axios.post('http://localhost:8000/api/appointments/create/', {
        doctor_id: parseInt(form.doctor),
        scheduled_time: form.selectedSlot.start_time, // Sử dụng start_time trực tiếp
        reason: form.reason,
        priority: form.priority === 'urgent' ? 2 : 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Appointment booked successfully!');
      
      // Reset form
      setForm({ 
        date: '', 
        selectedSlot: null, 
        doctor: '', 
        reason: '', 
        priority: 'normal' 
      });
      setAvailableSlotsData(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000);
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to book appointment';
      setError(errorMessage);
      console.error('Error booking appointment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getSlotStatusColor = (slot) => {
    if (!slot.is_available) {
      return 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed';
    }
    
    if (form.selectedSlot?.start_time === slot.start_time) {
      return 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200';
    }
    
    // Color based on availability
    const availabilityPercentage = ((slot.max_appointments - slot.booked_count) / slot.max_appointments) * 100;
    
    if (availabilityPercentage > 70) {
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:border-green-300';
    } else if (availabilityPercentage > 30) {
      return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 hover:border-yellow-300';
    } else {
      return 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 hover:border-orange-300';
    }
  };

  const getSlotStatusText = (slot) => {
    if (!slot.is_available) return 'Full';
    const available = slot.max_appointments - slot.booked_count;
    return `${available}/${slot.max_appointments} available`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Book New Appointment</h2>
        <p className="text-gray-600">Fill in the details below to schedule your appointment</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Doctor Selection */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <UserIcon className="h-4 w-4" />
            <span>Select Doctor</span>
          </label>
          <select
            name="doctor"
            value={form.doctor}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">Choose a doctor...</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {formatDoctorName(doctor)} - {getDoctorSpecialty(doctor)}
              </option>
            ))}
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="h-4 w-4" />
            <span>Appointment Date</span>
          </label>
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Time Selection */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <ClockIcon className="h-4 w-4" />
            <span>Available Time Slots</span>
          </label>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : availableSlotsData?.slots?.length > 0 ? (
            <div>
              <div className="mb-3 text-sm text-gray-600">
                Available slots for Dr. {formatDoctorName(doctors.find(d => d.id == form.doctor) || {})} on {form.date}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {availableSlotsData.slots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSlotSelect(slot)}
                    disabled={!slot.is_available}
                    className={`p-4 rounded-lg border text-sm font-medium transition-all duration-200 text-left ${getSlotStatusColor(slot)}`}
                  >
                    <div className="font-semibold">
                      {formatTimeRange(slot.start_time, slot.end_time)}
                    </div>
                    <div className="text-xs mt-1 opacity-75">
                      {getSlotStatusText(slot)}
                    </div>
                    {slot.availability_status !== 'AVAILABLE' && (
                      <div className="text-xs mt-1 text-red-600 font-medium">
                        {slot.availability_status}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {form.selectedSlot && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm font-medium text-blue-900">Selected Slot:</div>
                  <div className="text-blue-700">
                    {formatTimeRange(form.selectedSlot.start_time, form.selectedSlot.end_time)}
                  </div>
                </div>
              )}
            </div>
          ) : availableSlotsData && availableSlotsData.slots?.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No available slots for this date</p>
              <p className="text-sm text-gray-400 mt-1">
                {availableSlotsData.message || 'Please try a different date'}
              </p>
            </div>
          ) : form.doctor && form.date ? (
            <div className="text-center py-8 bg-yellow-50 rounded-lg border border-yellow-200">
              <ClockIcon className="h-12 w-12 text-yellow-300 mx-auto mb-3" />
              <p className="text-yellow-700">Loading available slots...</p>
              <p className="text-sm text-yellow-600 mt-1">Please wait while we check availability</p>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">Please select a doctor and date first</p>
            </div>
          )}
        </div>

        {/* Priority Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Priority Level</label>
          <div className="flex space-x-4">
            {[
              { value: 'normal', label: 'Normal', color: 'bg-green-100 text-green-800 border-green-200' },
              { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' }
            ].map(({ value, label, color }) => (
              <label key={value} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value={value}
                  checked={form.priority === value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.priority === value ? color : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Reason */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
            <span>Reason for Visit</span>
          </label>
          <textarea
            name="reason"
            value={form.reason}
            onChange={handleChange}
            rows={3}
            placeholder="Describe your symptoms or reason for the appointment..."
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || !form.doctor || !form.date || !form.selectedSlot || !form.reason}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Booking...</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              <span>Book Appointment</span>
            </>
          )}
        </button>

        {/* Booking Summary */}
        {form.selectedSlot && form.doctor && form.date && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Doctor: Dr. {formatDoctorName(doctors.find(d => d.id == form.doctor) || {})}</div>
              <div>Date: {form.date}</div>
              <div>Time: {formatTimeRange(form.selectedSlot.start_time, form.selectedSlot.end_time)}</div>
              <div>Priority: {form.priority}</div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}