// src/utils/auth-helper.js

export const isAuthenticated = () => {
  const token = localStorage.getItem('authToken'); // Gunakan 'authToken' sesuai app.js Anda
  return !!token; // Mengembalikan true jika token ada, false jika tidak
};

export const logout = () => {
  localStorage.removeItem('authToken'); // Hapus 'authToken'
  // Trigger custom event untuk memberitahu komponen lain (terutama navbar)
  window.dispatchEvent(new Event('auth-status-changed'));
  window.location.hash = '/login'; // Redirect ke halaman login
};