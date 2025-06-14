// src/services/api.js
import axios from 'axios';

// Đọc base URL từ biến môi trường hoặc mặc định
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Tạo axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false // đổi thành true nếu backend dùng cookie/session
});

// Interceptor request: gắn token nếu có
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  error => Promise.reject(error)
);

// Xử lý refresh token khi gặp 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  err => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refresh');

      return new Promise((resolve, reject) => {
        axios.post(`${API_BASE}/users/refresh/`, { refresh: refreshToken })
          .then(({ data }) => {
            const newToken = data.token;
            localStorage.setItem('token', newToken);
            api.defaults.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          })
          .catch(error => {
            processQueue(error, null);
            // nếu refresh fail → logout
            // logoutUser();
            reject(error);
          })
          .finally(() => { isRefreshing = false; });
      });
    }
    return Promise.reject(err);
  }
);

// Auth API helpers
export const loginUser = (credentials) =>
  api.post('/users/login/', credentials)
     .then(res => {
       const { token } = res.data;
       localStorage.setItem('token', token.access);
       localStorage.setItem('refresh', token.refresh);
       api.defaults.headers.Authorization = `Bearer ${token.access}`;
       return res.data;
     });

export const registerUser = (userData) =>
  api.post('/users/register/', userData);

export const getProfile = () =>
  api.get('/users/me/');

export const updateProfile = (userData) =>
  api.put('/users/me/', userData);

export const uploadAvatar = (formData) =>
  api.post('/users/me/upload-avatar/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const getDashboardStats = () =>
  api.get('/users/dashboard-stats/');

export const getAppointmentStats = (userType, userId) => {
  if (userType === 'doctor') {
    return api.get(`/appointments/stats/doctor/${userId}/`);
  } else if (userType === 'patient') {
    return api.get(`/appointments/stats/patient/${userId}/`);
  } else {
    return Promise.reject(new Error('Invalid user type'));
  }
};

export const getAppointments = (params = {}) =>
  api.get('/appointments/', { params });

export const getRecentAppointments = (userType, userId, limit = 10) => {
  // If no userType/userId provided, try to get from localStorage
  if (!userType || !userId) {
    const userRole = localStorage.getItem('user_role');
    const userIdFromStorage = localStorage.getItem('user_id');
    
    if (userRole && userIdFromStorage) {
      userType = userRole.toLowerCase() === 'doctor' ? 'doctor' : 'patient';
      userId = userIdFromStorage;
    } else {
      // Fallback to old endpoint
      return api.get(`/appointments/recent/?limit=${limit}`);
    }
  }
  
  return api.get(`/appointments/recent/${userType}/${userId}/?limit=${limit}`);
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_data');
  delete api.defaults.headers.Authorization;
  window.location.href = '/login';
};

// Medical Records API functions
export const getMedicalRecords = (patientId = null) => {
  const endpoint = patientId ? `/medical-records/patient/${patientId}/` : '/medical-records/';
  return api.get(endpoint);
};

export const getConsultations = (patientId = null, params = {}) => {
  const endpoint = patientId ? `/consultations/patient/${patientId}/` : '/consultations/';
  return api.get(endpoint, { params });
};

export const getTestResults = (patientId = null, params = {}) => {
  const endpoint = patientId ? `/test-results/patient/${patientId}/` : '/test-results/';
  return api.get(endpoint, { params });
};

export const getPrescriptions = (patientId = null, params = {}) => {
  const endpoint = patientId ? `/prescriptions/patient/${patientId}/` : '/prescriptions/';
  return api.get(endpoint, { params });
};

export const getVitalSigns = (patientId = null, params = {}) => {
  const endpoint = patientId ? `/vital-signs/patient/${patientId}/` : '/vital-signs/';
  return api.get(endpoint, { params });
};

export const getAllergies = (patientId = null) => {
  const endpoint = patientId ? `/allergies/patient/${patientId}/` : '/allergies/';
  return api.get(endpoint);
};

export const createAllergy = (allergyData) => {
  return api.post('/allergies/', allergyData);
};

export const updateAllergy = (allergyId, allergyData) => {
  return api.put(`/allergies/${allergyId}/`, allergyData);
};

export const deleteAllergy = (allergyId) => {
  return api.delete(`/allergies/${allergyId}/`);
};

export const downloadTestResult = (testId) => {
  return api.get(`/test-results/${testId}/download/`, {
    responseType: 'blob'
  });
};

export const downloadPrescription = (prescriptionId) => {
  return api.get(`/prescriptions/${prescriptionId}/download/`, {
    responseType: 'blob'
  });
};

// Medical Records Statistics
export const getMedicalRecordsStats = (patientId = null) => {
  const endpoint = patientId ? `/medical-records/stats/patient/${patientId}/` : '/medical-records/stats/';
  return api.get(endpoint);
};

export default api;
