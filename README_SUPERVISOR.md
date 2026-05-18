# Panduan Konfigurasi Supervisor untuk AJS (Production)

Supervisor digunakan untuk memastikan layanan real-time (WebSocket) dan antrean (Queue) tetap berjalan di server VPS secara otomatis, bahkan jika server restart atau terjadi error.

## 1. Instalasi Supervisor (Ubuntu/Debian)
Jalankan perintah berikut di server Anda:
```bash
sudo apt update
sudo apt install supervisor
```

## 2. Konfigurasi Layanan AJS

### A. Konfigurasi WebSocket (Laravel Reverb)
Buat file konfigurasi baru:
```bash
sudo nano /etc/supervisor/conf.d/ajs-reverb.conf
```

Tempelkan kode berikut (Sesuaikan `/var/www/ajs/backend` dengan path di server Anda):
```ini
[program:ajs-reverb]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ajs/backend/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/ajs/backend/storage/logs/reverb.log
stopwaitsecs=3600
```

### B. Konfigurasi Antrean (Laravel Queue)
Sangat penting untuk memproses notifikasi dan matching driver di background.
```bash
sudo nano /etc/supervisor/conf.d/ajs-worker.conf
```

Tempelkan kode berikut:
```ini
[program:ajs-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ajs/backend/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/var/www/ajs/backend/storage/logs/worker.log
stopwaitsecs=3600
```

## 3. Menjalankan Supervisor
Setelah menyimpan file di atas, jalankan perintah berikut untuk mengaktifkan konfigurasi:

```bash
# Memberitahu supervisor ada konfigurasi baru
sudo supervisorctl reread

# Menjalankan layanan baru
sudo supervisorctl update

# Cek status layanan
sudo supervisorctl status
```

## 4. Perintah Berguna
- `sudo supervisorctl restart ajs-reverb`: Merestart WebSocket jika ada perubahan kode.
- `sudo supervisorctl stop ajs-reverb`: Menghentikan WebSocket.
- `sudo supervisorctl tail -f ajs-reverb`: Melihat log secara real-time untuk debug.

## 5. Catatan Penting
- **Keamanan**: Pastikan port `8080` sudah dibuka di firewall server Anda (`ufw allow 8080/tcp`).
- **SSL**: Jika menggunakan HTTPS, Anda perlu melakukan Reverse Proxy melalui Nginx agar WebSocket bisa diakses via `wss://`.
