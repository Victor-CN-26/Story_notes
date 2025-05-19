import { getAllStories } from "../data/api.js";

export default class HomePagePresenter {
  constructor(view) {
    this.view = view;
    this.stories = [];
  }

  async loadStories(page = 1, size = 5, location = 0) {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Anda belum login. Silakan login terlebih dahulu.");
      }

      const stories = await getAllStories(page, size, location, token);

      if (!stories || stories.length === 0) {
        this.view.displayMessage(
          '<p class="no-data-message">Tidak ada cerita yang tersedia.</p>'
        );
        return;
      }

      this.stories = stories;
      this.view.displayStories(stories);
    } catch (error) {
      console.error("Error loading stories:", error);
      this.view.displayMessage(`
        <div class="error-container">
          <p class="error-message">Gagal memuat cerita: ${error.message}</p>
          <button id="retryBtn" class="retry-button">Coba Lagi</button>
        </div>
      `);

      // Add retry button functionality
      setTimeout(() => {
        const retryBtn = document.getElementById("retryBtn");
        if (retryBtn) {
          retryBtn.addEventListener("click", () =>
            this.loadStories(page, size, location)
          );
        }
      }, 100);
    }
  }

  async loadMoreStories(page = 1, size = 5, location = 0) {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Anda belum login. Silakan login terlebih dahulu.");
      }

      const stories = await getAllStories(page, size, location, token);

      if (!stories || stories.length === 0) {
        const loadMoreBtn = document.getElementById("loadMoreBtn");
        if (loadMoreBtn) {
          loadMoreBtn.style.display = "none";
        }
        return;
      }

      this.stories = [...this.stories, ...stories];
      this.view.appendStories(stories);
    } catch (error) {
      console.error("Error loading more stories:", error);

      // Show error toast
      this._showErrorToast(`Gagal memuat cerita tambahan: ${error.message}`);
    }
  }

  _showErrorToast(message) {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = "error-toast";
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">⚠️</span>
        <span class="toast-message">${message}</span>
      </div>
      <button class="toast-close">×</button>
    `;

    // Add to body
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // Add close button functionality
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    });

    // Auto hide after 5 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 5000);
  }
}
