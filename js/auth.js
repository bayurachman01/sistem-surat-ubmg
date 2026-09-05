// ===================================================================================
// AUTH.JS - Manajemen sesi dan autentikasi
// Sistem Surat Masuk dan Keluar - UBMG
// ===================================================================================

var SESSION_KEY = "ubmg_user_session";

/**
 * Simpan data sesi pengguna ke localStorage
 */
function saveSession(userData) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
}

/**
 * Ambil data sesi pengguna dari localStorage
 * @returns {object|null}
 */
function getSession() {
    var raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

/**
 * Hapus sesi (logout)
 */
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

/**
 * Cek apakah pengguna sudah login
 * @returns {boolean}
 */
function isLoggedIn() {
    return getSession() !== null;
}

/**
 * Proteksi halaman - redirect ke login jika belum login
 * Panggil fungsi ini di awal setiap halaman selain index.html
 */
function requireAuth() {
    if (!isLoggedIn()) {
        window.location.href = "index.html";
    }
}

/**
 * Proteksi halaman login - redirect ke dashboard jika sudah login
 * Panggil fungsi ini di halaman index.html
 */
function requireGuest() {
    if (isLoggedIn()) {
        window.location.href = "dashboard.html";
    }
}

/**
 * Ambil inisial dari nama lengkap untuk avatar
 * @param {string} namaLengkap
 * @returns {string}
 */
function getInitials(namaLengkap) {
    if (!namaLengkap) return "U";
    var parts = namaLengkap.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Cek apakah pengguna adalah Admin
 * @returns {boolean}
 */
function isAdmin() {
    var session = getSession();
    return session && session.role === "Admin";
}

/**
 * Isi informasi pengguna ke elemen UI di sidebar dan topbar
 */
function populateUserInfo() {
    var session = getSession();
    if (!session) return;

    var initials = getInitials(session.namaLengkap);

    // Sidebar user info
    var elSidebarAvatar = document.getElementById("sidebar-user-avatar");
    var elSidebarName   = document.getElementById("sidebar-user-name");
    var elSidebarRole   = document.getElementById("sidebar-user-role");

    if (elSidebarAvatar) elSidebarAvatar.textContent = initials;
    if (elSidebarName)   elSidebarName.textContent   = session.namaLengkap;
    if (elSidebarRole)   elSidebarRole.textContent   = session.role;

    // Topbar user info
    var elTopbarAvatar = document.getElementById("topbar-user-avatar");
    var elTopbarName   = document.getElementById("topbar-user-name");

    if (elTopbarAvatar) elTopbarAvatar.textContent = initials;
    if (elTopbarName)   elTopbarName.textContent   = session.namaLengkap;
}
