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
*   **Model SaaS (Zero Commission)**: Driver tidak dipotong komisi per transaksi, mel membayar biaya sewa aplikasi flat (Rp 20.000/minggu) yang dipotong otomatis oleh sistem.

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

## 🚀 Panduan Deployment ke VPS (Ubuntu)

### 1. Persiapan Server
Update dan install paket yang dibutuhkan:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx postgresql postgresql-contrib postgis supervisor certbot python3-certbot-nginx php8.2-fpm php8.2-pgsql php8.2-curl php8.2-xml php8.2-mbstring php8.2-zip -y
```

### 2. Setup Database
```bash
sudo -u postgres psql
# Di dalam psql:
CREATE DATABASE ajs_production;
CREATE USER ajs_admin WITH PASSWORD 'password_anda';
GRANT ALL PRIVILEGES ON DATABASE ajs_production TO ajs_admin;
\c ajs_production
CREATE EXTENSION postgis;
\q
```

### 3. Clone Proyek & Install
```bash
cd /var/www
git clone https://github.com/Dracko000/ajs.git
cd ajs/backend
composer install --optimize-autoloader --no-dev
php artisan migrate --force
```

### 4. Konfigurasi Nginx
Buat file konfigurasi di `/etc/nginx/sites-available/ajs`:
*   Gunakan Nginx sebagai web server untuk Laravel API.
*   Gunakan Nginx sebagai **Reverse Proxy** untuk port 8080 (Laravel Reverb) agar mendukung `wss://`.
*   Arahkan domain berbeda (atau sub-folder) untuk ketiga PWA hasil build `npm run build`.

### 5. Konfigurasi Supervisor
Pastikan layanan Reverb dan Queue tetap hidup:
Lihat panduan lengkap di: [README_SUPERVISOR.md](./README_SUPERVISOR.md)

### 6. SSL (HTTPS)
Jalankan Certbot untuk keamanan transaksi:
```bash
sudo certbot --nginx -d api.ajsanda.com -d app.ajsanda.com
```

---

## 🌍 Integrasi Pihak Ketiga

1.  **Midtrans**: Gateway pembayaran masuk (Top-up).
2.  **Xendit**: Gateway pengiriman uang (Withdrawal).
3.  **OpenStreetMap (Leaflet)**: Layanan peta gratis & open-source.

---

## 🛡️ Keamanan Data
File sensitif seperti `.env` dan folder `vendor` telah dikecualikan dari repository melalui `.gitignore` untuk melindungi kredensial database dan API Keys Anda.

**AJS - Menyiapkan perjalanan aman untuk buah hati.** 🚀🚩
