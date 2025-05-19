// src/pages/stories/add-stories-page.js
import "ol/ol.css";
import { openCamera, handleFormSubmission, initializeMap } from "../../presenter/stories-presenter.js";
import { subscribePushNotification } from "../../helper/jwt";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Icon from "ol/style/Icon";
import Style from "ol/style/Style";
import { fromLonLat } from "ol/proj";

export default class AddStoryPage {
  videoStream = null; // Inisialisasi di sini

  async render() {
    return `
      <section class="container">
        <h1>Add New Story</h1>
        <form id="addStoryForm" enctype="multipart/form-data">
          <div>
            <label for="description">Description:</label>
            <textarea id="description" name="description" required></textarea>
          </div>
          <div>
            <label for="photo">Photo:</label>
            <input type="file" id="photo" name="photo" accept="image/*" style="display:none" />
            <button type="button" id="openCameraButton">Open Camera</button>
            <button type="button" id="takePhotoButton" style="display:none;">Take Photo</button>
            <br />
            <video id="cameraStream" autoplay style="display:none; width: 100%; height: auto; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;"></video>
            <canvas id="photoCanvas" style="display:none; width: 100%; height: auto; margin-top: 10px;"></canvas>
            <img id="photoPreview" src="" alt="Preview" style="max-width: 100%; display:none;" />
            </div>
          <div>
            <label for="lat">Latitude (optional):</label>
            <input type="number" id="lat" name="lat" step="any" />
          </div>
          <div>
            <label for="lon">Longitude (optional):</label>
            <input type="number" id="lon" name="lon" step="any" />
          </div>
          <button type="submit">Submit</button>
        </form>
        <div id="map" style="width: 100%; height: 400px; margin-top: 20px;"></div>
        <div id="responseMessage"></div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("addStoryForm");
    const openCameraButton = document.getElementById("openCameraButton");
    const takePhotoButton = document.getElementById("takePhotoButton");
    const cameraStreamElement = document.getElementById("cameraStream");

    if (openCameraButton && cameraStreamElement && takePhotoButton) {
      openCameraButton.addEventListener("click", async () => {
        try {
          this.videoStream = await openCamera(cameraStreamElement, takePhotoButton);
        } catch (error) {
          console.error("Error opening camera:", error);
        }
      });
    }

    if (!document.getElementById("popupMessage")) {
      const popup = document.createElement("div");
      popup.id = "popupMessage";
      popup.className = "popup";
      document.body.appendChild(popup);
    }

    const showPopup = (message, isSuccess = true) => {
      const popup = document.getElementById("popupMessage");
      popup.textContent = message;
      popup.className = `show ${isSuccess ? "success" : "error"}`;
      setTimeout(() => {
        popup.className = "";
      }, 3000);
    };

    form.addEventListener("submit", (event) =>
      handleFormSubmission(event, showPopup)
    );

    const defaultCoordinates = [106.816666, -6.2];
    const map = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat(defaultCoordinates),
        zoom: 12,
      }),
    });

    const marker = new Feature({
      geometry: new Point(fromLonLat(defaultCoordinates)),
    });

    marker.setStyle(
      new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: "https://openlayers.org/en/latest/examples/data/icon.png",
        }),
      })
    );

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [marker],
      }),
    });

    map.addLayer(vectorLayer);

    const resetButton = document.createElement("button");
    resetButton.id = "resetMarker";
    resetButton.textContent = "Reset Marker";
    resetButton.style.marginTop = "10px";
    document.getElementById("map").appendChild(resetButton);

    initializeMap(map, marker, defaultCoordinates);

    const handleAddStorySuccess = async () => {
      const token = localStorage.getItem("authToken");
      await subscribePushNotification(token);
    };

    const addStoryToApi = async (storyData) => {
      try {
        const response = await fetch("/stories", { // Ganti dengan URL API sebenarnya
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(storyData),
        });

        const result = await response.json();
        if (!result.error) {
          console.log("Story berhasil dibuat:", result);
          await handleAddStorySuccess();
        } else {
          console.error("Gagal menambahkan story:", result.message);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };
  }

  async beforeUnmount() {
    console.log("beforeUnmount dipanggil");
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => {
        track.stop();
        console.log("Track stopped:", track.kind);
      });
      this.videoStream = null;
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
      console.log("beforeUnmount: Camera stopped.");
    }
  }
}