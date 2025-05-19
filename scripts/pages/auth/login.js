import { handleLogin } from "../../presenter/auth-login-presenter.js";

export default class LoginPage {
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
          </section>
        `;
  }

  async afterRender() {
    const form = document.getElementById("loginForm");

    const showPopup = (message, isSuccess = false) => {
      const popup = document.getElementById("popupMessage");
      popup.textContent = message;
      popup.style.backgroundColor = isSuccess ? "#4CAF50" : "#FF4D4F";
      popup.classList.add("show");

      setTimeout(() => {
        popup.classList.remove("show");
      }, 3000);
    };

    form.addEventListener("submit", (event) => handleLogin(event, showPopup));
  }
}
