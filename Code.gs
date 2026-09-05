// ===================================================================================
// SISTEM SURAT MASUK DAN KELUAR - UNIVERSITAS BINA MANDIRI GORONTALO (UBMG)
// Backend: Google Apps Script
// Author: Developer Fullstack Senior
// Version: 1.0
// ===================================================================================

// Konfigurasi ID Spreadsheet - Ganti dengan ID Spreadsheet Anda
var SPREADSHEET_ID = "1m7S6xnoRmGpDMAsTbnrshpkORxZsdhNSJvJtuSGDoZU";

// Nama sheet di dalam Spreadsheet
var SHEET_SURAT_MASUK  = "Surat Masuk";
var SHEET_SURAT_KELUAR = "Surat Keluar";
var SHEET_USERS        = "Users";

// Kunci session (untuk keamanan sederhana berbasis token)
var SESSION_KEY = "ubmg_surat_session_2024";

// ===================================================================================
// FUNGSI UTAMA - HANDLE HTTP REQUEST
// ===================================================================================

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "UBMG Surat API aktif." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;

    var result;

    switch (action) {
      // Autentikasi
      case "login":
        result = handleLogin(params);
        break;

      // Surat Masuk
      case "getSuratMasuk":
        result = getSuratMasuk(params);
        break;
      case "addSuratMasuk":
        result = addSuratMasuk(params);
        break;
      case "updateSuratMasuk":
        result = updateSuratMasuk(params);
        break;
      case "updateDisposisi":
        result = updateDisposisi(params);
        break;
      case "deleteSuratMasuk":
        result = deleteSuratMasuk(params);
        break;

      // Surat Keluar
      case "getSuratKeluar":
        result = getSuratKeluar(params);
        break;
      case "addSuratKeluar":
        result = addSuratKeluar(params);
        break;
      case "updateSuratKeluar":
        result = updateSuratKeluar(params);
        break;
      case "deleteSuratKeluar":
        result = deleteSuratKeluar(params);
        break;

      // Dashboard
      case "getDashboardStats":
        result = getDashboardStats(params);
        break;

      // Laporan
      case "getLaporan":
        result = getLaporan(params);
        break;

      // Users
      case "getUsers":
        result = getUsers(params);
        break;
      case "addUser":
        result = addUser(params);
        break;
      case "updateUser":
        result = updateUser(params);
        break;
      case "deleteUser":
        result = deleteUser(params);
        break;

      default:
        result = { success: false, message: "Action tidak dikenali: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: "Terjadi kesalahan server: " + error.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===================================================================================
// HELPER - AKSES SPREADSHEET
// ===================================================================================

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(sheetName) {
  return getSpreadsheet().getSheetByName(sheetName);
}

// Ambil semua data dari sheet tertentu sebagai array of objects
function getSheetData(sheetName) {
  var sheet = getSheet(sheetName);
  var data  = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return [];
  }

  var headers = data[0];
  var rows    = [];

  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      var value = data[i][j];
      // Format tanggal jika berupa objek Date
      if (value instanceof Date) {
        value = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      row[headers[j]] = value;
    }
    rows.push(row);
  }

  return rows;
}

// Generate ID unik berbasis timestamp
function generateId() {
  return new Date().getTime().toString();
}

// ===================================================================================
// HELPER - UPLOAD FILE
// ===================================================================================

function getOrCreateFolder(folderName, parentFolder) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(folderName);
  }
}

function uploadFileToDrive(base64Data, fileName, mimeType) {
  try {
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, fileName);
    var folder = DriveApp.getRootFolder();
    var ubmgFolder = getOrCreateFolder("Sistem Surat UBMG Uploads", folder);
    var file = ubmgFolder.createFile(blob);
    
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    throw new Error("Gagal mengupload file ke Drive: " + e.message);
  }
}

// ===================================================================================
// AUTENTIKASI
// ===================================================================================

