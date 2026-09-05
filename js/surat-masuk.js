// ===================================================================================
// SURAT-MASUK.JS - Logic halaman Surat Masuk
// Sistem Surat Masuk dan Keluar - UBMG
// ===================================================================================

var allSuratMasuk  = [];
var editingId      = null;
var deletingId     = null;
var viewingItem    = null;

// ===================================================================================
// INISIALISASI
// ===================================================================================

document.addEventListener("DOMContentLoaded", function() {
    requireAuth();
    populateUserInfo();
    initSidebar();
    bindEvents();
    loadSuratMasuk();
});

function bindEvents() {
    // Tombol tambah surat
    document.getElementById("btn-tambah-surat").addEventListener("click", function() {
        openFormModal(null);
    });

    // Form submit
    document.getElementById("form-surat-masuk").addEventListener("submit", handleFormSubmit);

    // Tombol batal di form
    document.getElementById("btn-form-batal").addEventListener("click", function() {
        closeModal("modal-form");
    });

    // Tombol hapus di modal konfirmasi
    document.getElementById("btn-confirm-delete").addEventListener("click", handleDelete);

    // Filter status
    document.getElementById("filter-status").addEventListener("change", function() {
        applyFilters();
    });

    // Filter tanggal
    document.getElementById("filter-tanggal-awal").addEventListener("change", applyFilters);
    document.getElementById("filter-tanggal-akhir").addEventListener("change", applyFilters);

    // Pencarian
    document.getElementById("search-input").addEventListener("input", function() {
        filterTable(this.value, "tbody-surat-masuk");
    });

    // Reset filter
    document.getElementById("btn-reset-filter").addEventListener("click", resetFilters);
}

// ===================================================================================
// MUAT DATA SURAT MASUK
// ===================================================================================

async function loadSuratMasuk(filters) {
    showSpinner();

    var result = await apiGetSuratMasuk(filters || {});

    hideSpinner();

    if (!result.success) {
        showToast(result.message || "Gagal memuat data.", "error");
        return;
    }

    allSuratMasuk = result.data || [];
    renderTable(allSuratMasuk);
}

// ===================================================================================
// RENDER TABEL
// ===================================================================================

