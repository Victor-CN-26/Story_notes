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

export async function saveStory(story) {
  try {
    const db = await dbPromise;
    await db.put("stories", story);
    return true; // Beri tahu bahwa penyimpanan berhasil
  } catch (error) {
    console.error("Gagal menyimpan cerita:", error);
    throw error; // Lempar error agar ditangani di tempat lain
  }
}

export async function getAllStories() {
  try {
    const db = await dbPromise;
    const stories = await db.getAll("stories");
    return stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error("Gagal mengambil semua cerita:", error);
    throw error;
  }
}

export async function getStoryById(id) {
  try {
    const db = await dbPromise;
    return db.get("stories", id);
  } catch (error) {
    console.error("Gagal mengambil cerita berdasarkan ID:", error);
    throw error;
  }
}

export async function deleteStory(id) {
  try {
    const db = await dbPromise;
    await db.delete("stories", id);
    return true; // Beri tahu bahwa penghapusan berhasil
  } catch (error) {
    console.error("Gagal menghapus cerita:", error);
    throw error;
  }
}

export async function syncStories(newStories) {
  try {
    const db = await dbPromise;
    const tx = db.transaction("stories", "readwrite");
    const store = tx.objectStore("stories");

    const newStoryIds = newStories.map((story) => story.id);
    const existingStories = await store.getAll();

    for (const oldStory of existingStories) {
      if (!newStoryIds.includes(oldStory.id)) {
        await store.delete(oldStory.id);
      }
    }

    for (const story of newStories) {
      await store.put(story);
    }

    await tx.done;
    console.log("Sinkronisasi data selesai.");
    return true; // Beri tahu bahwa sinkronisasi berhasil
  } catch (error) {
    console.error("Gagal melakukan sinkronisasi data:", error);
    throw error;
  }
}

export async function getOfflineStories() {
  try {
    const db = await dbPromise;
    return db.getAll("stories");
  } catch (error) {
    console.error("Gagal mengambil data offline:", error);
    throw error;
  }
}

export async function enqueueStory(storyData) {
  try {
    const db = await dbPromise;
    const tx = db.transaction('storyQueue', 'readwrite');
    const store = tx.objectStore('storyQueue');
    await store.add(storyData);
    await tx.done;
    return true;
  } catch (error) {
    console.error("Gagal menambahkan cerita ke antrian:", error);
    throw error;
  }
}

export async function getQueuedStories() {
  try {
    const db = await dbPromise;
    return db.getAll('storyQueue');
  } catch (error) {
    console.error("Gagal mengambil antrian cerita:", error);
    throw error;
  }
}

export async function deleteQueuedStory(id) {
  try {
    const db = await dbPromise;
    const tx = db.transaction('storyQueue', 'readwrite');
    const store = tx.objectStore('storyQueue');
    await store.delete(id);
    await tx.done;
    return true;
  } catch (error) {
    console.error("Gagal menghapus cerita dari antrian:", error);
    throw error;
  }
}