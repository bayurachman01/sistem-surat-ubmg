// ===================================================================================
// SURAT-KELUAR.JS - Logic halaman Surat Keluar
// Sistem Surat Masuk dan Keluar - UBMG
// ===================================================================================

var allSuratKeluar = [];
var editingIdKeluar  = null;
var deletingIdKeluar = null;

document.addEventListener("DOMContentLoaded", function() {
    requireAuth();
    populateUserInfo();
    initSidebar();
    bindEventsKeluar();
    loadSuratKeluar();
});

function bindEventsKeluar() {
    document.getElementById("btn-tambah-surat").addEventListener("click", function() {
        openFormModalKeluar(null);
    });

    document.getElementById("form-surat-keluar").addEventListener("submit", handleFormSubmitKeluar);

    document.getElementById("btn-form-batal").addEventListener("click", function() {
        closeModal("modal-form");
    });

    document.getElementById("btn-confirm-delete").addEventListener("click", handleDeleteKeluar);

    document.getElementById("filter-status").addEventListener("change", applyFiltersKeluar);
    document.getElementById("filter-tanggal-awal").addEventListener("change", applyFiltersKeluar);
    document.getElementById("filter-tanggal-akhir").addEventListener("change", applyFiltersKeluar);

    document.getElementById("search-input").addEventListener("input", function() {
        filterTable(this.value, "tbody-surat-keluar");
    });

    document.getElementById("btn-reset-filter").addEventListener("click", resetFiltersKeluar);
}

async function loadSuratKeluar(filters) {
    showSpinner();
    var result = await apiGetSuratKeluar(filters || {});
    hideSpinner();

    if (!result.success) {
        showToast(result.message || "Gagal memuat data.", "error");
        return;
    }

    allSuratKeluar = result.data || [];
    renderTableKeluar(allSuratKeluar);
}

function renderTableKeluar(data) {
    var tbody = document.getElementById("tbody-surat-keluar");

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">' +
            '<div class="empty-state">' +
                '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>' +
                '<p>Belum ada data surat keluar.</p>' +
            '</div>' +
        '</td></tr>';
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
                '<td>' + formatTanggal(item["Tanggal Surat"]) + '</td>' +
                '<td>' + (item["Tujuan"] || "-") + '</td>' +
                '<td>' + (item["Perihal"] || "-") + '</td>' +
                '<td>' + (item["Penandatangan"] || "-") + '</td>' +
                '<td>' + getBadgeHtml(item["Status"]) + '</td>' +
                '<td>' +
                    '<div class="flex gap-8">' +
                        '<button class="btn btn-sm btn-outline" onclick="openDetailModalKeluar(\'' + item["ID"] + '\')" title="Detail">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>' +
                        '</button>' +
                        '<button class="btn btn-sm btn-outline-primary" onclick="openFormModalKeluar(\'' + item["ID"] + '\')" title="Edit">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>' +
                        '</button>' +
                        '<button class="btn btn-sm btn-danger" onclick="openDeleteModalKeluar(\'' + item["ID"] + '\')" title="Hapus">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>' +
                        '</button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        });

        tbody.innerHTML = html;
    });
}

function openFormModalKeluar(id) {
    var form = document.getElementById("form-surat-keluar");
    form.reset();
    resetFormValidation(form);

    if (id) {
        editingIdKeluar = id;
        var item = allSuratKeluar.find(function(s) { return s["ID"].toString() === id.toString(); });
        if (!item) { showToast("Data tidak ditemukan.", "error"); return; }

        document.getElementById("modal-form-title").textContent  = "Edit Surat Keluar";
        document.getElementById("nomor-surat").value             = item["Nomor Surat"]    || "";
        document.getElementById("tanggal-surat").value           = toInputDate(item["Tanggal Surat"]);
        document.getElementById("tujuan").value                  = item["Tujuan"]         || "";
        document.getElementById("perihal").value                 = item["Perihal"]        || "";
        document.getElementById("kategori").value                = item["Kategori"]       || "";
        document.getElementById("penandatangan").value           = item["Penandatangan"]  || "";
        document.getElementById("status-surat").value            = item["Status"]         || "Draft";
        document.getElementById("keterangan").value              = item["Keterangan"]     || "";
        document.getElementById("link-lampiran").value           = item["Link Lampiran"]  || "";
    } else {
        editingIdKeluar = null;
        document.getElementById("modal-form-title").textContent = "Tambah Surat Keluar";
    }

    var fileInput = document.getElementById("upload-file");
    if (fileInput) fileInput.value = "";

    openModal("modal-form");
}

