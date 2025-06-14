import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClockIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/outline';
import api from '../services/api'

export default function DoctorScheduleManager({ doctorId }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [form, setForm] = useState({
    weekday: 0,
    start_time: '',
    end_time: '',
    max_patients_per_hour: 4,
    appointment_duration: 30,
    is_active: true
  });

  const weekdays = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];

  useEffect(() => {
    if (doctorId) {
      fetchSchedules();
    }
  }, [doctorId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // const response = await axios.get(`http://localhost:8000/api/appointments/schedules/`, {
      //   params: { doctor_id: doctorId }
      // });
      const response = await api.get(`/appointments/schedules/?doctor_id=${doctorId}`);
      setSchedules(response.data);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const scheduleData = {
        ...form,
        doctor_id: doctorId
      };

      if (editingSchedule) {
        await axios.put(`http://localhost:8000/api/appointments/schedules/${editingSchedule.id}/`, 
          scheduleData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`http://localhost:8000/api/appointments/schedules/`, 
          scheduleData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      fetchSchedules();
      resetForm();
    } catch (err) {
      console.error('Error saving schedule:', err);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule);
    setForm({
      weekday: schedule.weekday,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      max_patients_per_hour: schedule.max_patients_per_hour,
      appointment_duration: schedule.appointment_duration,
      is_active: schedule.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8000/api/appointments/schedules/${scheduleId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSchedules();
      } catch (err) {
        console.error('Error deleting schedule:', err);
      }
    }
  };

  const resetForm = () => {
    setForm({
      weekday: 0,
      start_time: '',
      end_time: '',
      max_patients_per_hour: 4,
      appointment_duration: 30,
      is_active: true
    });
    setEditingSchedule(null);
    setShowForm(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Work Schedule</h3>
          <p className="text-gray-600">Manage your weekly availability</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* Schedule Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {editingSchedule ? 'Edit Schedule' : 'Add New Schedule'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                <select
                  name="weekday"
                  value={form.weekday}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {weekdays.map(day => (
                    <option key={day.value} value={day.value}>{day.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Patients/Hour</label>
                <input
                  type="number"
                  name="max_patients_per_hour"
                  value={form.max_patients_per_hour}
                  onChange={handleChange}
                  min="1"
                  max="12"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Duration (minutes)</label>
                <select
                  name="appointment_duration"
                  value={form.appointment_duration}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingSchedule ? 'Update' : 'Add'} Schedule
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedule List */}
      <div className="space-y-3">
        {schedules.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Set</h3>
            <p className="text-gray-500">Add your work schedule to start accepting appointments</p>
          </div>
        ) : (
          schedules.map(schedule => (
            <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${schedule.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <div>
                  <div className="font-medium text-gray-900">
                    {weekdays.find(d => d.value === schedule.weekday)?.label}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center space-x-4">
                    <span className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {schedule.start_time} - {schedule.end_time}
                    </span>
                    <span>{schedule.max_patients_per_hour} patients/hour</span>
                    <span>{schedule.appointment_duration} min/appointment</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(schedule)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(schedule.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}