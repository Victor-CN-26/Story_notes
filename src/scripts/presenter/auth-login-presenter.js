// src/presenter/auth-login-presenter.js

// Import instance storyApi, bukan lagi fungsi 'login' langsung
import { storyApi } from "../data/api.js";

export default class AuthLoginPresenter {
  // Presenter menerima view dan storyApi melalui konstruktor
  constructor(view, storyApi) {
    this.view = view;
    this.storyApi = storyApi; // Simpan instance storyApi
  }

  async loginUser(email, password) { // Ubah nama fungsi agar lebih spesifik
    try {
      this.view.showLoading(); // Panggil metode view untuk menampilkan loading
      const loginResult = await this.storyApi.login(email, password); // Panggil metode dari storyApi
      console.log("Login successful:", loginResult);

      // Pastikan kunci localStorage adalah 'authToken' agar konsisten dengan app.js dan auth-helper.js
      localStorage.setItem("authToken", loginResult.token);

      this.view.displayLoginSuccess("Login berhasil! Anda akan diarahkan ke halaman utama.");

      // Memicu event 'auth-status-changed' agar navbar dapat memperbarui tampilannya
      window.dispatchEvent(new Event('auth-status-changed'));

      setTimeout(() => {
        // === PERBAIKAN PENTING DI SINI ===
        // Ubah dari "/home" menjadi "/" karena beranda Anda adalah route default '/'
        window.location.hash = "/";
      }, 1500); // Anda bisa mencoba menaikkan nilai ini jika masih ada masalah timing
    } catch (error) {
      console.error("Login error:", error);
      this.view.displayLoginError(error.message); // Panggil metode view untuk menampilkan error
    } finally {
      this.view.hideLoading(); // Panggil metode view untuk menyembunyikan loading
    }
  }
}