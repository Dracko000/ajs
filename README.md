# AJS - Antar Jemput Siswa (Shuttle Platform)

AJS adalah ekosistem aplikasi berbasis Web (PWA) yang dirancang khusus untuk memfasilitasi layanan transportasi antar-jemput siswa sekolah dasar (SD) secara aman, terintegrasi, dan profesional.

## 🚀 Fitur Utama

### 1. Sistem Keamanan & Verifikasi
*   **Vetting Driver Ketat**: Pendaftaran driver melalui sistem multi-step dengan wajib unggah KTP, SIM, STNK, dan SKCK (Surat Keterangan Catatan Kepolisian).
*   **ACC Admin**: Setiap driver harus divalidasi dan diaktifkan secara manual oleh Admin melalui Dashboard sebelum bisa mulai bekerja.
*   **Live Child Tracking**: Orang tua dapat memantau pergerakan ojek secara real-time di peta saat anak sedang dalam perjalanan.
*   **Verified Safe Badge**: Indikator visual untuk memastikan driver telah terverifikasi secara resmi.

### 2. Manajemen Operasional (Manifest)
*   **Fixed Routes**: Sistem rute tetap berdasarkan jadwal masuk dan pulang sekolah.
*   **Driver Tetap**: Siswa ditugaskan ke Driver yang sama setiap harinya untuk membangun rasa percaya.
*   **Check-in/Check-out**: Tombol status perjalanan yang mengirimkan notifikasi real-time ke HP orang tua saat anak dijemput dan sampai tujuan.

### 3. Ekosistem Keuangan & SaaS
*   **Top-Up Midtrans**: Orang tua dapat mengisi saldo dompet melalui QRIS, Virtual Account, dan E-Wallet secara otomatis.
*   **Withdrawal Xendit**: Driver dapat mencairkan penghasilan mereka ke 140+ bank di Indonesia secara real-time.
*   **Model SaaS (Zero Commission)**: Driver tidak dipotong komisi per transaksi, melainkan membayar biaya sewa aplikasi flat (Rp 20.000/minggu) yang dipotong otomatis oleh sistem.

---

## 📂 Struktur Proyek

*   **`/backend`**: Core API menggunakan **Laravel 13**, PostgreSQL + PostGIS, dan Laravel Reverb (WebSockets).
*   **`/pwa-frontend`**: Aplikasi untuk **Orang Tua/Siswa** (React + Leaflet Maps).
*   **`/pwa-driver`**: Aplikasi untuk **Mitra Driver** (React + Manifest System).
*   **`/pwa-admin`**: Dashboard **Pengelola/Admin** untuk monitoring, verifikasi berkas, dan penugasan driver.

---

## 🛠️ Panduan Instalasi Lokal

### Prerequisites
*   PHP 8.2+ & Composer
*   Node.js & NPM
*   PostgreSQL dengan ekstensi **PostGIS**
*   Ngrok (untuk pengetesan Webhook Midtrans)

### 1. Setup Backend
```bash
cd backend
cp .env.example .env
# Atur kredensial DB, Midtrans, dan Xendit di .env
composer install
php artisan migrate
php artisan reverb:start
php artisan serve
```

### 2. Setup Frontend (User, Driver, Admin)
Lakukan hal yang sama di setiap folder PWA (`pwa-frontend`, `pwa-driver`, `pwa-admin`):
```bash
npm install
npm run dev
```

---

## 🌍 Integrasi Pihak Ketiga

1.  **Midtrans**: Gateway pembayaran masuk (Top-up).
2.  **Xendit**: Gateway pengiriman uang (Withdrawal).
3.  **OpenStreetMap (Leaflet)**: Layanan peta gratis & open-source.
4.  **Ngrok**: Terowongan Webhook untuk sinkronisasi transaksi lokal.

---

## 🛡️ Keamanan Data
File sensitif seperti `.env` dan folder `vendor` telah dikecualikan dari repository melalui `.gitignore` untuk melindungi kredensial database dan API Keys Anda.

**AJS - Menyiapkan perjalanan aman untuk buah hati.** 🚀🚩
