# 💰 Tabunganku PRO - Smart Financial Tracker

Aplikasi pencatat tabungan bulanan modern, rapi, dan ergonomis berbasis web statis murni (**100% HTML, CSS, Vanilla JavaScript**). Siap di-deploy secara instan ke **GitHub Pages** tanpa perlu sewa server atau konfigurasi backend yang rumit.

![Tampilan Tabunganku](https://raw.githubusercontent.com/username/tabungan/main/preview.png) *(Opsional: Ganti dengan screenshot Anda)*

---

## ✨ Fitur Unggulan

1. **🎨 Dual Mode Tema (Hitam & Putih)**
   - **Mode Gelap (Dark Mode)**: Tema obsidian futuristik dengan aksen cahaya neon yang nyaman di mata.
   - **Mode Terang (Light Mode)**: Tema bersih, cerah, dan segar.
   - Pilihan tema otomatis tersimpan di memori browser.

2. **📱 100% Responsif di HP & Desktop**
   - Dioptimalkan untuk layar smartphone (*Mobile-First*).
   - Ukuran font input standar 16px untuk mencegah *auto-zoom* yang mengganggu pada browser iPhone (Safari).
   - Modal sinkronisasi bertransformasi menjadi *Bottom Sheet* yang nyaman diakses dengan satu jempol di HP.

3. **📊 Kartu Finansial & Rasio Tabungan Visual**
   - Menampilkan total saldo terkumpul, total pemasukan, dan penarikan periode terpilih.
   - **Fitur Privasi (Sensor Mata `👁️`)**: Sembunyikan nominal saldo menjadi `Rp ••••••••` saat berada di tempat umum.
   - **Bar Rasio Keuangan**: Grafik batang dinamis yang menghitung persentase arus tabungan (misal: *85% Tabungan / Sangat Sehat*).

4. **⚡ Ergonomi & Pintasan Input Cepat**
   - **Pintasan Nominal 1-Klik**: Tambahkan `+10 rb`, `+20 rb`, `+50 rb`, `+100 rb`, `+500 rb` tanpa repot mengetik angka nol.
   - **Tag Kategori Cepat**: Tombol instan keperluan seperti `Sisa Jajan`, `Gaji`, `Kebutuhan`, `Makan`, dan `Darurat`.
   - **Live Preview Rupiah**: Konfirmasi ejaan Rupiah secara *real-time* saat mengetik angka.

5. **📅 Filter Periode Rapi**
   - Dropdown pilihan **Bulan** (Januari s.d. Desember) dan **Tahun** (otomatis mendeteksi tahun data transaksi).
   - Tombol pintas **"📅 Bulan Ini"** dan **"🌐 Semua Riwayat"**.
   - Kolom pencarian instan berdasarkan nama keperluan/keterangan.

6. **☁️ Sinkronisasi Multi-Device (Data Tetap Sama di Semua HP/Laptop)**
   - **Opsi 1 (Cloud Otomatis via Firebase RTDB)**: Hubungkan HP dan Laptop ke database online gratis tanpa backend. Setiap ada transaksi baru, data langsung ter-update otomatis di semua perangkat.
   - **Opsi 2 (Transfer Cepat Tanpa Akun)**: Salin kode data teks untuk dikirim via WhatsApp ke HP lain, atau unduh & pulihkan file cadangan `.json`.
   - **Offline-First**: Data tetap tersimpan aman di `localStorage` meskipun tidak ada koneksi internet.

---

## 📁 Struktur File Modular

```text
tabungan/
├── .nojekyll          # Menghindari Jekyll builder agar GitHub Pages melayani file statis murni
├── index.html         # Struktur semantik HTML5, meta tag mobile, dan modal dialog
├── style.css          # Desain sistem CSS modern, tema gelap/terang, dan media queries HP
├── script.js          # Logika kalkulasi, DOM, filter bulan, privasi, dan cloud sync
└── README.md          # Dokumentasi proyek & panduan deployment
```

---

## 🚀 Panduan Deploy ke GitHub Pages (3 Langkah Mudah)

### Langkah 1: Buat Repositori di GitHub
1. Masuk ke akun [GitHub](https://github.com/).
2. Buat repositori baru (misalnya dengan nama: `tabunganku` atau `tabungan`).
3. Pilih visibilitas **Public**.

### Langkah 2: Upload Kode
Jalankan perintah berikut pada terminal di folder proyek ini:

```bash
git init
git add .
git commit -m "feat: inisialisasi aplikasi tabungan pro siap deploy"
git branch -M main
git remote add origin https://github.com/USERNAME/tabunganku.git
git push -u origin main
```
*(Ganti `USERNAME` dan `tabunganku` dengan nama akun dan repositori Anda)*

### Langkah 3: Aktifkan GitHub Pages
1. Di halaman repositori GitHub Anda, klik menu **Settings** (di tab atas).
2. Di sidebar sebelah kiri, pilih menu **Pages**.
3. Pada bagian **Build and deployment > Source**, pilih branch **`main`** dan folder **`/ (root)`**.
4. Klik tombol **Save**.
5. Tunggu sekitar 1–2 menit hingga muncul tautan hijau bertuliskan:
   > *Your site is live at https://USERNAME.github.io/tabunganku/*

Aplikasi web Anda kini sudah resmi online di internet dan bisa langsung dibuka dari browser HP maupun laptop!

---

## 📲 Cara Pasang di Layar Utama HP (Mirip Aplikasi Asli)

- **Android (Chrome)**: Buka tautan GitHub Pages Anda > Ketuk ikon titik tiga di kanan atas > Pilih **"Tambahkan ke Layar Utama" (Add to Home screen)**.
- **iPhone / iOS (Safari)**: Buka tautan di Safari > Ketuk tombol **Share** (kotak dengan panah ke atas) > Pilih **"Add to Home Screen"**.

---

## 📄 Lisensi
Dilisensikan di bawah lisensi terbuka [MIT](LICENSE). Bebas digunakan dan dikembangkan untuk keperluan pribadi maupun komersial.
