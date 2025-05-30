import AboutPagePresenter from "../../presenter/AboutPagePresenter.js";

export default class AboutPage {
  constructor() {
    this.presenter = new AboutPagePresenter(this);
  }

  async render() {
    return `
      <section class="container about-page">
        <h1>About Us</h1>
        <p>
          Selamat datang di aplikasi <strong>Stories</strong>! Kami adalah platform 
          yang membantu pengguna dengan teknologi modern untuk mencapai kebutuhan 
          sehari-hari mereka dengan lebih mudah dan efisien.
        </p>
        <p>
          Dibangun menggunakan teknologi terkini seperti <strong>OpenLayers</strong>, 
          kami memastikan pengalaman terbaik bagi pengguna, terutama dalam integrasi 
          peta, data, dan fitur interaktif lainnya.
        </p>
        <p>
          Visi kami adalah memanfaatkan inovasi teknologi untuk membuat dunia lebih 
          terhubung dan nyaman. Terima kasih telah menggunakan aplikasi kami!
        </p>
        <p>Untuk pertanyaan lebih lanjut, silakan hubungi kami melalui halaman kontak.</p>
        <button id="contact-button">Hubungi Kami</button>
      </section>
    `;
  }

  async afterRender() {
    this.presenter.initializeContactButton();
    console.log("About Page Rendered");
  }
}
