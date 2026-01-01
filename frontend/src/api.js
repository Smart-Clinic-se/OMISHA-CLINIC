import axios from 'axios';
import { io } from 'socket.io-client';
import { playNotificationSound } from './utils/audio';

// ==================== BACKEND URL ====================
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ==================== SOCKET.IO (Real-time) ====================
export const socket = io(BASE_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('✅ Real-time connected:', socket.id);
});

// ==================== AXIOS INSTANCE ====================
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Request Interceptor: Add Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response Interceptor: Global Error Logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

// ==================== NOTIFICATION SYSTEM ====================
let notificationShown = false;

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

export const checkIfMyTurnIsNear = (myToken, currentServingToken) => {
  if (!myToken || !currentServingToken || notificationShown) return;

  const myNum = parseInt(myToken.replace(/\D/g, '')) || 999;
  const currentNum = parseInt(currentServingToken.replace(/\D/g, '')) || 0;
  const patientsAhead = myNum - currentNum - 1;

  if (patientsAhead >= 0 && patientsAhead <= 3) {
    const message = patientsAhead === 0
      ? "You are NEXT! Please proceed to the doctor's cabin."
      : `Only ${patientsAhead} patient(s) ahead! Get ready!`;

    if (Notification.permission === 'granted') {
      new Notification('Omisha Clinic - Your Turn!', {
        body: message,
        icon: '/logo192.png',
      });
    }

    playNotificationSound();
    notificationShown = true;
    setTimeout(() => { notificationShown = false; }, 60000);
  }
};

// ==================== REAL-TIME LISTENERS ====================
export const listenToQueueUpdates = (callback) => {
  socket.on('queue_update', callback);
  return () => socket.off('queue_update');
};

export const listenToDoctorStatus = (callback) => {
  socket.on('doctor_status_update', callback);
  return () => socket.off('doctor_status_update');
};

export const listenToStaffNotifications = (callback) => {
  socket.on('staff_notification', callback);
  return () => socket.off('staff_notification');
};


// --- AUTHENTICATION ---
export const loginAPI = (data) => api.post('/auth/login', data);
export const registerAPI = (data) => api.post('/auth/register', data);
export const registerStaffAPI = (data) => api.post('/auth/register-staff', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const getSecurityQuestionAPI = (data) => api.post('/auth/get-security-question', data);
export const resetPasswordAPI = (data) => api.post('/auth/reset-password', data);
export const setSecurityQuestionAPI = (data) => api.post('/auth/set-security-question', data);
export const completeSecuritySetupAPI = (data) => api.post('/auth/complete-security-setup', data);
export const changePasswordAPI = (data) => api.post('/auth/change-password', data);

// --- DOCTORS ---
export const getDoctorsAPI = () => api.get('/auth/doctors');
export const getUsersByRoleAPI = (role) => api.get(`/auth/users?role=${role}`);
export const updateDoctorAvailabilityAPI = (doctorId, payload) =>
  api.patch(`/auth/availability/${doctorId}`, payload);
export const updateProfilePhotoAPI = (data) => api.patch('/users/profile-photo', data, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateProfileAPI = (data) => api.patch('/users/profile', data);

// --- QUEUE ---
export const getQueueAPI = (params) => api.get('/queue', { params });
export const addToQueueAPI = (data) => api.post('/queue/add', data);
export const collectPaymentAPI = (data) => api.post('/queue/collect-payment', data);
export const overridePaymentAPI = (data) => api.post('/queue/override-payment', data);
export const updateQueueStatusAPI = (id, updateData) => api.put(`/queue/update/${id}`, updateData);
export const deleteQueueItemAPI = (id) => api.delete(`/queue/delete/${id}`);
export const registerPatientQueueAPI = (data) => api.post('/queue/register', data);
export const confirmVitalsAPI = (id, data) => api.put(`/queue/confirm-vitals/${id}`, data);
export const notifyStaffAPI = (data) => api.post('/queue/notify-staff', data);

// --- MEDICAL RECORDS ---
export const addPrescriptionAPI = (data) => api.post('/medical/add', data);
export const getPatientHistoryAPI = (params) => api.get('/medical/history', { params });
export const getMedicalRecordByIdAPI = (id) => api.get(`/medical/record/${id}`);
export const amendRecordAPI = (id, data) => api.put(`/medical/amend/${id}`, data);
export const uploadReportAPI = (id, data) => api.post(`/medical/upload/${id}`, data);
export const getAuditLogsAPI = (params) => api.get('/audit', { params });
export const searchMedicineAPI = (query) => api.get(`/medicines/search?q=${query}`);

export default api;