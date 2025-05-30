// src/pages/auth/login.js
import AuthLoginPresenter from "../../presenter/auth-login-presenter.js"; // Import Presenter
import { storyApi } from "../../data/api.js"; // Import instance storyApi

export default class LoginPage {
  constructor() {
    // Inisialisasi presenter dan injeksikan storyApi sebagai model
    this.presenter = new AuthLoginPresenter(this, storyApi);
  }

  async render() {
    return `
      <section class="container">
        <h1>Login</h1>
        <form id="loginForm">
          <div>
            <label for="loginEmail">Email:</label>
            <input type="email" id="loginEmail" name="email" required />
          </div>
          <div>
            <label for="loginPassword">Password:</label>
            <input type="password" id="loginPassword" name="password" required />
          </div>
          <button type="submit">Login</button>
        </form>
        <div id="popupMessage" class="hidden"></div>
        <div id="loadingIndicator" class="hidden">Loading...</div> </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("loginForm");
    const emailInput = document.getElementById("loginEmail");
    const passwordInput = document.getElementById("loginPassword");

    form.addEventListener("submit", (event) => {
      event.preventDefault(); // Mencegah refresh halaman
      const email = emailInput.value;
      const password = passwordInput.value;
      // Panggil metode dari presenter
      this.presenter.loginUser(email, password);
    });
  }

  // Metode untuk menampilkan pesan sukses/error
  displayLoginSuccess(message) {
    this._showPopup(message, true);
  }

  displayLoginError(message) {
    this._showPopup(message, false);
  }

  // Metode untuk menampilkan loading
  showLoading() {
    document.getElementById("loadingIndicator").classList.remove("hidden");
  }

  hideLoading() {
    document.getElementById("loadingIndicator").classList.add("hidden");
  }

  // Helper untuk menampilkan popup
  _showPopup(message, isSuccess = false) {
    const popup = document.getElementById("popupMessage");
    popup.textContent = message;
    popup.style.backgroundColor = isSuccess ? "#4CAF50" : "#FF4D4F"; // Warna hijau untuk sukses, merah untuk error
    popup.classList.add("show");

    setTimeout(() => {
      popup.classList.remove("show");
      popup.style.backgroundColor = ""; // Reset background color
    }, 3000);
  }
}