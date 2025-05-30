class NotFoundPage {
  render() {
    return Promise.resolve(`
        <div style="text-align: center; padding: 50px;">
          <h1>404 - Halaman Tidak Ditemukan</h1>
          <p>Maaf, halaman yang kamu cari nggak ada.</p>
          <a href="#/" style="color: #007bff; text-decoration: none; font-weight: bold;">Balik ke Home</a>
        </div>
      `);
  }

  afterRender() {}
}

export default NotFoundPage;
