// src/pages/auth/register-page.js

// Mengimpor AuthRegisterPresenter
import AuthRegisterPresenter from "../../presenter/auth-register-presenter.js";
// Mengimpor instance storyApi (model yang akan diinjeksikan ke presenter)
import { storyApi } from "../../data/api.js";

export default class RegisterPage {
  /**
   * Konstruktor untuk RegisterPage.
   */
  constructor() {
    // Inisialisasi presenter dan injeksikan instance storyApi sebagai model
    this.presenter = new AuthRegisterPresenter(this, storyApi);
  }

  /**
   * Mengembalikan string HTML untuk halaman registrasi.
   * @returns {string} HTML halaman registrasi.
   */
  async render() {
    return `
      <section class="container">
        <h1>Register</h1>
        <form id="registerForm">
          <div>
            <label for="registerName">Nama:</label>
            <input type="text" id="registerName" name="name" required />
          </div>
          <div>
            <label for="registerEmail">Email:</label>
            <input type="email" id="registerEmail" name="email" required />
          </div>
          <div>
            <label for="registerPassword">Kata Sandi:</label>
            <input type="password" id="registerPassword" name="password" required />
          </div>
          <button type="submit">Daftar</button>
        </form>
        <div id="popupMessage" class="hidden"></div>
        <div id="loadingIndicator" class="hidden">Loading...</div>
      </section>
    `;
  }

  /**
   * Metode yang dipanggil setelah HTML dirender ke DOM.
   * Mengatur event listener untuk formulir.
   */
  async afterRender() {
    const form = document.getElementById("registerForm");
    const nameInput = document.getElementById("registerName");
    const emailInput = document.getElementById("registerEmail");
    const passwordInput = document.getElementById("registerPassword");

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault(); // Mencegah refresh halaman
        const name = nameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        // Panggil metode registerUser dari presenter
        this.presenter.registerUser(name, email, password);
      });
    }
  }

  // --- Metode yang diimplementasikan oleh View (dipanggil oleh Presenter) ---

  /**
   * Menampilkan pesan sukses di popup.
   * @param {string} message - Pesan sukses yang akan ditampilkan.
   */
  displaySuccess(message) {
    this._showPopup(message, true);
  }

  /**
   * Menampilkan pesan error di popup.
   * @param {string} message - Pesan error yang akan ditampilkan.
   */
  displayError(message) {
    this._showPopup(message, false);
  }

  /**
   * Menampilkan indikator loading.
   */
  showLoading() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
      loadingIndicator.classList.remove("hidden");
    }
  }

  /**
   * Menyembunyikan indikator loading.
   */
  hideLoading() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
      loadingIndicator.classList.add("hidden");
    }
  }

  /**
   * Mereset formulir registrasi dan menyembunyikan popup.
   */
  resetForm() {
    const form = document.getElementById("registerForm");
    if (form) {
      form.reset(); // Mereset semua input di dalam form
    }
    const popup = document.getElementById("popupMessage");
    if (popup) {
      popup.classList.remove("show"); // Pastikan kelas 'show' dihapus
      popup.style.backgroundColor = ""; // Reset warna latar belakang
      popup.style.display = "none"; // Sembunyikan elemen sepenuhnya
      popup.textContent = ""; // Kosongkan teks
    }
    this.hideLoading(); // Memastikan indikator loading disembunyikan
  }

  /**
   * Helper untuk menampilkan popup pesan.
   * Mengikuti pola _showPopup dari login.js.
   * @param {string} message - Pesan yang akan ditampilkan.
   * @param {boolean} isSuccess - True jika pesan sukses, false jika error.
   */
  _showPopup(message, isSuccess = false) {
    const popup = document.getElementById("popupMessage");
    if (!popup) {
      console.error("Elemen popup dengan ID 'popupMessage' tidak ditemukan!");
      return;
    }

    popup.textContent = message;
    // Mengatur warna latar belakang secara langsung (seperti di login.js)
    popup.style.backgroundColor = isSuccess ? "#4CAF50" : "#FF4D4F"; 
    
    // Tampilkan elemen dan picu transisi
    popup.style.display = "block";
    requestAnimationFrame(() => { // Gunakan requestAnimationFrame untuk memastikan display:block diterapkan sebelum transisi
      popup.classList.add("show");
    });

    // Sembunyikan popup setelah 3 detik
    setTimeout(() => {
      popup.classList.remove("show"); // Hapus kelas 'show' untuk memicu transisi keluar
      // Beri waktu sebentar agar transisi keluar selesai sebelum menyembunyikan sepenuhnya
      setTimeout(() => {
        popup.style.backgroundColor = ""; // Reset warna latar belakang
        popup.style.display = "none"; // Sembunyikan elemen sepenuhnya
        popup.textContent = ""; // Kosongkan teks
      }, 500); // Sesuaikan dengan durasi transisi CSS (0.5s)
    }, 3000); // Popup akan terlihat selama 3 detik
  }
}
