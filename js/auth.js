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
    
    renderRoleBasedUI(session.role);
}

/**
 * Sesuaikan menu sidebar berdasarkan Role
 */
function renderRoleBasedUI(role) {
    var sidebarMenu = document.querySelector('.sidebar-menu');
    if (!sidebarMenu) return;

    if (role === 'Rektor') {
        // Sembunyikan menu operator/admin
        var items = sidebarMenu.querySelectorAll('.sidebar-menu-item:not([data-page="dashboard.html"]):not(.btn-logout-menu)');
        items.forEach(function(el) { el.style.display = 'none'; });
        
        var labels = sidebarMenu.querySelectorAll('.sidebar-menu-label:not(:first-child)');
        labels.forEach(function(el) { el.style.display = 'none'; });

        // Tambahkan menu khusus Rektor jika belum ada
        if (!document.querySelector('[data-page="kotak-masuk.html"]')) {
            var rektorMenuHTML = `
                <p class="sidebar-menu-label" style="margin-top:20px;">Disposisi</p>
                <div class="sidebar-menu-item" data-page="kotak-masuk.html" onclick="window.location.href='kotak-masuk.html'">
                    <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.909A2.25 2.25 0 012.25 7v-.243m19.5 0V7" />
                    </svg>
                    <span class="menu-text">Kotak Masuk</span>
                </div>
                <div class="sidebar-menu-item" data-page="arsip.html" onclick="window.location.href='arsip.html'">
                    <svg class="menu-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                    <span class="menu-text">Arsip Rektor</span>
                </div>
            `;
            
            // Insert after dashboard
            var dashboardMenu = sidebarMenu.querySelector('[data-page="dashboard.html"]');
            if (dashboardMenu) {
                dashboardMenu.insertAdjacentHTML('afterend', rektorMenuHTML);
            }
        }
    } else if (role === 'Operator') {
        // Sembunyikan menu pengaturan dari operator
        var menuPengaturan = sidebarMenu.querySelector('[data-page="pengaturan.html"]');
        if (menuPengaturan) menuPengaturan.style.display = 'none';
        var labelPengaturan = sidebarMenu.querySelectorAll('.sidebar-menu-label')[2];
        if (labelPengaturan && labelPengaturan.textContent.includes('Sistem')) {
            labelPengaturan.style.display = 'none';
        }
    }
}

// ===================================================================================
// NOTIFIKASI
// ===================================================================================

async function checkNotifications() {
    var session = getSession();
    if (!session || session.role !== 'Rektor') return;

    // Cek jumlah pesan yang belum dibaca
    var result = await apiGetSuratMasuk({});
    if (result.success && result.data) {
        var unreadCount = result.data.filter(function(item) {
            return item["Diteruskan Ke"] === session.role && item["Status Baca"] === "Belum Dibaca";
        }).length;

        var bellBtns = document.querySelectorAll('.topbar-icon-btn[title="Notifikasi"]');
        bellBtns.forEach(function(btn) {
            // Hapus dot lama jika ada
            var oldDot = btn.querySelector('.notification-dot');
            if (oldDot) oldDot.remove();
            
            if (unreadCount > 0) {
                var dot = document.createElement('div');
                dot.className = 'notification-dot';
                dot.title = unreadCount + ' belum dibaca';
                btn.appendChild(dot);
                
                // Tambahkan event click untuk langsung ke kotak masuk
                btn.onclick = function() {
                    window.location.href = 'kotak-masuk.html';
                };
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", function() {
    setTimeout(checkNotifications, 1000);
});
