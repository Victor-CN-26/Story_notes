// src/presenter/auth-logout-presenter.js
export default class AuthLogoutPresenter {
  constructor(view) {
    this.view = view;
  }

  async logoutUser() {
    // Hapus token dari localStorage
    localStorage.removeItem('token'); // Pastikan ini 'token' sesuai dengan yang Anda simpan saat login

    // Informasikan View untuk menampilkan pesan dan melakukan redirect
    this.view.displayLogoutMessage("Logout berhasil!");
    setTimeout(() => {
      window.location.hash = '/login'; // Redirect ke halaman login
    }, 500); // Beri sedikit waktu untuk melihat pesan
  }
}