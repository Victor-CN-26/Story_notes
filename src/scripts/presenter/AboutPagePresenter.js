export default class AboutPagePresenter {
  constructor(view) {
    this.view = view;
  }

  initializeContactButton() {
    const button = document.getElementById("contact-button");
    button.addEventListener("click", () => {
      const whatsappNumber = "6281234567890";
      const message = "Halo, saya ingin bertanya tentang aplikasi Stories.";
      const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        message
      )}`;

      window.open(whatsappURL, "_blank");
    });
  }
}
