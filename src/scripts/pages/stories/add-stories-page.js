// src/pages/stories/add-stories-page.js
import "ol/ol.css";

// Import kelas StoriesPresenter dan storyApi
import StoriesPresenter from "../../presenter/stories-presenter.js";
import { storyApi } from "../../data/api.js"; // Pastikan path ini benar!

// Import semua yang dibutuhkan untuk OpenLayers langsung di View
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
import { fromLonLat, toLonLat } from "ol/proj"; // toLonLat juga diperlukan untuk map click

export default class AddStoryPage {
  constructor() {
    // Inisialisasi presenter dan injeksikan instance storyApi
    this.presenter = new StoriesPresenter(this, storyApi);
    this.map = null;
    this.marker = null;
    this.defaultCoordinates = [106.816666, -6.2]; // Jakarta, Indonesia
  }

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
            <input type="file" id="photo" name="photo" accept="image/*" style="display:none; position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;" />
            <button type="button" id="openCameraButton">Open Camera</button>
            <button type="button" id="takePhotoButton" style="display:none;">Take Photo</button>
            <br />
            <video id="cameraStream" autoplay playsinline style="display:none; width: 100%; height: auto; margin-top: 10px; border: 1px solid #ddd; border-radius: 4px;"></video>
            <img id="photoPreview" src="" alt="Preview" style="max-width: 100%; display:none;" />
          </div>
          <div>
            <label for="lat">Latitude (optional):</label>
            <input type="number" id="lat" name="lat" step="any" readonly />
          </div>
          <div>
            <label for="lon">Longitude (optional):</label>
            <input type="number" id="lon" name="lon" step="any" readonly />
          </div>
          <div id="map" style="width: 100%; height: 400px; margin-top: 20px;"></div>
          <button type="button" id="resetMarker" style="margin-top: 10px;">Reset Lokasi</button>
          <button type="submit">Submit</button>
        </form>
        <div id="responseMessage" class="popup-message hidden"></div>
        <div id="loadingIndicator" class="loading-spinner hidden"></div>
      </section>
    `;
  }

  async afterRender() {
    const form = document.getElementById("addStoryForm");
    const openCameraButton = document.getElementById("openCameraButton");
    const takePhotoButton = document.getElementById("takePhotoButton");
    const descriptionInput = document.getElementById("description");
    const photoInput = document.getElementById("photo"); // Tetap ambil referensi input file
    const latInput = document.getElementById("lat");
    const lonInput = document.getElementById("lon");
    const resetMarkerButton = document.getElementById("resetMarker");

    // Inisialisasi peta
    this._initializeMap();
    this._getCurrentLocationAndSetMap(); // Set lokasi awal ke lokasi pengguna

    // Event listener untuk tombol "Open Camera"
    if (openCameraButton) {
      openCameraButton.addEventListener("click", () => {
        this.presenter.startCamera(); // Panggil startCamera dari presenter
      });
    }

    // Event listener untuk tombol "Take Photo"
    if (takePhotoButton) {
        takePhotoButton.addEventListener('click', () => {
            this.presenter.capturePhotoFromStream(); // Panggil metode capture dari presenter
        });
    }

    // Event listener untuk reset marker
    if (resetMarkerButton) {
      resetMarkerButton.addEventListener("click", () => {
        this._resetMapMarker();
      });
    }

    // Event listener untuk submit form
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const description = descriptionInput.value;
        const lat = latInput.value;
        const lon = lonInput.value;

        // Ambil file foto, utamakan dari kamera (jika ada di presenter), lalu dari input file
        const photoFile = this.presenter.getCapturedPhoto() || photoInput.files[0];

        this.presenter.handleSubmitStory(description, photoFile, lat, lon); // Delegasikan ke presenter
      });
    }
  }

  // --- Metode yang diimplementasikan oleh View (dipanggil oleh Presenter) ---
  getVideoElement() { return document.getElementById("cameraStream"); }
  getPhotoButtonElement() { return document.getElementById("takePhotoButton"); }
  getOpenCameraButtonElement() { return document.getElementById("openCameraButton"); }
  getPhotoInput() { return document.getElementById("photo"); }
  getPhotoPreviewElement() { return document.getElementById("photoPreview"); }

  setPhotoPreview(dataUrl) {
    const photoPreview = this.getPhotoPreviewElement();
    if (photoPreview) {
      photoPreview.src = dataUrl;
      photoPreview.style.display = "block"; // Pastikan pratinjau ditampilkan
    }
  }

  // Metode setPhotoInputFile Dihapus karena tidak lagi diperlukan dan menyebabkan masalah.

  // === PERBAIKAN DI SINI ===
  // hideCameraElements sekarang hanya menyembunyikan elemen kamera dan tombolnya.
  // photoPreview tidak lagi disembunyikan di sini.
  hideCameraElements() {
    const video = this.getVideoElement();
    const takePhotoButton = this.getPhotoButtonElement();
    const openCameraButton = this.getOpenCameraButtonElement();
    const photoInput = this.getPhotoInput(); // Ambil referensi input file

    if (video) { video.style.display = "none"; video.srcObject = null; }
    if (takePhotoButton) { takePhotoButton.style.display = "none"; }
    if (openCameraButton) { openCameraButton.style.display = "inline-block"; }
    // Tampilkan input file standar kembali jika kamera tidak aktif, untuk opsi upload manual
    if (photoInput) { photoInput.style.display = "block"; }
    // photoPreview tidak lagi di-handle di sini
  }

  displayMessage(message, isSuccess = true) {
    const messageContainer = document.getElementById("responseMessage");
    if (messageContainer) {
      messageContainer.textContent = message;
      messageContainer.className = `popup-message ${isSuccess ? "success" : "error"}`;
      messageContainer.classList.remove("hidden");

      setTimeout(() => {
        messageContainer.classList.add("hidden");
        messageContainer.className = "popup-message hidden";
      }, 3000);
    }
  }

  displayError(message) {
    this.displayMessage(message, false);
  }

  displaySuccess(message) {
    this.displayMessage(message, true);
  }

  // === PERBAIKAN DI SINI ===
  // resetForm sekarang secara eksplisit menyembunyikan photoPreview.
  resetForm() {
    const form = document.getElementById("addStoryForm");
    if (form) form.reset();

    this.hideCameraElements(); // Ini akan menyembunyikan video, tombol kamera, dan menampilkan input file
    
    // Sembunyikan photoPreview secara eksplisit saat form direset
    const photoPreview = this.getPhotoPreviewElement();
    if (photoPreview) {
        photoPreview.style.display = "none";
        photoPreview.src = ""; // Kosongkan src juga
    }

    document.getElementById("lat").value = "";
    document.getElementById("lon").value = "";
    this._resetMapMarker();
  }

  showLoading() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
  }

  hideLoading() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) loadingIndicator.classList.add("hidden");
  }

  setLatLon(lat, lon) {
    const latInput = document.getElementById("lat");
    const lonInput = document.getElementById("lon");
    if (latInput) latInput.value = lat;
    if (lonInput) lonInput.value = lon;
  }

  // --- Metode Internal View untuk Peta OpenLayers ---
  _initializeMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) {
        console.error("Map element not found!");
        return;
    }

    if (this.map) {
      this.destroyMap();
    }

    this.map = new Map({
      target: mapElement,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat(this.defaultCoordinates),
        zoom: 12,
      }),
    });

    this.marker = new Feature({
      geometry: new Point(fromLonLat(this.defaultCoordinates)),
    });

    this.marker.setStyle(
      new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: "https://openlayers.org/en/latest/examples/data/icon.png",
        }),
      })
    );

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [this.marker],
      }),
    });

    this.map.addLayer(vectorLayer);

    this.map.on("click", (event) => {
      const coordinates = event.coordinate;
      const [lon, lat] = toLonLat(coordinates);

      this.marker.getGeometry().setCoordinates(coordinates);
      this.setLatLon(lat.toFixed(6), lon.toFixed(6));
    });

    setTimeout(() => {
      if (this.map) {
        this.map.updateSize();
      }
    }, 0);
  }

  _getCurrentLocationAndSetMap() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const userCoordinates = [lon, lat];

          const olUserCoordinates = fromLonLat(userCoordinates);
          this.map.getView().setCenter(olUserCoordinates);
          this.marker.getGeometry().setCoordinates(olUserCoordinates);
          this.setLatLon(lat.toFixed(6), lon.toFixed(6));
        },
        (error) => {
          console.error("Error getting user location:", error);
          this.displayError("Gagal mendapatkan lokasi Anda. Menggunakan lokasi default.");
          this._resetMapMarker();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      this.displayError("Geolocation tidak didukung oleh browser ini.");
      this._resetMapMarker();
    }
  }

  _resetMapMarker() {
    const defaultCoordsOl = fromLonLat(this.defaultCoordinates);
    this.marker.getGeometry().setCoordinates(defaultCoordsOl);
    this.map.getView().setCenter(defaultCoordsOl);
    this.setLatLon(this.defaultCoordinates[1].toFixed(6), this.defaultCoordinates[0].toFixed(6));
  }

  destroyMap() {
    if (this.map) {
      this.map.setTarget(undefined);
      this.map = null;
      this.marker = null;
    }
  }

  async beforeUnmount() {
    console.log("beforeUnmount dipanggil");
    this.presenter.stopCameraStream();
    this.destroyMap();
    console.log("beforeUnmount: Camera and Map stopped.");
  }
}