function renderTable(data) {
    var tbody = document.getElementById("tbody-surat-masuk");

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">' +
            '<div class="empty-state">' +
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>' +
                '<p>Belum ada data surat masuk.</p>' +
            '</div>' +
        '</td></tr>';
        updatePaginationInfo(0, 0, 0);
        return;
    }

    var itemsPerPage = 10;
    initPagination(data.length, itemsPerPage, function(start, end) {
        var slice = data.slice(start, end);
        var html  = "";

        slice.forEach(function(item, idx) {
            html += '<tr>' +
                '<td class="table-no">' + (start + idx + 1) + '</td>' +
                '<td class="fw-600">' + (item["Nomor Surat"] || "-") + '</td>' +
                '<td>' + formatTanggal(item["Tanggal Terima"]) + '</td>' +
                '<td>' + (item["Pengirim"] || "-") + '</td>' +
                '<td>' + (item["Perihal"] || "-") + '</td>' +
                '<td>' + (item["Kategori"] || "-") + '</td>' +
                '<td>' + getBadgeHtml(item["Status"]) + '</td>' +
                '<td>' +
                    '<div class="flex gap-8">' +
                        '<button class="btn btn-sm btn-outline" onclick="openDetailModal(\'' + item["ID"] + '\')" title="Detail">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>' +
                        '</button>' +
                        '<button class="btn btn-sm btn-outline-primary" onclick="openFormModal(\'' + item["ID"] + '\')" title="Edit">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>' +
                        '</button>' +
                        '<button class="btn btn-sm btn-danger" onclick="openDeleteModal(\'' + item["ID"] + '\')" title="Hapus">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>' +
                        '</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        });

        tbody.innerHTML = html;
    });
}

// ===================================================================================
// MODAL FORM TAMBAH/EDIT
// ===================================================================================

function openFormModal(id) {
    var form = document.getElementById("form-surat-masuk");
    form.reset();
    resetFormValidation(form);

    if (id) {
        // Mode edit
        editingId  = id;
        var item   = allSuratMasuk.find(function(s) { return s["ID"].toString() === id.toString(); });
        if (!item) { showToast("Data tidak ditemukan.", "error"); return; }

        document.getElementById("modal-form-title").textContent = "Edit Surat Masuk";
        document.getElementById("nomor-surat").value            = item["Nomor Surat"]     || "";
        document.getElementById("tanggal-surat").value          = toInputDate(item["Tanggal Surat"]);
        document.getElementById("tanggal-terima").value         = toInputDate(item["Tanggal Terima"]);
        document.getElementById("pengirim").value               = item["Pengirim"]        || "";
        document.getElementById("perihal").value                = item["Perihal"]         || "";
        document.getElementById("kategori").value               = item["Kategori"]        || "";
        document.getElementById("ditujukan-kepada").value       = item["Ditujukan Kepada"] || "";
        document.getElementById("status-surat").value           = item["Status"]          || "Pending";
        document.getElementById("keterangan").value             = item["Keterangan"]      || "";
        document.getElementById("link-lampiran").value          = item["Link Lampiran"]   || "";

    } else {
        // Mode tambah
        editingId = null;
        document.getElementById("modal-form-title").textContent = "Tambah Surat Masuk";
    }

    var fileInput = document.getElementById("upload-file");
    if (fileInput) fileInput.value = "";

    openModal("modal-form");
}

// ===================================================================================
// SIMPAN DATA (TAMBAH / EDIT)
// ===================================================================================

async function handleFormSubmit(e) {
    e.preventDefault();

    var form = document.getElementById("form-surat-masuk");
    if (!validateForm(form)) return;

    var session = getSession();
    var payload = {
        nomorSurat:      document.getElementById("nomor-surat").value.trim(),
        tanggalSurat:    document.getElementById("tanggal-surat").value,
        tanggalTerima:   document.getElementById("tanggal-terima").value,
        pengirim:        document.getElementById("pengirim").value.trim(),
        perihal:         document.getElementById("perihal").value.trim(),
        kategori:        document.getElementById("kategori").value,
        ditujukanKepada: document.getElementById("ditujukan-kepada").value.trim(),
        status:          document.getElementById("status-surat").value,
        keterangan:      document.getElementById("keterangan").value.trim(),
        linkLampiran:    document.getElementById("link-lampiran").value.trim(),
        dibuatOleh:      session ? session.username : ""
    };

    var btnSimpan = document.getElementById("btn-form-simpan");
    btnSimpan.disabled   = true;
    btnSimpan.innerHTML  = '<span class="spinner-inline"></span> Menyimpan...';

    // Proses file upload jika ada
    var fileInput = document.getElementById("upload-file");
    if (fileInput && fileInput.files.length > 0) {
        try {
            var file = fileInput.files[0];
            payload.fileName = file.name;
            payload.fileMimeType = file.type;
            payload.fileBase64 = await new Promise(function(resolve, reject) {
                var reader = new FileReader();
                reader.onload = function() { resolve(reader.result.split(',')[1]); };
                reader.onerror = function(error) { reject(error); };
                reader.readAsDataURL(file);
            });
        } catch (e) {
            btnSimpan.disabled  = false;
            btnSimpan.innerHTML = 'Simpan';
            showToast("Gagal membaca file lampiran.", "error");
            return;
        }
    }

    var result;
    if (editingId) {
        payload.id = editingId;
        result = await apiUpdateSuratMasuk(payload);
    } else {
        result = await apiAddSuratMasuk(payload);
    }

    btnSimpan.disabled  = false;
    btnSimpan.innerHTML = 'Simpan';

    if (result.success) {
        showToast(result.message || "Data berhasil disimpan.", "success");
        closeModal("modal-form");
        loadSuratMasuk();
    } else {
        showToast(result.message || "Gagal menyimpan data.", "error");
    }
}

// ===================================================================================
// MODAL DETAIL
// ===================================================================================

function openDetailModal(id) {
    var item = allSuratMasuk.find(function(s) { return s["ID"].toString() === id.toString(); });
    if (!item) { showToast("Data tidak ditemukan.", "error"); return; }

    document.getElementById("detail-nomor-surat").textContent     = item["Nomor Surat"]      || "-";
    document.getElementById("detail-tanggal-surat").textContent   = formatTanggal(item["Tanggal Surat"]);
    document.getElementById("detail-tanggal-terima").textContent  = formatTanggal(item["Tanggal Terima"]);
    document.getElementById("detail-pengirim").textContent        = item["Pengirim"]         || "-";
    document.getElementById("detail-perihal").textContent         = item["Perihal"]          || "-";
    document.getElementById("detail-kategori").textContent        = item["Kategori"]         || "-";
    document.getElementById("detail-ditujukan").textContent       = item["Ditujukan Kepada"] || "-";
    document.getElementById("detail-keterangan").textContent      = item["Keterangan"]       || "-";
    document.getElementById("detail-dibuat-oleh").textContent     = item["Dibuat Oleh"]      || "-";
    document.getElementById("detail-tanggal-input").textContent   = item["Tanggal Input"]    || "-";

    var elStatus = document.getElementById("detail-status");
    elStatus.innerHTML = getBadgeHtml(item["Status"]);

    var elLampiran = document.getElementById("detail-lampiran");
    if (item["Link Lampiran"]) {
        elLampiran.innerHTML = '<a href="' + item["Link Lampiran"] + '" target="_blank" class="btn btn-sm btn-outline-primary">Buka Link Lampiran</a>';
    } else {
        elLampiran.textContent = "Tidak ada link lampiran";
    }

    var elFileUpload = document.getElementById("detail-file-upload");
    if (item["File Upload"]) {
        elFileUpload.innerHTML = '<a href="' + item["File Upload"] + '" target="_blank" class="btn btn-sm btn-outline-primary">Buka File Upload</a>';
    } else {
        elFileUpload.textContent = "Tidak ada file upload";
    }

    openModal("modal-detail");
}

// ===================================================================================
// HAPUS DATA
// ===================================================================================

function openDeleteModal(id) {
    deletingId = id;
    openModal("modal-delete");
}

async function handleDelete() {
    if (!deletingId) return;

    var btnDelete = document.getElementById("btn-confirm-delete");
    btnDelete.disabled  = true;
    btnDelete.innerHTML = '<span class="spinner-inline"></span> Menghapus...';

    var result = await apiDeleteSuratMasuk(deletingId);

    btnDelete.disabled  = false;
    btnDelete.innerHTML = 'Hapus';

    if (result.success) {
        showToast(result.message || "Data berhasil dihapus.", "success");
        closeModal("modal-delete");
        loadSuratMasuk();
    } else {
        showToast(result.message || "Gagal menghapus data.", "error");
    }

    deletingId = null;
}

// ===================================================================================
// FILTER
// ===================================================================================

function applyFilters() {
    var status       = document.getElementById("filter-status").value;
    var tanggalAwal  = document.getElementById("filter-tanggal-awal").value;
    var tanggalAkhir = document.getElementById("filter-tanggal-akhir").value;

    var filtered = allSuratMasuk.filter(function(item) {
        var matchStatus = !status || status === "Semua" || item["Status"] === status;
        var matchAwal   = !tanggalAwal  || item["Tanggal Terima"] >= tanggalAwal;
        var matchAkhir  = !tanggalAkhir || item["Tanggal Terima"] <= tanggalAkhir;
        return matchStatus && matchAwal && matchAkhir;
    });

    renderTable(filtered);
}

function resetFilters() {
    document.getElementById("filter-status").value        = "";
    document.getElementById("filter-tanggal-awal").value  = "";
    document.getElementById("filter-tanggal-akhir").value = "";
    document.getElementById("search-input").value         = "";
    renderTable(allSuratMasuk);
}

function updatePaginationInfo(start, end, total) {
    var el = document.getElementById("pagination-info");
    if (el) {
        el.textContent = "Menampilkan " + (total === 0 ? 0 : start + 1) + " - " + end + " dari " + total + " data";
    }
}