function handleLogin(params) {
  var username = params.username ? params.username.toString().trim() : "";
  var password = params.password ? params.password.toString().trim() : "";

  if (!username || !password) {
    return { success: false, message: "Username dan password wajib diisi." };
  }

  var sheet = getSheet(SHEET_USERS);
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    var storedUsername = data[i][0] ? data[i][0].toString().trim() : "";
    var storedPassword = data[i][1] ? data[i][1].toString().trim() : "";
    var namaLengkap    = data[i][2] ? data[i][2].toString() : "";
    var role           = data[i][3] ? data[i][3].toString() : "Operator";
    var status         = data[i][4] ? data[i][4].toString() : "Aktif";

    if (storedUsername === username && storedPassword === password && status === "Aktif") {
      return {
        success: true,
        message: "Login berhasil.",
        data: {
          username:    storedUsername,
          namaLengkap: namaLengkap,
          role:        role
        }
      };
    }
  }

  return { success: false, message: "Username atau password salah, atau akun tidak aktif." };
}

// ===================================================================================
// SURAT MASUK - CRUD
// ===================================================================================

function getSuratMasuk(params) {
  try {
    var data = getSheetData(SHEET_SURAT_MASUK);

    // Filter berdasarkan status jika ada
    if (params.status && params.status !== "Semua") {
      data = data.filter(function(row) {
        return row["Status"] === params.status;
      });
    }

    // Filter berdasarkan tanggal awal
    if (params.tanggalAwal) {
      data = data.filter(function(row) {
        return row["Tanggal Terima"] >= params.tanggalAwal;
      });
    }

    // Filter berdasarkan tanggal akhir
    if (params.tanggalAkhir) {
      data = data.filter(function(row) {
        return row["Tanggal Terima"] <= params.tanggalAkhir;
      });
    }

    return { success: true, data: data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data surat masuk: " + error.message };
  }
}

function addSuratMasuk(params) {
  try {
    var sheet = getSheet(SHEET_SURAT_MASUK);
    var id    = generateId();
    var now   = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    var linkLampiran = params.linkLampiran || "";
    
    var fileUploadUrl = "";
    
    // Cek apakah ada upload file base64
    if (params.fileBase64 && params.fileName) {
      fileUploadUrl = uploadFileToDrive(params.fileBase64, params.fileName, params.fileMimeType);
    }

    var headers = sheet.getRange(1, 1, 1, Math.max(14, sheet.getLastColumn())).getValues()[0];
    var newRow = new Array(headers.length).fill("");
    
    // Map values to correct columns based on header names
    for (var i = 0; i < headers.length; i++) {
      var headerName = headers[i].toString().trim();
      if (headerName === "ID") newRow[i] = id;
      else if (headerName === "Nomor Surat") newRow[i] = params.nomorSurat || "";
      else if (headerName === "Tanggal Surat") newRow[i] = params.tanggalSurat || "";
      else if (headerName === "Tanggal Terima") newRow[i] = params.tanggalTerima || "";
      else if (headerName === "Pengirim") newRow[i] = params.pengirim || "";
      else if (headerName === "Perihal") newRow[i] = params.perihal || "";
      else if (headerName === "Kategori") newRow[i] = params.kategori || "";
      else if (headerName === "Ditujukan Kepada") newRow[i] = params.ditujukanKepada || "";
      else if (headerName === "Status") newRow[i] = params.status || "Pending";
      else if (headerName === "Keterangan") newRow[i] = params.keterangan || "";
      else if (headerName === "Link Lampiran") newRow[i] = linkLampiran;
      else if (headerName === "File Upload") newRow[i] = fileUploadUrl;
      else if (headerName === "Dibuat Oleh") newRow[i] = params.dibuatOleh || "";
      else if (headerName === "Tanggal Input") newRow[i] = now;
      else if (headerName === "Diteruskan Ke") newRow[i] = params.diteruskanKe || "";
      else if (headerName === "Status Baca") newRow[i] = params.statusBaca || "Belum Dibaca";
      else if (headerName === "Catatan Rektor") newRow[i] = params.catatanRektor || "";
    }

    sheet.appendRow(newRow);

    return { success: true, message: "Data Surat Masuk berhasil disimpan.", id: id };
  } catch (error) {
    return { success: false, message: "Gagal menambahkan surat masuk: " + error.message };
  }
}

function updateSuratMasuk(params) {
  try {
    var sheet = getSheet(SHEET_SURAT_MASUK);
    var data  = sheet.getDataRange().getValues();

    var linkLampiran = params.linkLampiran;
    var fileUploadUrl = undefined;
    if (params.fileBase64 && params.fileName) {
      fileUploadUrl = uploadFileToDrive(params.fileBase64, params.fileName, params.fileMimeType);
    }

    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === params.id.toString()) {
        var rowNum = i + 1;
        sheet.getRange(rowNum, 2).setValue(params.nomorSurat     || data[i][1]);
        sheet.getRange(rowNum, 3).setValue(params.tanggalSurat   || data[i][2]);
        sheet.getRange(rowNum, 4).setValue(params.tanggalTerima  || data[i][3]);
        sheet.getRange(rowNum, 5).setValue(params.pengirim       || data[i][4]);
        sheet.getRange(rowNum, 6).setValue(params.perihal        || data[i][5]);
        sheet.getRange(rowNum, 7).setValue(params.kategori       || data[i][6]);
        sheet.getRange(rowNum, 8).setValue(params.ditujukanKepada || data[i][7]);
        sheet.getRange(rowNum, 9).setValue(params.status         || data[i][8]);
        sheet.getRange(rowNum, 10).setValue(params.keterangan    || data[i][9]);
        
        var headers = data[0];
        var colLinkLampiran = 11; // default
        var colFileUpload = 12; // default
        var colDiteruskan = -1;
        var colStatusBaca = -1;
        var colCatatanRektor = -1;
        
        for (var h = 0; h < headers.length; h++) {
          var headerName = headers[h].toString().trim();
          if (headerName === "Link Lampiran") colLinkLampiran = h + 1;
          if (headerName === "File Upload") colFileUpload = h + 1;
          if (headerName === "Diteruskan Ke") colDiteruskan = h + 1;
          if (headerName === "Status Baca") colStatusBaca = h + 1;
          if (headerName === "Catatan Rektor") colCatatanRektor = h + 1;
        }
        
        sheet.getRange(rowNum, colLinkLampiran).setValue(linkLampiran !== undefined ? linkLampiran : data[i][colLinkLampiran-1]);
        if (fileUploadUrl !== undefined) {
          sheet.getRange(rowNum, colFileUpload).setValue(fileUploadUrl);
        }
        
        if (colDiteruskan > -1 && params.diteruskanKe !== undefined) sheet.getRange(rowNum, colDiteruskan).setValue(params.diteruskanKe);
        if (colStatusBaca > -1 && params.statusBaca !== undefined) sheet.getRange(rowNum, colStatusBaca).setValue(params.statusBaca);
        if (colCatatanRektor > -1 && params.catatanRektor !== undefined) sheet.getRange(rowNum, colCatatanRektor).setValue(params.catatanRektor);

        return { success: true, message: "Data Surat Masuk berhasil diperbarui." };
      }
    }

    return { success: false, message: "Surat masuk dengan ID tersebut tidak ditemukan." };
  } catch (error) {
    return { success: false, message: "Gagal memperbarui surat masuk: " + error.message };
  }
}

