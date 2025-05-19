import CONFIG from "../config";
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

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${CONFIG.BASE_URL}/stories/${id}`,
};

export async function register(name, email, password) {
  const url = `${CONFIG.BASE_URL}/register`;

  if (!navigator.onLine) {
    throw new Error("Anda sedang offline. Tidak dapat melakukan registrasi.");
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
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

export async function login(email, password) {
  if (!navigator.onLine) {
    throw new Error("Anda sedang offline. Tidak dapat melakukan login.");
  }

  try {
    const response = await fetch(ENDPOINTS.LOGIN, {
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

    localStorage.setItem("token", loginResult.token);
    console.log("Token berhasil disimpan di localStorage:", loginResult.token);

    return loginResult;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
}

export async function getAllStories(page = 1, size = 10, location = 0, token) {
  try {
    if (!navigator.onLine) {
      console.warn("Offline mode: Data diambil dari IndexedDB.");
      return await getAllDataFromIndexedDB('stories');
    }

    const response = await fetch(
      `${ENDPOINTS.STORIES}?page=${page}&size=${size}&location=${location}`,
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

export async function addStory(description, photo, token, lat, lon) {
  const storyData = {
    description,
    photo,
    lat,
    lon,
    createdAt: new Date().toISOString()
  };

  if (!navigator.onLine) {
    const db = await dbPromise;
    const tx = db.transaction('storyQueue', 'readwrite');
    const store = tx.objectStore('storyQueue');
    await store.add(storyData);
    await tx.done;
    throw new Error("Anda sedang offline. Cerita akan ditambahkan saat online.");
  }

  try {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);
    if (lat) formData.append("lat", lat);
    if (lon) formData.append("lon", lon);

    const response = await fetch(ENDPOINTS.STORIES, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error dari API saat addStory:", errorText);
      throw new Error(`Server returned: ${errorText}`);
    }

    const responseJson = await response.json();
    console.log("Response JSON from addStory:", responseJson);
    console.log("Berhasil menambahkan cerita ke server.");
    // Tidak menyimpan langsung dari respons karena tidak ada detail cerita
    return responseJson;
  } catch (error) {
    console.error("Error in addStory:", error);
    throw error;
  }
}

export async function syncQueuedStories(token) {
  if (navigator.onLine) {
    try {
      const queuedStories = await getAllDataFromIndexedDB('storyQueue');
      for (const story of queuedStories) {
        const formData = new FormData();
        formData.append("description", story.description);
        formData.append("photo", story.photo);
        if (story.lat) formData.append("lat", story.lat);
        if (story.lon) formData.append("lon", story.lon);

        const response = await fetch(ENDPOINTS.STORIES, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const responseJson = await response.json();
          // Kita mungkin perlu mengambil detail cerita yang baru dibuat dari server di sini
          // atau menunggu pembaruan daftar cerita berikutnya.
          console.log("Berhasil mengirim cerita dari antrian:", responseJson);
          await deleteDataFromIndexedDB('storyQueue', story.id);
        } else {
          console.error(`Failed to send story with key ${story.id}: ${await response.text()}`);
        }
      }
    } catch (error) {
      console.error("Error syncing queued stories:", error);
    }
  }
}

export async function getStoryDetail(id, token) {
  try {
    if (!navigator.onLine) {
      console.warn("Offline mode: Mencoba mengambil detail cerita dari IndexedDB.");
      const detailFromIDB = await getDataByIdFromIndexedDB('stories', id);
      if (detailFromIDB) {
        return detailFromIDB;
      } else {
        return null; // Atau tampilkan pesan error di UI
      }
    }

    const response = await fetch(ENDPOINTS.STORY_DETAIL(id), {
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