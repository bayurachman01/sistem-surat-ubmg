// ===================================================================================
// API.JS - Fungsi komunikasi ke Google Apps Script
// Sistem Surat Masuk dan Keluar - UBMG
// ===================================================================================

// Ganti URL ini dengan URL Web App Google Apps Script Anda setelah deploy
var API_URL = "https://script.google.com/macros/s/AKfycbyceo70nQfLdUgYQZ2xEce2TLFsNqCsqdafplRhWo5IeE7U4l8aDlNj5csg5OEdI_9-/exec";

/**
 * Fungsi utama untuk mengirim request POST ke Apps Script.
 * Semua operasi CRUD melewati fungsi ini.
 *
 * @param {object} payload - Object data yang akan dikirim, wajib berisi property 'action'
 * @returns {Promise<object>} - Response dari server
 */
async function apiRequest(payload) {
    try {
        var response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Server merespons dengan status: " + response.status);
        }

        var data = await response.json();
        return data;

    } catch (error) {
        console.error("API Error:", error.message);
        return {
            success: false,
            message: "Gagal terhubung ke server. Periksa koneksi internet Anda."
        };
    }
}

// ===================================================================================
// AUTENTIKASI
// ===================================================================================

async function apiLogin(username, password) {
    return await apiRequest({
        action: "login",
        username: username,
        password: password
    });
}

// ===================================================================================
// DASHBOARD
// ===================================================================================

async function apiGetDashboardStats() {
    return await apiRequest({ action: "getDashboardStats" });
}

// ===================================================================================
// SURAT MASUK
// ===================================================================================

async function apiGetSuratMasuk(filters) {
    return await apiRequest(Object.assign({ action: "getSuratMasuk" }, filters || {}));
}

async function apiAddSuratMasuk(data) {
    return await apiRequest(Object.assign({ action: "addSuratMasuk" }, data));
}

async function apiUpdateSuratMasuk(payload) {
    payload.action = "updateSuratMasuk";
    return await apiRequest(payload);
}

async function apiDeleteSuratMasuk(id) {
    return await apiRequest({
        action: "deleteSuratMasuk",
        id: id
    });
}

async function apiUpdateDisposisi(payload) {
    payload.action = "updateDisposisi";
    return await apiRequest(payload);
}

// ===================================================================================
// SURAT KELUAR
// ===================================================================================

async function apiGetSuratKeluar(filters) {
    return await apiRequest(Object.assign({ action: "getSuratKeluar" }, filters || {}));
}

async function apiAddSuratKeluar(data) {
    return await apiRequest(Object.assign({ action: "addSuratKeluar" }, data));
}

async function apiUpdateSuratKeluar(data) {
    return await apiRequest(Object.assign({ action: "updateSuratKeluar" }, data));
}

async function apiDeleteSuratKeluar(id) {
    return await apiRequest({ action: "deleteSuratKeluar", id: id });
}

// ===================================================================================
// LAPORAN
// ===================================================================================

async function apiGetLaporan(filters) {
    return await apiRequest(Object.assign({ action: "getLaporan" }, filters || {}));
}

// ===================================================================================
// USERS
// ===================================================================================

async function apiGetUsers() {
    return await apiRequest({ action: "getUsers" });
}

async function apiAddUser(data) {
    return await apiRequest(Object.assign({ action: "addUser" }, data));
}

async function apiUpdateUser(data) {
    return await apiRequest(Object.assign({ action: "updateUser" }, data));
}

async function apiDeleteUser(username) {
    return await apiRequest({ action: "deleteUser", username: username });
}