function deleteSuratMasuk(params) {
  try {
    var sheet = getSheet(SHEET_SURAT_MASUK);
    var data  = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === params.id.toString()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Surat masuk berhasil dihapus." };
      }
    }

    return { success: false, message: "Surat masuk dengan ID tersebut tidak ditemukan." };
  } catch (error) {
    return { success: false, message: "Gagal menghapus surat masuk: " + error.message };
  }
}

// ===================================================================================
// SURAT KELUAR - CRUD
// ===================================================================================

function getSuratKeluar(params) {
  try {
    var data = getSheetData(SHEET_SURAT_KELUAR);

    if (params.status && params.status !== "Semua") {
      data = data.filter(function(row) {
        return row["Status"] === params.status;
      });
    }

    if (params.tanggalAwal) {
      data = data.filter(function(row) {
        return row["Tanggal Surat"] >= params.tanggalAwal;
      });
    }

    if (params.tanggalAkhir) {
      data = data.filter(function(row) {
        return row["Tanggal Surat"] <= params.tanggalAkhir;
      });
    }

    return { success: true, data: data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data surat keluar: " + error.message };
  }
}

function addSuratKeluar(params) {
  try {
    var sheet = getSheet(SHEET_SURAT_KELUAR);
    var id    = generateId();
    var now   = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

    var linkLampiran = params.linkLampiran || "";
    
    var fileUploadUrl = "";
    
    // Cek apakah ada upload file base64
    if (params.fileBase64 && params.fileName) {
      fileUploadUrl = uploadFileToDrive(params.fileBase64, params.fileName, params.fileMimeType);
    }

    var headers = sheet.getRange(1, 1, 1, Math.max(13, sheet.getLastColumn())).getValues()[0];
    var newRow = new Array(headers.length).fill("");
    
    // Map values to correct columns based on header names
    for (var i = 0; i < headers.length; i++) {
      var headerName = headers[i].toString().trim();
      if (headerName === "ID") newRow[i] = id;
      else if (headerName === "Nomor Surat") newRow[i] = params.nomorSurat || "";
      else if (headerName === "Tanggal Surat") newRow[i] = params.tanggalSurat || "";
      else if (headerName === "Tujuan") newRow[i] = params.tujuan || "";
      else if (headerName === "Perihal") newRow[i] = params.perihal || "";
      else if (headerName === "Kategori") newRow[i] = params.kategori || "";
      else if (headerName === "Penandatangan") newRow[i] = params.penandatangan || "";
      else if (headerName === "Status") newRow[i] = params.status || "Draft";
      else if (headerName === "Keterangan") newRow[i] = params.keterangan || "";
      else if (headerName === "Link Lampiran") newRow[i] = linkLampiran;
      else if (headerName === "File Upload") newRow[i] = fileUploadUrl;
      else if (headerName === "Dibuat Oleh") newRow[i] = params.dibuatOleh || "";
      else if (headerName === "Tanggal Input") newRow[i] = now;
    }

    sheet.appendRow(newRow);

    return { success: true, message: "Data Surat Keluar berhasil disimpan.", id: id };
  } catch (error) {
    return { success: false, message: "Gagal menambahkan surat keluar: " + error.message };
  }
}

function updateSuratKeluar(params) {
  try {
    var sheet = getSheet(SHEET_SURAT_KELUAR);
    var data  = sheet.getDataRange().getValues();

    var linkLampiran = params.linkLampiran;
    var fileUploadUrl = undefined;
    if (params.fileBase64 && params.fileName) {
      fileUploadUrl = uploadFileToDrive(params.fileBase64, params.fileName, params.fileMimeType);
    }

    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === params.id.toString()) {
        var rowNum = i + 1;
        sheet.getRange(rowNum, 2).setValue(params.nomorSurat    || data[i][1]);
        sheet.getRange(rowNum, 3).setValue(params.tanggalSurat  || data[i][2]);
        sheet.getRange(rowNum, 4).setValue(params.tujuan        || data[i][3]);
        sheet.getRange(rowNum, 5).setValue(params.perihal       || data[i][4]);
        sheet.getRange(rowNum, 6).setValue(params.kategori      || data[i][5]);
        sheet.getRange(rowNum, 7).setValue(params.penandatangan || data[i][6]);
        sheet.getRange(rowNum, 8).setValue(params.status        || data[i][7]);
        sheet.getRange(rowNum, 9).setValue(params.keterangan    || data[i][8]);
        
        var headers = data[0];
        var colLinkLampiran = 10; // default
        var colFileUpload = 11; // default
        for (var h = 0; h < headers.length; h++) {
          var headerName = headers[h].toString().trim();
          if (headerName === "Link Lampiran") colLinkLampiran = h + 1;
          if (headerName === "File Upload") colFileUpload = h + 1;
        }

        sheet.getRange(rowNum, colLinkLampiran).setValue(linkLampiran !== undefined ? linkLampiran : data[i][colLinkLampiran-1]);
        if (fileUploadUrl !== undefined) {
          sheet.getRange(rowNum, colFileUpload).setValue(fileUploadUrl);
        }
        return { success: true, message: "Data Surat Keluar berhasil diperbarui." };
      }
    }

    return { success: false, message: "Surat keluar dengan ID tersebut tidak ditemukan." };
  } catch (error) {
    return { success: false, message: "Gagal memperbarui surat keluar: " + error.message };
  }
}

