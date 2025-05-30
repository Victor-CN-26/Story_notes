import "../styles/styles.css";
import App from "./pages/app";
import router from "./routes/routes";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  window.addEventListener("hashchange", router);
  await router();
});
