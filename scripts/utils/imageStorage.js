export async function fetchAndSaveImageAsBlob(imageUrl, idbKey) {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const request = indexedDB.open("MyAppDatabase", 2);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "key" });
        console.log("Object store 'images' created.");
      }
    };

    request.onsuccess = (event) => {
      console.log("Database opened successfully.");
      const db = event.target.result;

      console.log("Available object stores:", db.objectStoreNames);

      const transaction = db.transaction("images", "readwrite");
      const store = transaction.objectStore("images");
      store.put({ key: idbKey, data: blob });

      transaction.oncomplete = () => {
        console.log(`Image with key '${idbKey}' saved to IndexedDB.`);
      };

      transaction.onerror = (event) => {
        console.error("Error saving image to IndexedDB:", event.target.error);
      };
    };

    request.onerror = (event) => {
      console.error("Database error while saving image:", event.target.error);
    };
  } catch (error) {
    console.error("Failed to fetch and save image as Blob:", error);
  }
}

export function getImageBlobFromIndexedDB(key, callback) {
  const request = indexedDB.open("MyAppDatabase", 2);

  request.onsuccess = (event) => {
    const db = event.target.result;

    const transaction = db.transaction("images", "readonly");
    const store = transaction.objectStore("images");
    const getRequest = store.get(key);

    getRequest.onsuccess = () => {
      const result = getRequest.result;

      if (result?.data) {
        const url = URL.createObjectURL(result.data);
        callback(url);
      } else {
        console.log(`No image found for key '${key}' in IndexedDB.`);
        callback(null);
      }
    };

    getRequest.onerror = (event) => {
      console.error("Error getting image from IndexedDB:", event.target.error);
    };
  };

  request.onerror = (event) => {
    console.error("Database error while retrieving image:", event.target.error);
  };
}

const openDatabase = () => {
  const request = indexedDB.open("MyAppDatabase", 2);

  request.onupgradeneeded = (event) => {
    const db = event.target.result;

    if (!db.objectStoreNames.contains("images")) {
      db.createObjectStore("images", { keyPath: "key" });
      console.log("Object store 'images' created.");
    }
  };

  request.onsuccess = (event) => {
    console.log("Database opened successfully.");
  };

  request.onerror = (event) => {
    console.error("Database error:", event.target.error);
  };
};

openDatabase();
