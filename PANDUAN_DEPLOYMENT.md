# 🚀 Panduan Lengkap Deployment Sistem Surat Masuk & Keluar UBMG

Sistem ini menggunakan arsitektur *Decoupled*: Database & API menggunakan Ekosistem Google, sedangkan Tampilan (Frontend) di-hosting secara gratis di GitHub Pages. Ikuti panduan ini langkah demi langkah secara berurutan.

---

## TAHAP 1: Persiapan Database (Google Spreadsheet)

Langkah pertama adalah membuat "rumah" untuk menyimpan data surat Anda.

1. Buka browser dan login ke akun Google Anda.
2. Buka **Google Sheets** (https://sheets.google.com).
3. Buat file Spreadsheet kosong (Blank) baru.
4. Beri nama file tersebut, misalnya: **"Database Surat UBMG"**.
5. Perhatikan URL di bagian atas browser Anda. URL-nya akan terlihat seperti ini:
   `https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit#gid=0`
6. **COPY (Salin)** kode unik yang berada di antara `/d/` dan `/edit`.
   *Dalam contoh di atas, yang disalin adalah: `1A2B3C4D5E6F7G8H9I0J`*
7. Simpan kode (Spreadsheet ID) ini di Notepad karena akan kita gunakan di Tahap 2.

> [!TIP]
> Anda tidak perlu membuat nama-nama kolom atau tabel (sheet) secara manual. Sistem akan membuatnya secara otomatis di Tahap 2.

---

## TAHAP 2: Setup API & Backend (Google Apps Script)

Tahap ini adalah memasang logika penghubung (API) agar website bisa membaca dan menulis data ke Spreadsheet Anda.

1. Buka halaman **Google Apps Script** (https://script.google.com).
2. Klik tombol **"New Project"** (Proyek Baru).
3. Beri nama proyek di pojok kiri atas, misalnya: **"API Surat UBMG"**.
4. Di area kode (editor), hapus semua kode bawaan yang ada `function myFunction() { ... }`.
5. Buka file `Code.gs` yang ada di folder komputer Anda (di folder Web Surat Masuk & Keluar UBM). Copy **seluruh** isi teks di dalamnya.
6. Paste (Tempel) kode tersebut ke dalam editor Google Apps Script.
7. Cari baris kode berikut (berada di bagian atas kode):
   ```javascript
   var SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_ANDA";
   ```
8. Ganti teks `GANTI_DENGAN_ID_SPREADSHEET_ANDA` dengan **Spreadsheet ID** yang sudah Anda copy di Tahap 1. Pastikan tanda kutip (`""`) tidak terhapus.
9. Tekan tombol **Save** (ikon disket) atau `Ctrl + S`.

### 2.1 Menjalankan Inisialisasi (Membuat Tabel Otomatis)
1. Di bagian atas editor Apps Script, ada menu *dropdown* untuk memilih fungsi (biasanya tertulis `doPost`). Klik dropdown tersebut dan pilih fungsi **`initializeSpreadsheet`**.
2. Klik tombol **Run** (Jalankan).
3. Google akan memunculkan popup "Authorization required".
   - Klik **Review permissions**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan "Google hasn’t verified this app", klik **Advanced** (Lanjutan) di bagian bawah, lalu klik **Go to API Surat UBMG (unsafe)**.
   - Klik **Allow** (Izinkan).
4. Jika berhasil, akan muncul tulisan "Execution completed" di bagian bawah. 
   *(Sekarang, coba cek Spreadsheet Anda di tab baru. Sheet SuratMasuk, SuratKeluar, dan Users sudah otomatis terbuat, dan akun admin default sudah ditambahkan!).*

### 2.2 Deploy API agar bisa diakses Website
1. Di kanan atas halaman Apps Script, klik tombol biru **"Deploy"**, lalu pilih **"New deployment"**.
2. Klik ikon roda gigi ⚙️ di sebelah "Select type", lalu centang **"Web app"**.
3. Isi deskripsi, misalnya "Versi 1".
4. Pada opsi **Execute as**, PASTIKAN Anda memilih **"Me (email.anda@gmail.com)"**.
5. Pada opsi **Who has access**, PASTIKAN Anda memilih **"Anyone"** (Siapa saja).
6. Klik tombol **Deploy**.
7. Akan muncul popup berisi **Web app URL** (dimulai dengan `https://script.google.com/macros/s/.../exec`).
8. **COPY (Salin)** URL tersebut dan simpan di Notepad. Ini adalah nyawa dari website Anda.

---

## TAHAP 3: Menghubungkan Frontend ke API

Sekarang kita harus memberi tahu file di komputer Anda ke mana mereka harus mengirim data.

1. Buka folder proyek website di komputer Anda (`Web Surat Masuk & Keluar UBM`).
2. Masuk ke dalam folder `js`, lalu buka file `api.js` menggunakan text editor (Notepad, VS Code, atau Sublime Text).
3. Cari baris pertama yang berisi:
   ```javascript
   var API_URL = "GANTI_DENGAN_URL_APPS_SCRIPT_WEB_APP";
   ```
4. Ganti teks `GANTI_DENGAN_URL_APPS_SCRIPT_WEB_APP` dengan **Web app URL** yang Anda dapatkan di Tahap 2.2.
5. Simpan (Save) file `api.js`.

> [!IMPORTANT]
> Saat ini, website Anda sudah berfungsi penuh. Anda bisa membuktikannya dengan membuka file `index.html` (klik dua kali) di komputer Anda, lalu coba login menggunakan **Username: `admin`** dan **Password: `admin123`**.

---

## TAHAP 4: Hosting Website ke Internet via GitHub Pages

Agar website bisa diakses oleh orang lain (dosen, staf, dll) melalui link internet, kita perlu meng-hosting file HTML/CSS/JS tersebut ke GitHub secara gratis.

### 4.1 Membuat Repository di GitHub
1. Buka [GitHub](https://github.com/) dan buat akun jika belum punya. Jika sudah, login.
2. Di halaman utama GitHub, klik tanda **"+"** di pojok kanan atas, pilih **"New repository"**.
3. Di bagian **Repository name**, isi dengan nama website, misalnya: `sistem-surat-ubmg`.
4. Pastikan opsi **"Public"** terpilih.
5. Jangan centang *Add a README file*. Langsung saja klik tombol hijau **"Create repository"**.

### 4.2 Upload File ke GitHub (Cara Termudah via Browser)
1. Setelah repository terbuat, Anda akan melihat halaman "Quick setup". Cari kalimat *"..or pushing an existing repository from the command line"*. Tepat di bawah kotak kodenya, ada tulisan kecil: **"uploading an existing file"**. Klik tulisan (link) tersebut.
2. Anda akan dibawa ke halaman upload.
3. Buka folder `Web Surat Masuk & Keluar UBM` di komputer Anda (Gunakan File Explorer/Finder).
4. **Blok SEMUA isi folder tersebut** (semua file html, folder css, folder js, file markdown).
5. Tarik (Drag and Drop) semua file tersebut ke tengah layar browser GitHub Anda.
6. Tunggu proses upload selesai.
7. Scroll ke bawah ke kotak *Commit changes*, klik tombol hijau **"Commit changes"**. Proses ini memakan waktu beberapa saat.

### 4.3 Mengaktifkan GitHub Pages (Mendapatkan Link Website)
1. Setelah file berhasil masuk ke GitHub, klik tab **"Settings"** (Ikon roda gigi) di bagian atas halaman repository Anda.
2. Di menu sidebar sebelah kiri, scroll ke bawah dan klik **"Pages"**.
3. Di bagian **Build and deployment**:
   - Source: Biarkan `Deploy from a branch`.
   - Branch: Klik tombol dropdown yang bertuliskan `None`, ubah menjadi **`main`** (atau `master`). Biarkan folder di sebelahnya tetap `/ (root)`.
4. Klik tombol **Save**.
5. **Selesai!** GitHub sedang memproses website Anda. 
6. Refresh (F5) halaman tersebut setelah 1-2 menit. Nanti akan muncul notifikasi di bagian atas: *"Your site is live at https://[username-github-anda].github.io/sistem-surat-ubmg"*
7. Klik link tersebut, dan website Surat UBMG Anda kini sudah online dan bisa diakses dari mana saja!

---

## Selamat! 🎉

Sistem Surat Masuk dan Keluar UBMG Anda sudah online. Jangan lupa, akun akses pertamanya adalah:
- **Username**: `admin`
- **Password**: `admin123`

*(Anda bisa menambah, menghapus, atau mengubah data pengguna melalui menu Pengaturan di dalam Dashboard nantinya).*
