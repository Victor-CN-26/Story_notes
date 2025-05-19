// src/pages/auth/logout-page.js
export default class LogoutPage {
    async render() {
        localStorage.removeItem('authToken');
        window.location.hash = '/login'; // Redirect ke halaman login setelah logout
        return '<p>Logging out...</p>'; // Pesan sementara
    }

    async afterRender() {
        // Tidak ada tindakan lebih lanjut setelah render
    }
}