function deleteSuratKeluar(params) {
  try {
    var sheet = getSheet(SHEET_SURAT_KELUAR);
    var data  = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === params.id.toString()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Surat keluar berhasil dihapus." };
      }
    }

    return { success: false, message: "Surat keluar dengan ID tersebut tidak ditemukan." };
  } catch (error) {
    return { success: false, message: "Gagal menghapus surat keluar: " + error.message };
  }
}

// ===================================================================================
// DASHBOARD STATISTIK
// ===================================================================================

function getDashboardStats(params) {
  try {
    var suratMasuk  = getSheetData(SHEET_SURAT_MASUK);
    var suratKeluar = getSheetData(SHEET_SURAT_KELUAR);

    var totalMasuk   = suratMasuk.length;
    var totalKeluar  = suratKeluar.length;

    var pendingMasuk  = suratMasuk.filter(function(r)  { return r["Status"] === "Pending"; }).length;
    var pendingKeluar = suratKeluar.filter(function(r) { return r["Status"] === "Draft"; }).length;
    var totalPending  = pendingMasuk + pendingKeluar;

    var selesaiMasuk  = suratMasuk.filter(function(r)  { return r["Status"] === "Selesai"; }).length;
    var selesaiKeluar = suratKeluar.filter(function(r) { return r["Status"] === "Terkirim"; }).length;
    var totalSelesai  = selesaiMasuk + selesaiKeluar;

    // 5 surat masuk terbaru
    var recentMasuk = suratMasuk.slice(-5).reverse();

    // 5 surat keluar terbaru
    var recentKeluar = suratKeluar.slice(-5).reverse();

    // Statistik per bulan untuk chart (12 bulan terakhir)
    var chartData = buildMonthlyChartData(suratMasuk, suratKeluar);

    return {
      success: true,
      data: {
        totalMasuk:   totalMasuk,
        totalKeluar:  totalKeluar,
        totalPending: totalPending,
        totalSelesai: totalSelesai,
        recentMasuk:  recentMasuk,
        recentKeluar: recentKeluar,
        chartData:    chartData
      }
    };
  } catch (error) {
    return { success: false, message: "Gagal mengambil statistik dashboard: " + error.message };
  }
}

