const BASE_URL = 'http://localhost:3001/v1';

export function getImageUrl(url) {
  if (!url) return url;
  if (url.startsWith('/uploads')) {
    return `http://localhost:3001${url}`;
  }
  // GCS URLs: proxy through backend to handle auth
  if (url.startsWith('https://storage.googleapis.com/') || url.startsWith('https://firebasestorage.googleapis.com/')) {
    const token = localStorage.getItem('token');
    return `http://localhost:3001/v1/upload/image?url=${encodeURIComponent(url)}&token=${token}`;
  }
  return url;
}

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    // Auto-logout when token is expired or invalid
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Auth
export const authAPI = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request('/auth/me'),
  register: (userData) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
};

// Therapists
export const therapistAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/therapists${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/therapists/${id}`),
  validate: (id, status) =>
    request(`/therapists/${id}/validate`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  getSchedules: (id, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/therapists/${id}/schedules${query ? `?${query}` : ''}`);
  },
  createSchedule: (id, scheduleData) =>
    request(`/therapists/${id}/schedules`, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    }),
  deleteSchedule: (id, scheduleId) =>
    request(`/therapists/${id}/schedules/${scheduleId}`, {
      method: 'DELETE',
    }),
  getReviews: (id) => request(`/therapists/${id}/reviews`),
};

// Services
export const serviceAPI = {
  getAll: () => request('/services'),
  getById: (id) => request(`/services/${id}`),
  create: (serviceData) =>
    request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    }),
  update: (id, serviceData) =>
    request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    }),
  delete: (id) =>
    request(`/services/${id}`, {
      method: 'DELETE',
    }),
};

// Orders
export const orderAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/orders${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/orders/${id}`),
  create: (orderData) =>
    request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  updateStatus: (id, status) =>
    request(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  delete: (id) =>
    request(`/orders/${id}`, {
      method: 'DELETE',
    }),
};

// Payments
export const paymentAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/payments${query ? `?${query}` : ''}`);
  },
  initiate: (paymentData) =>
    request('/payments/initiate', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),
  confirm: (orderId, status) =>
    request(`/payments/${orderId}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  getByOrderId: (orderId) => request(`/payments/${orderId}`),
  getProofBlobUrl: async (orderId) => {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/payments/${orderId}/proof`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Gagal memuat bukti pembayaran');
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },
};

// Therapy Records
export const recordAPI = {
  create: (recordData) =>
    request('/records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    }),
  getById: (id) => request(`/records/${id}`),
  getByPatientId: (patientId) => request(`/patients/${patientId}/records`),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => request('/dashboard/stats'),
  getOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/dashboard/orders${query ? `?${query}` : ''}`);
  },
};

// Upload
export const uploadAPI = {
  uploadFile: (endpoint, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request(`/upload/${endpoint}`, {
      method: 'POST',
      body: formData,
    });
  },
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return request('/upload/photos', {
      method: 'POST',
      body: formData,
    });
  },
};

// NoSQL (Firestore)
export const nosqlAPI = {
  // Visit Tracking
  getTracking: (orderId) => request(`/nosql/tracking/${orderId}`),
  updateTracking: (orderId, status, notes = '') =>
    request(`/nosql/tracking/${orderId}`, {
      method: 'POST',
      body: JSON.stringify({ status, notes }),
    }),

  // Patient Notifications
  getNotifications: () => request('/nosql/notifications'),
  markAsRead: (notifId) =>
    request(`/nosql/notifications/${notifId}/read`, { method: 'PUT' }),

  // Activity Logs
  getActivityLogs: (limit = 50) => request(`/nosql/activity-logs?limit=${limit}`),
  getMyActivityLogs: (limit = 50) => request(`/nosql/my-activity-logs?limit=${limit}`),
};

// Patients
export const patientAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/patients${query ? `?${query}` : ''}`);
  },
};

