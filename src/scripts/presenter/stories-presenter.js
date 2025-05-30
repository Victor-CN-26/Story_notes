// src/presenter/stories-presenter.js

// Import instance storyApi
import { storyApi } from "../data/api.js";

export default class StoriesPresenter {
  #currentVideoStream = null; // Pindahkan variabel stream ke dalam kelas Presenter
  #capturedPhotoFile = null;  // Untuk menyimpan Blob/File dari foto yang diambil

  constructor(view, storyApiInstance = storyApi) { // Default to storyApi if not provided (for easier testing)
    this.view = view;
    this.storyApi = storyApiInstance;
    this.isCameraActive = false; // Status kamera
  }

  async handleSubmitStory(description, photoFile, lat, lon) {
    // Pastikan photoFile ada
    if (!photoFile) {
      this.view.displayError("Mohon pilih gambar atau ambil foto dari kamera.");
      return;
    }

    // Menggunakan 'authToken' sesuai kesepakatan
    const token = localStorage.getItem("authToken");
    if (!token) {
      this.view.displayError("Anda belum login. Silakan login terlebih dahulu.");
      // Mungkin juga redirect ke login page
      setTimeout(() => {
        window.location.hash = "/login";
      }, 1500);
      return;
    }

    try {
      this.view.showLoading(); // Minta View untuk menampilkan loading

      // API addStory Anda kemungkinan menerima FormData atau object langsung
      // Sesuaikan pemanggilan ini dengan yang diharapkan oleh storyApi.addStory
      const formData = new FormData();
      formData.append('description', description);
      formData.append('photo', photoFile); // photoFile adalah objek File/Blob
      if (lat) formData.append('lat', parseFloat(lat));
      if (lon) formData.append('lon', parseFloat(lon));

      // Panggil metode addStory dari storyApi, pastikan menerima FormData dan token
      const response = await this.storyApi.addStory(formData, token);

      console.log("Add story successful:", response);
      this.view.displaySuccess("Cerita berhasil ditambahkan!"); // Minta View untuk menampilkan sukses
      this.view.resetForm(); // Minta View untuk mereset form
      this.stopCameraStream(); // Hentikan kamera setelah submit
      this.#capturedPhotoFile = null; // Reset foto yang diambil

      setTimeout(() => {
        window.location.hash = "/"; // Redirect ke halaman utama
      }, 2000);
    } catch (error) {
      console.error("Error submitting story:", error);
      this.view.displayError(`Error: ${error.message}`); // Minta View untuk menampilkan error
    } finally {
      this.view.hideLoading(); // Minta View untuk menyembunyikan loading
    }
  }

  async startCamera() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.view.displayError("Kamera tidak didukung oleh browser Anda.");
        return;
      }

      const videoElement = this.view.getVideoElement();
      const takePhotoButtonElement = this.view.getPhotoButtonElement();
      const openCameraButtonElement = this.view.getOpenCameraButtonElement();
      const photoInput = this.view.getPhotoInput(); // Ambil referensi input file
      const photoPreviewElement = this.view.getPhotoPreviewElement();

      if (!videoElement || !takePhotoButtonElement || !openCameraButtonElement || !photoInput || !photoPreviewElement) {
        throw new Error("Elemen kamera tidak ditemukan di View.");
      }

      this.view.showLoading();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoElement.srcObject = stream;
      videoElement.style.display = "block";
      videoElement.play();

      takePhotoButtonElement.style.display = "inline-block";
      openCameraButtonElement.style.display = "none";
      photoInput.style.display = "none"; // Sembunyikan input file saat kamera aktif
      photoPreviewElement.style.display = "none"; // Sembunyikan preview saat kamera dibuka

      this.isCameraActive = true;
      this.#currentVideoStream = stream; // Simpan referensi stream di properti kelas

      this.view.displayMessage("Kamera terbuka. Tekan 'Take Photo' untuk mengambil gambar.", true);

    } catch (error) {
      console.error("Error accessing camera:", error);
      this.view.displayError(`Gagal mengakses kamera: ${error.message}`);
    } finally {
      this.view.hideLoading();
    }
  }

  // Metode baru untuk mengambil foto dari stream kamera
  capturePhotoFromStream() {
    const videoElement = this.view.getVideoElement();
    const photoPreviewElement = this.view.getPhotoPreviewElement();

    if (!videoElement || !photoPreviewElement || !this.#currentVideoStream) {
        this.view.displayError("Kamera tidak aktif atau elemen tidak ditemukan.");
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");
    this.view.setPhotoPreview(dataUrl); // Tampilkan preview di View

    // Ubah Data URL menjadi Blob/File
    const photoBlob = this.#dataURLtoBlob(dataUrl);
    const photoFile = new File([photoBlob], "captured-story-image.png", { type: "image/png" });
    this.#capturedPhotoFile = photoFile; // Simpan file yang diambil

    // Hentikan stream kamera dan sembunyikan elemen kamera
    this.stopCameraStream();
    this.view.displayMessage("Foto berhasil diambil dari kamera.", true);
  }

  stopCameraStream() {
    if (this.#currentVideoStream) {
      this.#currentVideoStream.getTracks().forEach((track) => {
        track.stop();
        console.log("Presenter - Track stopped:", track.kind);
      });
      this.#currentVideoStream = null;
    }

    // Minta View untuk menyembunyikan elemen kamera
    this.view.hideCameraElements();
    this.isCameraActive = false;
  }

  // Metode untuk mengembalikan foto yang diambil oleh kamera ke View/Form
  getCapturedPhoto() {
      return this.#capturedPhotoFile;
  }

  // Helper untuk mengubah data URL menjadi Blob (privat)
  #dataURLtoBlob(dataURL) {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }
}