function buildMonthlyChartData(suratMasuk, suratKeluar) {
  var months = [];
  var today  = new Date();

  for (var i = 11; i >= 0; i--) {
    var date       = new Date(today.getFullYear(), today.getMonth() - i, 1);
    var monthKey   = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM");
    var monthLabel = Utilities.formatDate(date, Session.getScriptTimeZone(), "MMM yyyy");

    var masukCount  = suratMasuk.filter(function(r) {
      return r["Tanggal Terima"] && r["Tanggal Terima"].toString().startsWith(monthKey);
    }).length;

    var keluarCount = suratKeluar.filter(function(r) {
      return r["Tanggal Surat"] && r["Tanggal Surat"].toString().startsWith(monthKey);
    }).length;

    months.push({
      label:  monthLabel,
      masuk:  masukCount,
      keluar: keluarCount
    });
  }

  return months;
}

// ===================================================================================
// LAPORAN
// ===================================================================================

function getLaporan(params) {
  try {
    var jenis       = params.jenis       || "Semua";
    var tanggalAwal = params.tanggalAwal || "";
    var tanggalAkhir = params.tanggalAkhir || "";

    var dataMasuk  = [];
    var dataKeluar = [];

    if (jenis === "Semua" || jenis === "Masuk") {
      dataMasuk = getSheetData(SHEET_SURAT_MASUK);
      if (tanggalAwal) {
        dataMasuk = dataMasuk.filter(function(r) { return r["Tanggal Terima"] >= tanggalAwal; });
      }
      if (tanggalAkhir) {
        dataMasuk = dataMasuk.filter(function(r) { return r["Tanggal Terima"] <= tanggalAkhir; });
      }
    }

    if (jenis === "Semua" || jenis === "Keluar") {
      dataKeluar = getSheetData(SHEET_SURAT_KELUAR);
      if (tanggalAwal) {
        dataKeluar = dataKeluar.filter(function(r) { return r["Tanggal Surat"] >= tanggalAwal; });
      }
      if (tanggalAkhir) {
        dataKeluar = dataKeluar.filter(function(r) { return r["Tanggal Surat"] <= tanggalAkhir; });
      }
    }

    return {
      success: true,
      data: {
        suratMasuk:  dataMasuk,
        suratKeluar: dataKeluar,
        totalMasuk:  dataMasuk.length,
        totalKeluar: dataKeluar.length
      }
    };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data laporan: " + error.message };
  }
}

