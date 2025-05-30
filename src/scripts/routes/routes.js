import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import LoginPage from "../pages/auth/login";
import RegisterPage from "../pages/auth/register";
import AddStoryPage from "../pages/stories/add-stories-page";
import NotFoundPage from "../pages/not-found-page";
import LogoutPage from "../pages/auth/logout-page"; // Import LogoutPage

const routes = {
    "/": HomePage,
    "/about": AboutPage,
    "/login": LoginPage,
    "/register": RegisterPage,
    "/add-story": AddStoryPage,
    "/logout": LogoutPage, // Tambahkan rute untuk logout
};

let currentPageInstance = null;

const changePage = async (PageClass) => {
    if (currentPageInstance && currentPageInstance.beforeUnmount) {
        console.log("Memanggil beforeUnmount pada halaman sebelumnya");
        await currentPageInstance.beforeUnmount();
    }

    if (!PageClass || typeof PageClass !== "function") {
        console.error("PageClass is invalid!");
        return;
    }

    const pageInstance = new PageClass();
    currentPageInstance = pageInstance;

    const mainContent = document.getElementById("main-content");

    if (!pageInstance.render || typeof pageInstance.render !== "function") {
        console.error("pageInstance.render is not a function!");
        return;
    }

    if (typeof document.startViewTransition === "function") {
        await document.startViewTransition(async () => {
            const newContent = await pageInstance.render();
            mainContent.innerHTML = newContent;

            if (pageInstance.afterRender) {
                await pageInstance.afterRender();
            }
        });
    } else {
        mainContent.innerHTML = await pageInstance.render();
        if (pageInstance.afterRender) {
            await pageInstance.afterRender();
        }
    }
};

const router = async () => {
    const hash = window.location.hash.replace("#", "") || "/";
    const PageClass = routes[hash] || NotFoundPage;
    await changePage(PageClass);

    // Logika skip to content dipindahkan ke sini
    const skipLink = document.querySelector('.skip-to-content');
    const mainContent = document.getElementById('main-content');

    if (skipLink && mainContent) {
        skipLink.addEventListener('click', (event) => {
            event.preventDefault();
            mainContent.scrollIntoView({ behavior: 'smooth' });
            skipLink.blur(); // Opsional: Hapus fokus dari tautan skip setelah diklik
        });
    }
};

window.addEventListener("hashchange", router);
window.addEventListener("load", router);

export default router;