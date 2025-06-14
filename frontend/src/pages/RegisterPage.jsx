// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api, { registerUser } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT' // Default role
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.firstName) errs.firstName = 'First Name is required';
    if (!formData.lastName) errs.lastName = 'Last Name is required';
    if (!formData.username) errs.username = 'Username is required';
    if (!formData.email) errs.email = 'Email is required';
    if (!formData.email.includes('@')) errs.email = 'Enter a valid email address';
    if (!formData.password) errs.password = 'Password is required';
    if (formData.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (!formData.role) errs.role = 'Role is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API
      const apiData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        first_name: formData.firstName,
        last_name: formData.lastName
      };

      // Send registration request
      const response = await registerUser(apiData);
      if (response.status !== 201) {
        throw new Error('Registration failed');
      }
      
      console.log('Registration successful:', response.data);
      
      // Redirect to login page
      navigate('/login', { 
        state: { message: 'Registration successful! Please log in with your new account.' } 
      });
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Handle API error responses
      if (error.response && error.response.data) {
        const apiErrors = {};
        const errorData = error.response.data;
        
        // Map API errors to form fields
        if (errorData.username) apiErrors.username = errorData.username[0];
        if (errorData.email) apiErrors.email = errorData.email[0];
        if (errorData.password) apiErrors.password = errorData.password[0];
        if (errorData.first_name) apiErrors.firstName = errorData.first_name[0];
        if (errorData.last_name) apiErrors.lastName = errorData.last_name[0];
        
        setErrors({
          ...validationErrors,
          ...apiErrors,
          api: 'Registration failed. Please check your information and try again.'
        });
      } else {
        setErrors({
          ...validationErrors,
          api: 'Network error. Please try again later.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create an Account</h2>
        
        {errors.api && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {errors.api}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                placeholder="John"
              />
              {errors.firstName && <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                placeholder="Doe"
              />
              {errors.lastName && <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="johndoe"
            />
            {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <input
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
            >
              <option value="PATIENT">Patient</option>
              <option value="DOCTOR">Doctor</option>
              <option value="NURSE">Nurse</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="ADMIN">Admin</option>
            </select>
            {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
          </div>

          {/* Thêm thông tin chuyên biệt cho role DOCTOR */}
          {formData.role === 'DOCTOR' && (
            <div className="p-3 border border-gray-200 rounded-lg space-y-3 bg-gray-50">
              <p className="text-sm font-medium text-gray-700">
                Doctor information will be collected after registration during profile setup.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 ${loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} text-white font-semibold rounded-lg transition`}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}