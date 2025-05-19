class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#updateNavbar();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  #updateNavbar() {
    const token = localStorage.getItem("authToken");
    const loginLink = this.#navigationDrawer.querySelector('a[href="#/login"]');

    if (token && loginLink) {
      try {
        loginLink.textContent = "Anda sudah login";
      } catch (error) {
        console.error("Invalid token:", error);
        loginLink.textContent = "Login";
      }
    } else if (!token && loginLink) {
      loginLink.textContent = "Login";
    }
  }
}

async function initApp() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);

      await subscribePushNotification();
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    }
  }
}
async function subscribePushNotification() {
  if (!("PushManager" in window)) {
    console.error("Push notifications are not supported by your browser.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const vapidPublicKey =
      "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("Push notification subscription:", subscription);

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("Token tidak ditemukan. Tidak bisa melanjutkan.");
      return;
    }

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.toJSON().keys.p256dh,
        auth: subscription.toJSON().keys.auth,
      },
    };

    const response = await fetch(
      "https://story-api.dicoding.dev/v1/notifications/subscribe",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionData),
      }
    );

    const responseData = await response.json();
    if (response.ok) {
      console.log("Berhasil subscribe push notification:", responseData);
    } else {
      console.error("Gagal subscribe push notification:", responseData);
    }
  } catch (error) {
    console.error("Error during push notification subscription:", error);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

initApp();

export default App;
