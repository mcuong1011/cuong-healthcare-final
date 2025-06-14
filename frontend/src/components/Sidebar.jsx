import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import DashboardIconUrl from '../assets/icons/grid.svg';
import CalendarIconUrl  from '../assets/icons/calendar.svg';
import AnalyticsIconUrl from '../assets/icons/analytics.svg';
import ReportsIconUrl   from '../assets/icons/reports.svg';
import HelpIconUrl      from '../assets/icons/help.svg';

// Navigation links for different user roles
const patientLinks = [
  { to: '/dashboard',           icon: DashboardIconUrl, label: 'Dashboard' },
  { to: '/appointments',        icon: CalendarIconUrl,  label: 'My Appointments' },
  { to: '/dashboard/reports',   icon: ReportsIconUrl,   label: 'Medical Records' },
  { to: '/dashboard/vr',        icon: AnalyticsIconUrl, label: 'Virtual Robot' },
  { to: '/help',                icon: HelpIconUrl,      label: 'Help' },
];

const doctorLinks = [
  { to: '/doctor/dashboard',    icon: DashboardIconUrl, label: 'Dashboard' },
  { to: '/appointments',        icon: CalendarIconUrl,  label: 'Appointments' },
  { to: '/dashboard/analytics', icon: AnalyticsIconUrl, label: 'Analytics' },
  { to: '/dashboard/reports',   icon: ReportsIconUrl,   label: 'Reports' },
  { to: '/help',                icon: HelpIconUrl,      label: 'Help' },
];

const defaultLinks = [
  { to: '/dashboard',           icon: DashboardIconUrl, label: 'Dashboard' },
  { to: '/appointments',        icon: CalendarIconUrl,  label: 'Appointments' },
  { to: '/dashboard/analytics', icon: AnalyticsIconUrl, label: 'Analytics' },
  { to: '/dashboard/reports',   icon: ReportsIconUrl,   label: 'Reports' },
  { to: '/help',                icon: HelpIconUrl,      label: 'Help' },
];

export default function Sidebar() {
  const [userRole, setUserRole] = useState('PATIENT');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('user_role') || 'PATIENT';
    const userDataStr = localStorage.getItem('user_data');
    
    setUserRole(role);
    
    if (userDataStr) {
      try {
        setUserData(JSON.parse(userDataStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Get appropriate navigation links based on user role
  const getNavigationLinks = () => {
    switch (userRole) {
      case 'DOCTOR':
        return doctorLinks;
      case 'PATIENT':
        return patientLinks;
      default:
        return defaultLinks;
    }
  };

  const links = getNavigationLinks();

  // Get user display info
  const getUserDisplayInfo = () => {
    if (userData) {
      const fullName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username;
      return {
        name: userRole === 'DOCTOR' ? `Dr. ${fullName}` : fullName,
        role: userRole === 'DOCTOR' ? 'Doctor' : 
              userRole === 'PATIENT' ? 'Patient' :
              userRole === 'NURSE' ? 'Nurse' :
              userRole === 'PHARMACIST' ? 'Pharmacist' :
              userRole === 'ADMIN' ? 'Administrator' : 'User',
        initials: fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U',
        avatar: userData.avatar_url || `https://i.pravatar.cc/150?u=${userData.email || 'user'}`
      };
    }
    
    return {
      name: userRole === 'DOCTOR' ? 'Dr. User' : 'User',
      role: userRole === 'DOCTOR' ? 'Doctor' : 
            userRole === 'PATIENT' ? 'Patient' :
            userRole === 'NURSE' ? 'Nurse' :
            userRole === 'PHARMACIST' ? 'Pharmacist' :
            userRole === 'ADMIN' ? 'Administrator' : 'User',
      initials: 'U',
      avatar: 'https://i.pravatar.cc/150?u=default'
    };
  };

  const userInfo = getUserDisplayInfo();

  return (
    <aside className="bg-white p-6 flex flex-col justify-between shadow-lg">
      {/* Logo */}
      <div>
        <h1 className="text-2xl font-bold mb-8 text-green-600">HealthCare</h1>
        {/* Navigation links */}
        <nav className="space-y-4">
          {links.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <img src={icon} alt={label} className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User info footer */}
      <div className="mt-8 flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        {userInfo.avatar ? (
          <img
            src={userInfo.avatar}
            alt={userInfo.name}
            className={`w-10 h-10 rounded-full border-2 ${
              userRole === 'DOCTOR' ? 'border-blue-200' : 
              userRole === 'PATIENT' ? 'border-green-200' :
              userRole === 'NURSE' ? 'border-purple-200' :
              userRole === 'PHARMACIST' ? 'border-orange-200' :
              userRole === 'ADMIN' ? 'border-red-200' : 'border-gray-200'
            }`}
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
            userRole === 'DOCTOR' ? 'bg-blue-500' : 
            userRole === 'PATIENT' ? 'bg-green-500' :
            userRole === 'NURSE' ? 'bg-purple-500' :
            userRole === 'PHARMACIST' ? 'bg-orange-500' :
            userRole === 'ADMIN' ? 'bg-red-500' : 'bg-gray-500'
          }`}>
            {userInfo.initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{userInfo.name}</p>
          <p className="text-sm text-gray-500">{userInfo.role}</p>
        </div>
      </div>
    </aside>
  );
}