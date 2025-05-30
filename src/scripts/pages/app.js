// src/app.js

import routes from '../routes/routes.js'; // Asumsi Anda punya file ini untuk routing
import UrlParser from '../routes/url-parser.js'; // Asumsi Anda punya file ini
import { isAuthenticated, logout } from '../utils/auth-helper.js'; // Kita akan buat/modifikasi file ini

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #mainNavbar = null; // Tambahkan referensi ke elemen navbar utama jika ada

  constructor({ navigationDrawer, drawerButton, content, mainNavbar }) { // Tambahkan mainNavbar
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;
    this.#mainNavbar = mainNavbar; // Simpan referensi

    this.#setupDrawer();
    this.#initialAppShell(); // Panggil ini untuk setup awal aplikasi dan routing
    this.#updateNavbar(); // Panggil ini sekali saat inisialisasi

    // Tambahkan event listener untuk memantau perubahan status otentikasi
    window.addEventListener('auth-status-changed', () => {
      this.#updateNavbar(); // Panggil #updateNavbar setiap kali status otentikasi berubah
    });
  }

  #initialAppShell() {
    window.addEventListener('hashchange', () => {
      this.#renderPage();
      this.#updateNavbar(); // Pastikan navbar juga terupdate saat navigasi hash berubah
    });
    window.addEventListener('load', () => {
      this.#renderPage();
      this.#updateNavbar(); // Pastikan navbar juga terupdate saat halaman pertama dimuat
    });
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
    const isLoggedIn = isAuthenticated(); // Menggunakan helper
    let navHtml = ''; // Untuk konten navigasi utama (jika Anda memiliki)
    let drawerHtml = `
      <li><a href="#/">Beranda</a></li>
      <li><a href="#/about">About</a></li>
    `;

    if (isLoggedIn) {
      // Navbar utama (jika ada elemen terpisah untuk desktop)
      if (this.#mainNavbar) {
        this.#mainNavbar.innerHTML = `
          <ul>
            <li><a href="#/">Beranda</a></li>
            <li><a href="#/about">About</a></li>
            <li><a href="#/add-story">Add Story</a></li>
            <li><a href="#/logout" id="logoutLinkDesktop">Logout</a></li>
          </ul>
        `;
      }
      // Untuk navigation drawer (mobile)
      drawerHtml += `
        <li><a href="#/add-story">Add Story</a></li>
        <li><a href="#/logout" id="logoutLinkMobile">Logout</a></li>
      `;
    } else {
      // Navbar utama
      if (this.#mainNavbar) {
        this.#mainNavbar.innerHTML = `
          <ul>
            <li><a href="#/">Beranda</a></li>
            <li><a href="#/about">About</a></li>
            <li><a href="#/login">Login</a></li>
            <li><a href="#/register">Register</a></li>
          </ul>
        `;
      }
      // Untuk navigation drawer
      drawerHtml += `
        <li><a href="#/login">Login</a></li>
        <li><a href="#/register">Register</a></li>
      `;
    }

    // Set innerHTML untuk navigation drawer
    this.#navigationDrawer.querySelector('ul').innerHTML = drawerHtml; // Asumsi #navigationDrawer berisi <ul>

    // Tambahkan event listener untuk logout
    // Ini harus ditambahkan SETELAH elemen-elemennya dirender ulang
    const logoutLinkDesktop = document.getElementById('logoutLinkDesktop');
    if (logoutLinkDesktop) {
      logoutLinkDesktop.addEventListener('click', (event) => {
        event.preventDefault();
        logout(); // Panggil fungsi logout dari auth-helper
      });
    }

    const logoutLinkMobile = document.getElementById('logoutLinkMobile');
    if (logoutLinkMobile) {
      logoutLinkMobile.addEventListener('click', (event) => {
        event.preventDefault();
        logout(); // Panggil fungsi logout dari auth-helper
      });
    }
  }

  async #renderPage() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const page = routes[url];

    if (page) {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    } else {
      // Halaman 404
      this.#content.innerHTML = `
        <section class="container">
          <h1>404 - Halaman Tidak Ditemukan</h1>
          <p>Maaf, halaman yang kamu cari nggak ada.</p>
          <p><a href="#/">Balik ke Home</a></p>
        </section>
      `;
    }
  }
}

// ----- Fungsi Global yang dipindahkan atau dipertahankan -----
// Pastikan initApp dan subscribePushNotification dipanggil setelah DOMContentLoaded
// Ini adalah bagian dari inisialisasi aplikasi secara keseluruhan, bukan bagian dari kelas App itu sendiri.
// Anda mungkin ingin memindahkan logic initApp ini ke main.js atau sejenisnya.

// initApp dan subscribePushNotification harus di-handle dengan hati-hati.
// Jika Anda ingin mereka dipanggil otomatis saat aplikasi dimuat, pastikan di index.js atau main.js
// Untuk saat ini, kita akan asumsikan mereka tetap di app.js

// Perhatikan: Karena App diekspor default, fungsi initApp() harus di luar kelas App
// dan harus dipanggil setelah DOM sepenuhnya dimuat.

document.addEventListener('DOMContentLoaded', () => {
  // Anda perlu mempassing elemen-elemen DOM yang sesuai ke konstruktor App
  const navigationDrawerElement = document.getElementById('navigationDrawer'); // Ganti dengan ID drawer Anda
  const drawerButtonElement = document.getElementById('drawerButton');     // Ganti dengan ID tombol drawer Anda
  const mainContentElement = document.getElementById('mainContent');      // Ganti dengan ID elemen konten utama Anda
  const mainNavbarElement = document.getElementById('mainNavbar');        // Ganti dengan ID elemen navbar utama Anda (jika ada)

  if (navigationDrawerElement && drawerButtonElement && mainContentElement) {
    const app = new App({
      navigationDrawer: navigationDrawerElement,
      drawerButton: drawerButtonElement,
      content: mainContentElement,
      mainNavbar: mainNavbarElement // Pastikan ini juga ada di DOM
    });
    // Inisialisasi awal rute setelah app siap
    app._initialAppShell();
  } else {
    console.error("Elemen DOM untuk aplikasi tidak ditemukan.");
  }

  // Panggil initApp yang menangani Service Worker dan Push Notifikasi
  initApp();
});


// Fungsi-fungsi global yang Anda miliki:
async function initApp() {
  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered:", registration);

      // Panggil subscribePushNotification setelah SW terdaftar
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

    // PASTIKAN KEY INI SAMA DENGAN SAAT LOGIN: "token" atau "authToken"
    // Sesuai kode Anda, ini adalah "authToken"
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


export default App; // Pastikan kelas App tetap diekspor