// src/data/api.js
import CONFIG from "../config.js"; // Pastikan path ini benar
import { openDB } from "idb";

const dbPromise = openDB("storyDB", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("stories")) {
      db.createObjectStore("stories", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("storyQueue")) {
      db.createObjectStore("storyQueue", { autoIncrement: true });
    }
  },
});

async function saveDataToIndexedDB(storeName, data) {
  const db = await dbPromise;
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  if (Array.isArray(data)) {
    data.forEach(item => store.put(item));
  } else {
    store.put(data);
  }
  return tx.done;
}

async function getAllDataFromIndexedDB(storeName) {
  const db = await dbPromise;
  return db.getAll(storeName);
}

async function getDataByIdFromIndexedDB(storeName, id) {
  const db = await dbPromise;
  return db.get(storeName, id);
}

async function deleteDataFromIndexedDB(storeName, id) {
  const db = await dbPromise;
  return db.delete(storeName, id);
}

// Ubah menjadi kelas StoryApi
class StoryApi {
  constructor(baseUrl = CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
    this.ENDPOINTS = {
      REGISTER: `${this.baseUrl}/register`,
      LOGIN: `${this.baseUrl}/login`,
      STORIES: `${this.baseUrl}/stories`,
      STORY_DETAIL: (id) => `${this.baseUrl}/stories/${id}`,
    };
  }

  // === PERBAIKAN DI SINI: Ubah signature register untuk menerima objek ===
  async register({ name, email, password }) { // Destrukturisasi objek yang diterima
    if (!navigator.onLine) {
      throw new Error("Anda sedang offline. Tidak dapat melakukan registrasi.");
    }

    try {
      const response = await fetch(this.ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }), // Sekarang 'name', 'email', 'password' adalah string yang benar
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal melakukan registrasi.");
      }

      return await response.json();
    } catch (error) {
      console.error("Error di register:", error.message);
      throw error;
    }
  }

  async login(email, password) {
    if (!navigator.onLine) {
      throw new Error("Anda sedang offline. Tidak dapat melakukan login.");
    }

    try {
      const response = await fetch(this.ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const responseJson = await response.json();

      console.log("Login response:", responseJson);

      if (!response.ok) {
        throw new Error(responseJson.message || "Gagal melakukan login.");
      }

      const { loginResult } = responseJson;
      if (
        !loginResult ||
        !loginResult.token ||
        !loginResult.token.includes(".")
      ) {
        throw new Error("Format token tidak valid.");
      }

      // Pastikan ini 'authToken' sesuai dengan yang digunakan di localStorage.setItem("authToken", ...)
      localStorage.setItem("authToken", loginResult.token);
      console.log("Token berhasil disimpan di localStorage:", loginResult.token);

      return loginResult;
    } catch (error) {
      console.error("Login error:", error.message);
      throw error;
    }
  }

  async getAllStories(page = 1, size = 10, location = 0, token) {
    try {
      if (!navigator.onLine) {
        console.warn("Offline mode: Data diambil dari IndexedDB.");
        return await getAllDataFromIndexedDB('stories');
      }

      const response = await fetch(
        `${this.ENDPOINTS.STORIES}?page=${page}&size=${size}&location=${location}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      await saveDataToIndexedDB('stories', data.listStory);
      console.log(
        "Data berhasil diambil dari API dan disimpan ke IndexedDB."
      );
      return data.listStory;
    } catch (error) {
      console.error("Error di getAllStories:", error.message);
      console.warn("Mengambil data dari IndexedDB sebagai fallback.");
      return await getAllDataFromIndexedDB('stories');
    }
  }

  // === PERBAIKAN UTAMA DI SINI: Ubah signature addStory ===
  // Sekarang menerima formData (yang sudah berisi description, photo, lat, lon) dan token secara terpisah
  async addStory(formData, token) {
    // formData sudah dibuat di presenter, jadi langsung gunakan
    // Offline handling untuk addStory sudah ada di stories-presenter.js, jadi tidak perlu di sini lagi
    // Kecuali Anda ingin IndexedDB queueing di sini juga.
    // Untuk saat ini, kita ikuti alur presenter yang sudah ada.

    try {
      const response = await fetch(this.ENDPOINTS.STORIES, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Content-Type tidak perlu diatur untuk FormData, browser akan mengaturnya secara otomatis
        },
        body: formData, // Langsung gunakan objek FormData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error dari API saat addStory:", errorText);
        // Coba parse errorText jika itu JSON
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `Server returned: ${errorText}`);
        } catch (parseError) {
            throw new Error(`Server returned: ${errorText}`);
        }
      }

      const responseJson = await response.json();
      console.log("Response JSON from addStory:", responseJson);
      console.log("Berhasil menambahkan cerita ke server.");
      return responseJson;
    } catch (error) {
      console.error("Error in addStory:", error);
      throw error;
    }
  }

  async syncQueuedStories(token) {
    if (navigator.onLine) {
      try {
        const queuedStories = await getAllDataFromIndexedDB('storyQueue');
        for (const story of queuedStories) {
          const formData = new FormData();
          formData.append("description", story.description);
          // Perhatian: story.photo dari IndexedDB mungkin bukan File/Blob lagi
          // Jika Anda menyimpan Blob di IndexedDB, Anda perlu mengambilnya kembali sebagai Blob
          // Jika Anda menyimpan Data URL, Anda perlu mengubahnya kembali ke Blob/File
          // Untuk demo ini, kita asumsikan story.photo adalah Blob/File yang valid
          formData.append("photo", story.photo);
          if (story.lat) formData.append("lat", story.lat);
          if (story.lon) formData.append("lon", story.lon);

          const response = await fetch(this.ENDPOINTS.STORIES, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (response.ok) {
            const responseJson = await response.json();
            console.log("Berhasil mengirim cerita dari antrian:", responseJson);
            await deleteDataFromIndexedDB('storyQueue', story.key); // Menggunakan key yang dikembalikan oleh IndexedDB
          } else {
            console.error(`Failed to send story from queue: ${await response.text()}`);
          }
        }
      } catch (error) {
        console.error("Error syncing queued stories:", error);
      }
    }
  }

  async getStoryDetail(id, token) {
    try {
      if (!navigator.onLine) {
        console.warn("Offline mode: Mencoba mengambil detail cerita dari IndexedDB.");
        const detailFromIDB = await getDataByIdFromIndexedDB('stories', id);
        if (detailFromIDB) {
          return detailFromIDB;
        } else {
          return null;
        }
      }

      const response = await fetch(this.ENDPOINTS.STORY_DETAIL(id), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const storyDetail = await response.json();
      await saveDataToIndexedDB('stories', storyDetail.story);
      return storyDetail.story;

    } catch (error) {
      console.error("Error fetching story detail:", error);
      throw error;
    }
  }
}

// Ekspor instance dari kelas StoryApi
export const storyApi = new StoryApi();

// Pertahankan fungsi-fungsi helper IndexedDB jika masih digunakan secara langsung di tempat lain
export { saveDataToIndexedDB, getAllDataFromIndexedDB, getDataByIdFromIndexedDB, deleteDataFromIndexedDB };
