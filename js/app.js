// ===================================================================================
// APP.JS - Fungsi utilitas global yang dipakai semua halaman
// Sistem Surat Masuk dan Keluar - UBMG
// ===================================================================================

// ===================================================================================
// TOAST NOTIFIKASI
// ===================================================================================

/**
 * Tampilkan notifikasi toast di pojok kanan atas
 * @param {string} message - Pesan yang ditampilkan
 * @param {string} type - Tipe: 'success', 'error', 'info'
 * @param {number} duration - Durasi dalam ms (default 3500)
 */
function showToast(message, type, duration) {
    type     = type     || "info";
    duration = duration || 3500;

    var container = document.getElementById("toast-container");
    if (!container) {
        container    = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    var icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
        error:   '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>',
        info:    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>'
    };

    var toast       = document.createElement("div");
    toast.className = "toast toast-" + type;
    toast.innerHTML = (icons[type] || icons.info) + '<span>' + message + '</span>';

    container.appendChild(toast);

    setTimeout(function() {
        toast.classList.add("toast-closing");
        setTimeout(function() {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 260);
    }, duration);
}

// ===================================================================================
// LOADING SPINNER
// ===================================================================================

function showSpinner() {
    var el = document.getElementById("spinner-overlay");
    if (el) el.classList.remove("hidden");
}

function hideSpinner() {
    var el = document.getElementById("spinner-overlay");
    if (el) el.classList.add("hidden");
}

// ===================================================================================
// MODAL
// ===================================================================================

function openModal(modalId) {
    var el = document.getElementById(modalId);
    if (el) el.classList.remove("hidden");
}

function closeModal(modalId) {
    var el = document.getElementById(modalId);
    if (el) el.classList.add("hidden");
}

// Tutup modal ketika klik di luar area modal
document.addEventListener("click", function(e) {
    if (e.target.classList.contains("modal-overlay")) {
        e.target.classList.add("hidden");
    }
});

// ===================================================================================
// FORMAT TANGGAL
// ===================================================================================

/**
 * Format tanggal dari format "yyyy-MM-dd" ke "DD Bulan YYYY"
 * @param {string} dateString - String tanggal format ISO
 * @returns {string}
 */
function formatTanggal(dateString) {
    if (!dateString) return "-";

    var bulan = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];

    var parts = dateString.toString().split("-");
    if (parts.length < 3) return dateString;

    var tahun  = parts[0];
    var bulanIndex = parseInt(parts[1], 10) - 1;
    var hari   = parseInt(parts[2], 10);

    if (isNaN(bulanIndex) || bulanIndex < 0 || bulanIndex > 11) return dateString;

    return hari + " " + bulan[bulanIndex] + " " + tahun;
}

/**
 * Format tanggal ke format input HTML date (yyyy-MM-dd)
 */
function toInputDate(dateString) {
    if (!dateString) return "";
    return dateString.toString().split("T")[0].substring(0, 10);
}

// ===================================================================================
// BADGE STATUS
// ===================================================================================

/**
 * Buat HTML badge berdasarkan nilai status
 * @param {string} status
 * @returns {string} HTML string
 */
function getBadgeHtml(status) {
    var map = {
        "Pending":  "badge-pending",
        "Proses":   "badge-proses",
        "Selesai":  "badge-selesai",
        "Draft":    "badge-draft",
        "Terkirim": "badge-terkirim",
        "Aktif":    "badge-aktif",
        "Nonaktif": "badge-nonaktif"
    };

    var cls = map[status] || "badge-draft";
    return '<span class="badge ' + cls + '">' + (status || "-") + '</span>';
}

// ===================================================================================
// SIDEBAR - TOGGLE DAN NAVIGASI AKTIF
// ===================================================================================

function initSidebar() {
    // Toggle sidebar di mobile
    var btnToggle = document.getElementById("btn-toggle-sidebar");
    var sidebar   = document.getElementById("sidebar");

    if (btnToggle && sidebar) {
        // Buat overlay untuk mobile
        var overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        document.body.appendChild(overlay);

        btnToggle.addEventListener("click", function() {
            sidebar.classList.toggle("sidebar-open");
            overlay.classList.toggle("show");
        });

        // Tutup sidebar jika overlay diklik
        overlay.addEventListener("click", function() {
            sidebar.classList.remove("sidebar-open");
            overlay.classList.remove("show");
        });
    }

    // Tandai menu aktif berdasarkan halaman saat ini
    var currentPage = window.location.pathname.split("/").pop() || "index.html";
    var menuItems   = document.querySelectorAll(".sidebar-menu-item[data-page]");

    menuItems.forEach(function(item) {
        if (item.getAttribute("data-page") === currentPage) {
            item.classList.add("active");
        }
    });

    // Navigasi ketika menu di klik
    menuItems.forEach(function(item) {
        item.addEventListener("click", function() {
            var page = item.getAttribute("data-page");
            if (page) {
                window.location.href = page;
            }
        });
    });

    // Tombol logout
    var btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", function() {
            clearSession();
            window.location.href = "index.html";
        });
    }
}

