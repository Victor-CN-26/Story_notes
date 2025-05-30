// src/pages/auth/logout-page.js
import AuthLogoutPresenter from "../../presenter/auth-logout-presenter.js";

export default class LogoutPage {
  constructor() {
    this.presenter = new AuthLogoutPresenter(this);
  }

  async render() {
    return `
      <section class="container login-container">
        <p id="logoutMessage">Sedang logout...</p>
      </section>
    `;
  }

  async afterRender() {
    await this.presenter.logoutUser();
  }

  displayLogoutMessage(message) {
    const logoutMsgElement = document.getElementById("logoutMessage");
    if (logoutMsgElement) {
      logoutMsgElement.textContent = message;
    }
  }
}