async function handleFormSubmitKeluar(e) {
    e.preventDefault();

    var form = document.getElementById("form-surat-keluar");
    if (!validateForm(form)) return;

    var session = getSession();
    var payload = {
        nomorSurat:    document.getElementById("nomor-surat").value.trim(),
        tanggalSurat:  document.getElementById("tanggal-surat").value,
        tujuan:        document.getElementById("tujuan").value.trim(),
        perihal:       document.getElementById("perihal").value.trim(),
        kategori:      document.getElementById("kategori").value,
        penandatangan: document.getElementById("penandatangan").value.trim(),
        status:        document.getElementById("status-surat").value,
        keterangan:    document.getElementById("keterangan").value.trim(),
        linkLampiran:  document.getElementById("link-lampiran").value.trim(),
        dibuatOleh:    session ? session.username : ""
    };

    var btnSimpan = document.getElementById("btn-form-simpan");
    btnSimpan.disabled  = true;
    btnSimpan.innerHTML = '<span class="spinner-inline"></span> Menyimpan...';

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
    if (editingIdKeluar) {
        payload.id = editingIdKeluar;
        result = await apiUpdateSuratKeluar(payload);
    } else {
        result = await apiAddSuratKeluar(payload);
    }

    btnSimpan.disabled  = false;
    btnSimpan.innerHTML = 'Simpan';

    if (result.success) {
        showToast(result.message || "Data berhasil disimpan.", "success");
        closeModal("modal-form");
        loadSuratKeluar();
    } else {
        showToast(result.message || "Gagal menyimpan data.", "error");
    }
}

function openDetailModalKeluar(id) {
    var item = allSuratKeluar.find(function(s) { return s["ID"].toString() === id.toString(); });
    if (!item) { showToast("Data tidak ditemukan.", "error"); return; }

    document.getElementById("detail-nomor-surat").textContent   = item["Nomor Surat"]   || "-";
    document.getElementById("detail-tanggal-surat").textContent = formatTanggal(item["Tanggal Surat"]);
    document.getElementById("detail-tujuan").textContent        = item["Tujuan"]        || "-";
    document.getElementById("detail-perihal").textContent       = item["Perihal"]       || "-";
    document.getElementById("detail-kategori").textContent      = item["Kategori"]      || "-";
    document.getElementById("detail-penandatangan").textContent = item["Penandatangan"] || "-";
    document.getElementById("detail-keterangan").textContent    = item["Keterangan"]    || "-";
    document.getElementById("detail-dibuat-oleh").textContent   = item["Dibuat Oleh"]   || "-";
    document.getElementById("detail-tanggal-input").textContent = item["Tanggal Input"] || "-";

    var elStatus = document.getElementById("detail-status");
    elStatus.innerHTML = getBadgeHtml(item["Status"]);

    var elLampiran = document.getElementById("detail-lampiran");
    if (item["Link Lampiran"]) {
        elLampiran.innerHTML = '<a href="' + item["Link Lampiran"] + '" target="_blank" class="btn btn-sm btn-outline-primary">Buka Lampiran</a>';
    } else {
        elLampiran.textContent = "Tidak ada lampiran";
    }

    openModal("modal-detail");
}

function openDeleteModalKeluar(id) {
    deletingIdKeluar = id;
    openModal("modal-delete");
}

async function handleDeleteKeluar() {
    if (!deletingIdKeluar) return;

    var btnDelete = document.getElementById("btn-confirm-delete");
    btnDelete.disabled  = true;
    btnDelete.innerHTML = '<span class="spinner-inline"></span> Menghapus...';

    var result = await apiDeleteSuratKeluar(deletingIdKeluar);

    btnDelete.disabled  = false;
    btnDelete.innerHTML = 'Hapus';

    if (result.success) {
        showToast(result.message || "Data berhasil dihapus.", "success");
        closeModal("modal-delete");
        loadSuratKeluar();
    } else {
        showToast(result.message || "Gagal menghapus data.", "error");
    }

    deletingIdKeluar = null;
}

function applyFiltersKeluar() {
    var status       = document.getElementById("filter-status").value;
    var tanggalAwal  = document.getElementById("filter-tanggal-awal").value;
    var tanggalAkhir = document.getElementById("filter-tanggal-akhir").value;

    var filtered = allSuratKeluar.filter(function(item) {
        var matchStatus = !status || status === "Semua" || item["Status"] === status;
        var matchAwal   = !tanggalAwal  || item["Tanggal Surat"] >= tanggalAwal;
        var matchAkhir  = !tanggalAkhir || item["Tanggal Surat"] <= tanggalAkhir;
        return matchStatus && matchAwal && matchAkhir;
    });

    renderTableKeluar(filtered);
}

function resetFiltersKeluar() {
    document.getElementById("filter-status").value        = "";
    document.getElementById("filter-tanggal-awal").value  = "";
    document.getElementById("filter-tanggal-akhir").value = "";
    document.getElementById("search-input").value         = "";
    renderTableKeluar(allSuratKeluar);
}
