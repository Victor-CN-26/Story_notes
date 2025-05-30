// src/routes/url-parser.js

// Fungsi-fungsi pembantu internal (tidak diekspor langsung)
function extractPathnameSegments(path) {
  const splitUrl = path.split('/');
  return {
    resource: splitUrl[1] || null,
    id: splitUrl[2] || null,
  };
}

function constructRouteFromSegments(pathSegments) {
  let pathname = '';
  if (pathSegments.resource) {
    pathname = pathname.concat(`/${pathSegments.resource}`);
  }
  if (pathSegments.id) {
    pathname = pathname.concat('/:id');
  }
  return pathname || '/';
}

// Objek UrlParser yang berisi semua fungsionalitas
const UrlParser = {
  parseActiveUrlWithCombiner: () => { // Ini yang Anda panggil di app.js
    const pathname = UrlParser.getActivePathname(); // Perlu panggil dari objek UrlParser
    const urlSegments = extractPathnameSegments(pathname);
    return constructRouteFromSegments(urlSegments);
  },
  getActivePathname: () => location.hash.replace('#', '') || '/',
  getActiveRoute: () => {
    const pathname = UrlParser.getActivePathname(); // Panggil dari objek
    const urlSegments = extractPathnameSegments(pathname);
    return constructRouteFromSegments(urlSegments);
  },
  parseActivePathname: () => {
    const pathname = UrlParser.getActivePathname(); // Panggil dari objek
    return extractPathnameSegments(pathname);
  },
  getRoute: (pathname) => {
    const urlSegments = extractPathnameSegments(pathname);
    return constructRouteFromSegments(urlSegments);
  },
  parsePathname: (pathname) => extractPathnameSegments(pathname),
};

export default UrlParser; // <--- TAMBAHKAN BARIS INI