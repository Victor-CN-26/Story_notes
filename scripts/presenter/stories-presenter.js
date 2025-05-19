import { addStory } from "../data/api.js";
import { fromLonLat, toLonLat } from "ol/proj";

let currentVideoStream = null; // Menyimpan referensi stream global

export const handleFormSubmission = async (event, showPopup) => {
  event.preventDefault();

  const description = document.getElementById("description").value;
  const photo = document.getElementById("photo").files[0];
  const lat = document.getElementById("lat").value;
  const lon = document.getElementById("lon").value;
  const token = localStorage.getItem("authToken");

  if (!photo) {
    showPopup("Please take a photo before submitting.", false);
    return;
  }

  if (!token) {
    showPopup("Please log in first.");
    return;
  }

  try {
    await addStory(description, photo, token, lat || null, lon || null);
    showPopup("Story added successfully!", true);

    setTimeout(() => {
      window.location.hash = "/";
    }, 2000);
  } catch (error) {
    showPopup(`Error: ${error.message}`, false);
  }
};

export async function openCamera(videoElement, takePhotoButtonElement) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.style.display = "block";
    videoElement.play();

    takePhotoButtonElement.style.display = "inline-block";
    const openCameraButton = document.getElementById("openCameraButton");
    if (openCameraButton) {
      openCameraButton.style.display = "none";
    }

    takePhotoButtonElement.onclick = () => {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      const photoData = canvas.toDataURL("image/png");

      const photoPreview = document.getElementById("photoPreview");
      if (photoPreview) {
        photoPreview.src = photoData;
        photoPreview.style.display = "block";
      }

      const photoBlob = dataURLtoBlob(photoData);
      const file = new File([photoBlob], "photo.png", { type: "image/png" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const photoInput = document.getElementById("photo");
      if (photoInput) {
        photoInput.files = dataTransfer.files;
      }

      stopCamera(); // Hentikan stream setelah mengambil foto
    };

    return stream; // Kembalikan stream
  } catch (error) {
    console.error("Error accessing camera:", error);
    throw error;
  }
}

export function stopCamera() {
  if (currentVideoStream) {
    currentVideoStream.getTracks().forEach((track) => {
      track.stop();
      console.log("Presenter - Track stopped:", track.kind);
    });
    currentVideoStream = null;
    const video = document.getElementById("cameraStream");
    if (video) {
      video.style.display = "none";
      video.srcObject = null;
    }
    const takePhotoButton = document.getElementById("takePhotoButton");
    if (takePhotoButton) {
      takePhotoButton.style.display = "none";
    }
    const openCameraButton = document.getElementById("openCameraButton");
    if (openCameraButton) {
      openCameraButton.style.display = "inline-block";
    }
  }
  console.log("Presenter - Camera stream stopped.");
}

function dataURLtoBlob(dataURL) {
  const arr = dataURL.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export const initializeMap = (map, marker, defaultCoordinates) => {
  map.on("click", (event) => {
    const coordinates = event.coordinate;
    const [lon, lat] = toLonLat(coordinates);

    marker.getGeometry().setCoordinates(coordinates);

    document.getElementById("lat").value = lat.toFixed(6);
    document.getElementById("lon").value = lon.toFixed(6);
  });

  document.getElementById("resetMarker").addEventListener("click", () => {
    const defaultCoords = fromLonLat(defaultCoordinates);
    marker.getGeometry().setCoordinates(defaultCoords);

    const [defaultLon, defaultLat] = defaultCoordinates;
    document.getElementById("lat").value = defaultLat.toFixed(6);
    document.getElementById("lon").value = defaultLon.toFixed(6);
  });
};