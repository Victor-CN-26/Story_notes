import HomePagePresenter from "../../presenter/HomePagePresenter.js";
import { storyApi } from "../../data/api.js"; // Import instance storyApi

export default class HomePage {
  constructor() {
    // Inisialisasi presenter dengan menginjeksikan instance storyApi
    this.presenter = new HomePagePresenter(this, storyApi);
    this.currentPage = 1;
    this.storiesPerPage = 5;
    this.showLocationOnly = false;
    this.isLoading = false;
    this.mapInstances = {}; // Untuk menyimpan instance peta
  }

  async render() {
    return `
      <section id="mainContent" class="container">
        <div class="page-header">
          <h1>Cerita Terbaru</h1>
          <div class="filter-controls">
            <div class="toggle-container">
              <input type="checkbox" id="locationToggle" class="toggle-input">
              <label for="locationToggle" class="toggle-label">
                <span class="toggle-text">Tampilkan cerita dengan lokasi saja</span>
              </label>
            </div>
            <select id="sortOption" class="sort-select">
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>

        <div id="storiesContainer" class="stories-grid">
          <div class="loading-indicator">
            <div class="spinner"></div>
            <p>Memuat cerita...</p>
          </div>
        </div>

        <div class="pagination-controls">
          <button id="loadMoreBtn" class="load-more-btn">Muat Lebih Banyak</button>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this._initializeEventListeners();
    await this._loadInitialStories();
  }

  _initializeEventListeners() {
    // Location filter toggle
    const locationToggle = document.getElementById("locationToggle");
    locationToggle.addEventListener("change", async (e) => {
      this.showLocationOnly = e.target.checked;
      this.currentPage = 1;
      await this._refreshStories();
    });

    // Sort option change
    const sortOption = document.getElementById("sortOption");
    sortOption.addEventListener("change", async () => {
      this.currentPage = 1;
      await this._refreshStories();
    });

    // Load more button
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    loadMoreBtn.addEventListener("click", async () => {
      if (!this.isLoading) {
        this.currentPage++;
        await this.presenter.loadMoreStories(
          this.currentPage,
          this.storiesPerPage,
          this.showLocationOnly ? 1 : 0
        );
      }
    });
  }

  async _loadInitialStories() {
    try {
      this._showLoading();
      await this.presenter.loadStories(
        this.currentPage,
        this.storiesPerPage,
        this.showLocationOnly ? 1 : 0
      );
    } catch (error) {
      this.displayMessage(
        `<p class="error-message">Gagal memuat cerita: ${error.message}</p>`
      );
    } finally {
      this._hideLoading();
    }
  }

  async _refreshStories() {
    try {
      this._showLoading();
      await this.presenter.loadStories(
        this.currentPage,
        this.storiesPerPage,
        this.showLocationOnly ? 1 : 0
      );
    } catch (error) {
      this.displayMessage(
        `<p class="error-message">Gagal memuat cerita: ${error.message}</p>`
      );
    } finally {
      this._hideLoading();
    }
  }

  _showLoading() {
    this.isLoading = true;
    const storiesContainer = document.getElementById("storiesContainer");
    if (!document.querySelector(".loading-indicator")) {
      storiesContainer.innerHTML = `
        <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Memuat cerita...</p>
        </div>
      `;
    }
  }

  _hideLoading() {
    this.isLoading = false;
    const loadingIndicator = document.querySelector(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }

  displayMessage(message) {
    const storiesContainer = document.getElementById("storiesContainer");
    storiesContainer.innerHTML = message;
  }

  displayStories(stories) {
    const storiesContainer = document.getElementById("storiesContainer");

    // Clear existing loading indicator if present
    const loadingIndicator = document.querySelector(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.remove();
    }

    if (this.currentPage === 1) {
      storiesContainer.innerHTML = "";
    }

    if (stories.length === 0) {
      if (this.currentPage === 1) {
        storiesContainer.innerHTML = `<p class="no-stories">Tidak ada cerita yang tersedia.</p>`;
      }
      document.getElementById("loadMoreBtn").style.display = "none";
      return;
    }

    // Sort stories if needed
    const sortOption = document.getElementById("sortOption").value;
    if (sortOption === "oldest") {
      stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Append new stories to container
    stories.forEach((story, index) => {
      const storyElement = document.createElement("div");
      storyElement.className = "story-card";
      storyElement.innerHTML = this.createStoryHTML(
        story,
        `${this.currentPage}-${index}`
      );
      storiesContainer.appendChild(storyElement);

      // Initialize map if location is available
      if (story.lat && story.lon) {
        this.initializeMap(
          `${this.currentPage}-${index}`,
          story.lat,
          story.lon,
          story.name,
          story.description
        );
      }
    });

    // Show the load more button
    document.getElementById("loadMoreBtn").style.display = "block";
  }

  appendStories(stories) {
    if (stories.length === 0) {
      document.getElementById("loadMoreBtn").style.display = "none";
      return;
    }

    // Sort stories if needed
    const sortOption = document.getElementById("sortOption").value;
    if (sortOption === "oldest") {
      stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      stories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const storiesContainer = document.getElementById("storiesContainer");

    // Append new stories to container
    stories.forEach((story, index) => {
      const storyElement = document.createElement("div");
      storyElement.className = "story-card";
      storyElement.innerHTML = this.createStoryHTML(
        story,
        `${this.currentPage}-${index}`
      );
      storiesContainer.appendChild(storyElement);

      // Initialize map if location is available
      if (story.lat && story.lon) {
        this.initializeMap(
          `${this.currentPage}-${index}`,
          story.lat,
          story.lon,
          story.name,
          story.description
        );
      }
    });
  }

  createStoryHTML(story, index) {
    const hasLocation = story.lat && story.lon;
    const formattedDate = new Date(story.createdAt).toLocaleDateString(
      "id-ID",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    return `
      <div class="story-header">
        <div class="author-info">
          <div class="author-initial">${story.name
            .charAt(0)
            .toUpperCase()}</div>
          <h3 class="author-name">${story.name}</h3>
        </div>
        <small class="timestamp">${formattedDate}</small>
      </div>

      <div class="story-media">
        <img id="story-image-${index}" src="${
          story.photoUrl
        }" alt="Cerita dari ${story.name}"
             class="story-image" loading="lazy" onerror="this.onerror=null;this.src='./images/image-placeholder.png';" />
      </div>