// ===================================================================================
// MANAJEMEN USERS
// ===================================================================================

function getUsers(params) {
  try {
    var data = getSheetData(SHEET_USERS);
    // Hapus kolom password sebelum dikirim ke frontend
    data = data.map(function(row) {
      return {
        username:    row["Username"],
        namaLengkap: row["Nama Lengkap"],
        role:        row["Role"],
        status:      row["Status"]
      };
    });
    return { success: true, data: data };
  } catch (error) {
    return { success: false, message: "Gagal mengambil data pengguna: " + error.message };
  }
}

function addUser(params) {
  try {
    var sheet = getSheet(SHEET_USERS);
    var data  = sheet.getDataRange().getValues();

    // Cek apakah username sudah ada
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === params.username.toString().trim()) {
        return { success: false, message: "Username sudah digunakan." };
      }
    }

    var newRow = [
      params.username    || "",
      params.password    || "",
      params.namaLengkap || "",
      params.role        || "Operator",
      params.status      || "Aktif"
    ];

    sheet.appendRow(newRow);

    return { success: true, message: "Pengguna berhasil ditambahkan." };
  } catch (error) {
    return { success: false, message: "Gagal menambahkan pengguna: " + error.message };
  }
}

function updateUser(params) {
  try {
    var sheet = getSheet(SHEET_USERS);
    var data  = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === params.username.toString().trim()) {
        var rowNum = i + 1;
        if (params.password && params.password.trim() !== "") {
          sheet.getRange(rowNum, 2).setValue(params.password);
        }
        sheet.getRange(rowNum, 3).setValue(params.namaLengkap || data[i][2]);
        sheet.getRange(rowNum, 4).setValue(params.role        || data[i][3]);
        sheet.getRange(rowNum, 5).setValue(params.status      || data[i][4]);
        return { success: true, message: "Pengguna berhasil diperbarui." };
      }
    }

    return { success: false, message: "Pengguna tidak ditemukan." };
  } catch (error) {
    return { success: false, message: "Gagal memperbarui pengguna: " + error.message };
  }
}

function deleteUser(params) {
  try {
    var sheet = getSheet(SHEET_USERS);
    var data  = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === params.username.toString().trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Pengguna berhasil dihapus." };
      }
    }

    return { success: false, message: "Pengguna tidak ditemukan." };
  } catch (error) {
    return { success: false, message: "Gagal menghapus pengguna: " + error.message };
  }
}

