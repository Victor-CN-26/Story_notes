import { register } from "../data/api.js";

export const handleRegister = async (event, showPopup) => {
  event.preventDefault();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  try {
    const response = await register(name, email, password);
    showPopup("Registration successful!", true);
    document.getElementById("registerForm").reset();
    setTimeout(() => {
      window.location.href = "#/login";
    }, 1500);
  } catch (error) {
    showPopup(`Error: ${error.message}`, false);
  }
};
