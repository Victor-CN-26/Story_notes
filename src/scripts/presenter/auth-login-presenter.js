import { login } from "../data/api.js";

export const handleLogin = async (event, showPopup) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await login(email, password);
    localStorage.setItem("authToken", response.token);

    showPopup("Login successful!", true);

    setTimeout(() => {
      window.location.href = "/home";
    }, 1500);
  } catch (error) {
    showPopup(`Error: ${error.message}`);
  }
};