      <div class="story-content">
        <p class="story-description">${story.description}</p>

        ${
          hasLocation
            ? `
          <div class="location-info">
            <span class="location-icon">📍</span>
            <span class="coordinates">Lokasi ditandai</span>
          </div>
          <div id="map-${index}" class="story-map"></div>
        `
            : ""
        }
      </div>
      `;
  }

  initializeMap(index, lat, lon, name, description) {
    try {
      const mapId = `map-${index}`;
      const mapElement = document.getElementById(mapId);
      if (!mapElement || this.mapInstances[mapId]) {
        return;
      }

      const map = L.map(mapId).setView([lat, lon], 13);
      this.mapInstances[mapId] = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<b>${name}</b><br>${description}`);

      setTimeout(() => {
        map.invalidateSize();
      }, 300);
    } catch (error) {
      console.error(`Failed to initialize map for story ${index}:`, error);
      const mapElement = document.getElementById(`map-${index}`);
      if (mapElement) {
        mapElement.innerHTML = '<p class="map-error">Gagal memuat peta</p>';
      }
    }
  }

  disconnectedCallback() {
    for (const mapId in this.mapInstances) {
      if (this.mapInstances.hasOwnProperty(mapId) && this.mapInstances[mapId]) {
        this.mapInstances[mapId].remove();
      }
    }
    this.mapInstances = {};
  }
}

customElements.define("home-page", HomePage);