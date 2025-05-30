// src/presenter/auth-register-presenter.js

// Mengimpor instance storyApi dari data/api.js
import { storyApi } from '../data/api.js';

export default class AuthRegisterPresenter {
  /**
   * Konstruktor untuk AuthRegisterPresenter.
   * @param {object} view - Instance dari RegisterPage (View).
   * @param {object} authApiInstance - Instance dari StoryApi (Model).
   */
  constructor(view, authApiInstance = storyApi) {
    this.view = view;
    this.authApi = authApiInstance;
  }

  /**
   * Menangani proses registrasi pengguna.
   * @param {string} name - Nama pengguna.
   * @param {string} email - Email pengguna.
   * @param {string} password - Kata sandi pengguna.
   */
  async registerUser(name, email, password) {
    this.view.showLoading(); // Tampilkan indikator loading
    try {
      // Panggil metode register dari API, mengirimkan data sebagai objek
      const response = await this.authApi.register({ name, email, password });

      // Log respons dari API untuk debugging
      console.log("Register API Response:", response);

      if (!response.error) { // Jika registrasi berhasil (sesuai respons API)
        this.view.displaySuccess(response.message || "Registrasi berhasil! Silakan login."); // Tampilkan pesan sukses
        this.view.resetForm(); // Reset formulir setelah registrasi berhasil

        // Arahkan pengguna ke halaman login setelah beberapa saat
        setTimeout(() => {
          window.location.hash = "/login";
        }, 1500); // Redirect setelah 1.5 detik
      } else { // Jika ada error dari API
        this.view.displayError(response.message); // Tampilkan pesan error dari API
      }
    } catch (error) {
      // Tangani error yang terjadi selama proses registrasi
      console.error("Register error:", error);
      let errorMessage = "Terjadi kesalahan saat registrasi. Mohon coba lagi.";
      if (error.message) {
        errorMessage = error.message;
      }
      this.view.displayError(errorMessage); // Tampilkan pesan error umum atau dari error object
    } finally {
      this.view.hideLoading(); // Sembunyikan indikator loading
    }
  }
}