// ===================================================================================
// PENCARIAN TABEL (CLIENT-SIDE)
// ===================================================================================

/**
 * Filter baris tabel berdasarkan kata kunci
 * @param {string} keyword - Kata kunci pencarian
 * @param {string} tbodyId - ID dari elemen tbody
 */
function filterTable(keyword, tbodyId) {
    keyword = keyword.toLowerCase().trim();
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    var rows = tbody.querySelectorAll("tr");
    rows.forEach(function(row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(keyword) ? "" : "none";
    });
}

// ===================================================================================
// PAGINATION CLIENT-SIDE
// ===================================================================================

var paginationState = {
    currentPage:  1,
    itemsPerPage: 10,
    totalItems:   0,
    renderCallback: null
};

function initPagination(totalItems, itemsPerPage, renderCallback) {
    paginationState.currentPage    = 1;
    paginationState.totalItems     = totalItems;
    paginationState.itemsPerPage   = itemsPerPage || 10;
    paginationState.renderCallback = renderCallback;
    renderPagination();
}

function renderPagination() {
    var state        = paginationState;
    var totalPages   = Math.ceil(state.totalItems / state.itemsPerPage);
    var startIndex   = (state.currentPage - 1) * state.itemsPerPage;
    var endIndex     = Math.min(startIndex + state.itemsPerPage, state.totalItems);

    var elInfo = document.getElementById("pagination-info");
    if (elInfo) {
        elInfo.textContent = "Menampilkan " + (state.totalItems === 0 ? 0 : startIndex + 1) + " - " + endIndex + " dari " + state.totalItems + " data";
    }

    var elPagination = document.getElementById("pagination");
    if (!elPagination) return;

    elPagination.innerHTML = "";

    // Tombol sebelumnya
    var btnPrev = document.createElement("button");
    btnPrev.className = "page-btn";
    btnPrev.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>';
    btnPrev.disabled = state.currentPage === 1;
    btnPrev.addEventListener("click", function() {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderPagination();
            if (state.renderCallback) state.renderCallback(startIndex - state.itemsPerPage, startIndex);
        }
    });
    elPagination.appendChild(btnPrev);

    // Nomor halaman
    for (var i = 1; i <= totalPages; i++) {
        (function(pageNum) {
            var btn = document.createElement("button");
            btn.className = "page-btn" + (pageNum === state.currentPage ? " active" : "");
            btn.textContent = pageNum;
            btn.addEventListener("click", function() {
                state.currentPage = pageNum;
                renderPagination();
                var start = (pageNum - 1) * state.itemsPerPage;
                var end   = Math.min(start + state.itemsPerPage, state.totalItems);
                if (state.renderCallback) state.renderCallback(start, end);
            });
            elPagination.appendChild(btn);
        })(i);
    }

    // Tombol selanjutnya
    var btnNext = document.createElement("button");
    btnNext.className = "page-btn";
    btnNext.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>';
    btnNext.disabled = state.currentPage === totalPages || totalPages === 0;
    btnNext.addEventListener("click", function() {
        if (state.currentPage < totalPages) {
            state.currentPage++;
            var start = (state.currentPage - 1) * state.itemsPerPage;
            var end   = Math.min(start + state.itemsPerPage, state.totalItems);
            renderPagination();
            if (state.renderCallback) state.renderCallback(start, end);
        }
    });
    elPagination.appendChild(btnNext);

    // Panggil callback untuk render halaman pertama
    if (state.renderCallback && totalPages > 0) {
        state.renderCallback(startIndex, endIndex);
    }
}

// ===================================================================================
// VALIDASI FORM
// ===================================================================================

/**
 * Validasi form - cek semua field yang wajib diisi
 * @param {HTMLFormElement} form - Elemen form yang akan divalidasi
 * @returns {boolean}
 */
function validateForm(form) {
    var isValid = true;
    var requiredFields = form.querySelectorAll("[required]");

    requiredFields.forEach(function(field) {
        var errorEl = document.getElementById(field.id + "-error");

        if (!field.value.trim()) {
            field.classList.add("is-invalid");
            if (errorEl) errorEl.classList.remove("hidden");
            isValid = false;
        } else {
            field.classList.remove("is-invalid");
            if (errorEl) errorEl.classList.add("hidden");
        }
    });

    return isValid;
}

/**
 * Reset semua class error di form
 */
function resetFormValidation(form) {
    var fields = form.querySelectorAll(".is-invalid");
    fields.forEach(function(f) { f.classList.remove("is-invalid"); });
    var errors = form.querySelectorAll(".invalid-feedback");
    errors.forEach(function(e) { e.classList.add("hidden"); });
}
