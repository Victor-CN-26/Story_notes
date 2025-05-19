import { handleRegister } from "../../presenter/auth-register-presenter.js";

export default class RegisterPage {
  async render() {
    return `
          <section class="container">
            <h1>Register</h1>
            <form id="registerForm">
              <div>
                <label for="registerName">Name:</label>
                <input type="text" id="registerName" name="name" required />
              </div>
              <div>
                <label for="registerEmail">Email:</label>
                <input type="email" id="registerEmail" name="email" required />
              </div>
              <div>
                <label for="registerPassword">Password:</label>
                <input type="password" id="registerPassword" name="password" required />
              </div>
              <button type="submit">Register</button>
            </form>
            <div id="popupMessage" class="hidden"></div>
          </section>
        `;
  }

  async afterRender() {
    const form = document.getElementById("registerForm");

    const showPopup = (message, isSuccess = true) => {
      const popup = document.getElementById("popupMessage");
      popup.textContent = message;

      popup.className = `show ${isSuccess ? "success" : "error"}`;

      setTimeout(() => {
        popup.className = "";
      }, 3000);
    };

    form.addEventListener("submit", (event) =>
      handleRegister(event, showPopup)
    );
  }
}
