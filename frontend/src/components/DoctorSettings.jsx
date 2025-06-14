import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  UserIcon, 
  CogIcon, 
  BellIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function DoctorSettings({ doctorId }) {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    bio: '',
    consultation_fee: '',
    experience_years: '',
    license_number: '',
    education: '',
    languages: ''
  });

  const [scheduleSettings, setScheduleSettings] = useState({
    default_appointment_duration: 30,
    max_patients_per_hour: 2,
    break_duration: 15,
    max_advance_booking_days: 30,
    auto_confirm_appointments: false,
    allow_emergency_bookings: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    appointment_reminders: true,
    cancellation_alerts: true,
    new_appointment_alerts: true
  });

  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: 'Monday', enabled: true, start_time: '09:00', end_time: '17:00' },
    { day: 'Tuesday', enabled: true, start_time: '09:00', end_time: '17:00' },
    { day: 'Wednesday', enabled: true, start_time: '09:00', end_time: '17:00' },
    { day: 'Thursday', enabled: true, start_time: '09:00', end_time: '17:00' },
    { day: 'Friday', enabled: true, start_time: '09:00', end_time: '17:00' },
    { day: 'Saturday', enabled: false, start_time: '09:00', end_time: '13:00' },
    { day: 'Sunday', enabled: false, start_time: '09:00', end_time: '13:00' }
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (doctorId) {
      fetchProfile();
      fetchSchedule();
    }
  }, [doctorId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/appointments/schedules/`, {
        params: { doctor_id: doctorId },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.length > 0) {
        // Convert API response to weeklySchedule format
        const scheduleMap = response.data.reduce((acc, schedule) => {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNames[schedule.weekday];
          acc[dayName] = {
            enabled: schedule.is_active,
            start_time: schedule.start_time,
            end_time: schedule.end_time
          };
          return acc;
        }, {});

        setWeeklySchedule(prev => prev.map(day => ({
          ...day,
          ...scheduleMap[day.day]
        })));
      }
    } catch (err) {
      console.error('Error fetching schedule:', err);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleScheduleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setScheduleSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotificationSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleWeeklyScheduleChange = (index, field, value) => {
    setWeeklySchedule(prev => prev.map((day, i) => 
      i === index ? { ...day, [field]: value } : day
    ));
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8000/api/users/me/`, profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const saveSchedule = async () => {
    try {
      setSaving(true);
      setError('');
      const token = localStorage.getItem('token');
      
      // Save weekly schedule
      const schedulePromises = weeklySchedule.map(async (day, index) => {
        if (day.enabled) {
          return axios.post(`http://localhost:8000/api/appointments/schedules/`, {
            doctor_id: doctorId,
            weekday: index === 0 ? 6 : index - 1, // Convert to API format (0=Monday, 6=Sunday)
            start_time: day.start_time,
            end_time: day.end_time,
            is_active: day.enabled,
            max_patients_per_hour: scheduleSettings.max_patients_per_hour,
            appointment_duration: scheduleSettings.default_appointment_duration
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      });

      await Promise.all(schedulePromises.filter(Boolean));
      setSuccess('Schedule updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving schedule:', err);
      setError('Error updating schedule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'profile', label: 'Profile', icon: UserIcon },
    { key: 'schedule', label: 'Schedule', icon: CalendarDaysIcon },
    { key: 'preferences', label: 'Preferences', icon: CogIcon },
    { key: 'notifications', label: 'Notifications', icon: BellIcon }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Doctor Settings</h1>
            <p className="text-blue-100">Manage your profile, schedule, and preferences</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`${
                  activeTab === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={saveProfile} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={profile.first_name}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={profile.last_name}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profile.phone || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <input
                      type="text"
                      name="license_number"
                      value={profile.license_number || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      name="experience_years"
                      value={profile.experience_years || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                    <select
                      name="specialization"
                      value={profile.specialization || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Specialization</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="ENT">ENT</option>
                      <option value="Ophthalmology">Ophthalmology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="General Medicine">General Medicine</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee ($)</label>
                    <input
                      type="number"
                      name="consultation_fee"
                      value={profile.consultation_fee || ''}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    <input
                      type="text"
                      name="education"
                      value={profile.education || ''}
                      onChange={handleProfileChange}
                      placeholder="e.g., MD from Harvard Medical School"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                    <input
                      type="text"
                      name="languages"
                      value={profile.languages || ''}
                      onChange={handleProfileChange}
                      placeholder="e.g., English, Vietnamese, French"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleProfileChange}
                  rows={4}
                  placeholder="Tell patients about yourself, your experience, and approach to healthcare..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
                <div className="space-y-4">
                  {weeklySchedule.map((day, index) => (
                    <div key={day.day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-24">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(e) => handleWeeklyScheduleChange(index, 'enabled', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">{day.day}</span>
                        </label>
                      </div>
                      
                      {day.enabled && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={day.start_time}
                              onChange={(e) => handleWeeklyScheduleChange(index, 'start_time', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">End Time</label>
                            <input
                              type="time"
                              value={day.end_time}
                              onChange={(e) => handleWeeklyScheduleChange(index, 'end_time', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Appointment Duration (minutes)</label>
                    <select
                      name="default_appointment_duration"
                      value={scheduleSettings.default_appointment_duration}
                      onChange={handleScheduleSettingsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Patients Per Hour</label>
                    <select
                      name="max_patients_per_hour"
                      value={scheduleSettings.max_patients_per_hour}
                      onChange={handleScheduleSettingsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={1}>1 patient</option>
                      <option value={2}>2 patients</option>
                      <option value={3}>3 patients</option>
                      <option value={4}>4 patients</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Break Duration (minutes)</label>
                    <select
                      name="break_duration"
                      value={scheduleSettings.break_duration}
                      onChange={handleScheduleSettingsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={0}>No break</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Advance Booking (days)</label>
                    <input
                      type="number"
                      name="max_advance_booking_days"
                      value={scheduleSettings.max_advance_booking_days}
                      onChange={handleScheduleSettingsChange}
                      min="1"
                      max="365"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="auto_confirm_appointments"
                      checked={scheduleSettings.auto_confirm_appointments}
                      onChange={handleScheduleSettingsChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-confirm appointments</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="allow_emergency_bookings"
                      checked={scheduleSettings.allow_emergency_bookings}
                      onChange={handleScheduleSettingsChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow emergency bookings outside schedule</span>
                  </label>
                </div>
              </div>

              <button
                onClick={saveSchedule}
                disabled={saving}
                className="w-full md:w-auto bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Save Schedule</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Email Notifications</div>
                      <div className="text-sm text-gray-500">Receive appointment updates via email</div>
                    </div>
                    <input
                      type="checkbox"
                      name="email_notifications"
                      checked={notificationSettings.email_notifications}
                      onChange={handleNotificationChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">SMS Notifications</div>
                      <div className="text-sm text-gray-500">Receive urgent updates via SMS</div>
                    </div>
                    <input
                      type="checkbox"
                      name="sms_notifications"
                      checked={notificationSettings.sms_notifications}
                      onChange={handleNotificationChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Appointment Reminders</div>
                      <div className="text-sm text-gray-500">Get reminded about upcoming appointments</div>
                    </div>
                    <input
                      type="checkbox"
                      name="appointment_reminders"
                      checked={notificationSettings.appointment_reminders}
                      onChange={handleNotificationChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Cancellation Alerts</div>
                      <div className="text-sm text-gray-500">Be notified when patients cancel appointments</div>
                    </div>
                    <input
                      type="checkbox"
                      name="cancellation_alerts"
                      checked={notificationSettings.cancellation_alerts}
                      onChange={handleNotificationChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">New Appointment Alerts</div>
                      <div className="text-sm text-gray-500">Get notified immediately when new appointments are booked</div>
                    </div>
                    <input
                      type="checkbox"
                      name="new_appointment_alerts"
                      checked={notificationSettings.new_appointment_alerts}
                      onChange={handleNotificationChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}