// ===================================================================================
// FUNGSI INISIALISASI - Jalankan sekali untuk setup sheet awal
// ===================================================================================

function initializeSpreadsheet() {
  var ss = getSpreadsheet();

  // Setup Sheet Surat Masuk
  var sheetMasuk = ss.getSheetByName(SHEET_SURAT_MASUK);
  if (!sheetMasuk) {
    sheetMasuk = ss.insertSheet(SHEET_SURAT_MASUK);
  }
  var headersMasuk = [
    "ID", "Nomor Surat", "Tanggal Surat", "Tanggal Terima",
    "Pengirim", "Perihal", "Kategori", "Ditujukan Kepada",
    "Status", "Keterangan", "Link Lampiran", "File Upload", "Dibuat Oleh", "Tanggal Input",
    "Diteruskan Ke", "Status Baca", "Catatan Rektor"
  ];
  sheetMasuk.getRange(1, 1, 1, headersMasuk.length).setValues([headersMasuk]);

  // Setup Sheet Surat Keluar
  var sheetKeluar = ss.getSheetByName(SHEET_SURAT_KELUAR);
  if (!sheetKeluar) {
    sheetKeluar = ss.insertSheet(SHEET_SURAT_KELUAR);
  }
  var headersKeluar = [
    "ID", "Nomor Surat", "Tanggal Surat", "Tujuan",
    "Perihal", "Kategori", "Penandatangan", "Status",
    "Keterangan", "Link Lampiran", "File Upload", "Dibuat Oleh", "Tanggal Input"
  ];
  sheetKeluar.getRange(1, 1, 1, headersKeluar.length).setValues([headersKeluar]);

  // Setup Sheet Users
  var sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
  }
  var headersUsers = ["Username", "Password", "Nama Lengkap", "Role", "Status"];
  sheetUsers.getRange(1, 1, 1, headersUsers.length).setValues([headersUsers]);

  // Tambahkan akun admin default
  var existingUsers = sheetUsers.getDataRange().getValues();
  if (existingUsers.length <= 1) {
    sheetUsers.appendRow(["admin", "admin123", "Administrator UBMG", "Admin", "Aktif"]);
  }

  Logger.log("Spreadsheet berhasil diinisialisasi.");
}

function testDrivePermission() {
  try {
    var folderName = "TEST_UBMG_PERMISSION_TEMP";
    var root = DriveApp.getRootFolder();
    var tempFolder = root.createFolder(folderName);
    tempFolder.setTrashed(true); // langsung hapus
    return "Izin Google Drive penuh berhasil diberikan!";
  } catch (e) {
    return "Error: " + e.message;
  }
}

function updateDisposisi(params) {
  try {
    var sheet = getSheet(SHEET_SURAT_MASUK);
    var data  = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === params.id.toString()) {
        var rowNum = i + 1;
        var headers = data[0];
        
        var colStatusBaca = -1;
        var colCatatanRektor = -1;
        var colStatus = -1;
        
        for (var h = 0; h < headers.length; h++) {
          var headerName = headers[h].toString().trim();
          if (headerName === "Status Baca") colStatusBaca = h + 1;
          if (headerName === "Catatan Rektor") colCatatanRektor = h + 1;
          if (headerName === "Status") colStatus = h + 1;
        }
        
        if (colStatusBaca > -1 && params.statusBaca !== undefined) sheet.getRange(rowNum, colStatusBaca).setValue(params.statusBaca);
        if (colCatatanRektor > -1 && params.catatanRektor !== undefined) sheet.getRange(rowNum, colCatatanRektor).setValue(params.catatanRektor);
        if (colStatus > -1 && params.status !== undefined) sheet.getRange(rowNum, colStatus).setValue(params.status);
        
        return { success: true, message: "Disposisi berhasil diperbarui." };
      }
    }
    return { success: false, message: "Surat tidak ditemukan." };
  } catch (error) {
    return { success: false, message: "Gagal memperbarui disposisi: " + error.message };
  }
}
