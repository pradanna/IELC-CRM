# Aturan Kategori Task CRM (Dashboard & Otomatisasi)

Dokumen ini menjelaskan kategori tugas (*Tasks*) yang masuk ke dalam dashboard CRM dan bagaimana sistem mendeteksi serta menghasilkan tugas-tugas tersebut.

---

## 1. Jenis Task di CRM Dashboard

Di dalam Dashboard CRM (`FetchCrmDashboardData.php`), data tugas yang ditampilkan sebagai **"Immediate Tasks"** dibagi menjadi dua kategori utama:

### A. Manual Tasks (`type: manual`)
Ini adalah tugas yang tercatat secara fisik di database pada tabel `tasks`.
* **Sumber:** Dibuat secara manual oleh staf untuk Lead tertentu, atau dihasilkan secara otomatis oleh command penjadwal (Cron Job).
* **Kriteria Masuk Dashboard:**
  * Status tugas belum selesai (`is_completed = false`).
  * Tanggal jatuh tempo tugas kurang dari atau sama dengan 7 hari ke depan (`due_date <= now + 7 days`).
* **Filter Hak Akses (Role-based):**
  * Jika peran pengguna adalah `frontdesk`, tugas akan difilter hanya untuk Lead yang dibuat (`created_by`) atau dimiliki (`owner_id`) oleh pengguna tersebut.

### B. Follow-up Reminders / Silent Leads (`type: fup_reminder`)
Ini adalah tugas pengingat yang dihasilkan secara dinamis di memori saat dashboard dimuat. Tugas ini tidak membuat baris baru di tabel `tasks` secara langsung, melainkan mendeteksi Lead yang pasif.
* **Sumber:** Deteksi otomatis Lead tanpa aktivitas baru.
* **Kriteria Masuk Dashboard:**
  * Fase Lead saat ini memiliki status `'prospective'` (prospektif).
  * Jumlah follow-up saat ini (`follow_up_count`) kurang dari batas maksimal (`fup_max_attempts`, bawaan: 7 kali).
  * Tidak ada aktivitas baru (`last_activity_at`) selama minimal `fup_task_trigger_days` (bawaan: 4 hari) dan maksimal 30 hari.
* **Filter Hak Akses (Role-based):**
  * Sama seperti tugas manual, jika peran pengguna adalah `frontdesk`, pengingat ini hanya muncul untuk Lead milik pengguna tersebut.

---

## 2. Pemicu Tugas Otomatis via Cron Job (`app:check-lead-inactivity`)

Sistem memiliki *Console Command* Laravel `app:check-lead-inactivity` yang berjalan di latar belakang untuk memantau keaktifan Lead dan membuat tugas di tabel `tasks`.

* **Fungsi:** Memeriksa Lead yang tidak memiliki aktivitas baru dalam rentang hari tertentu dan membuatkan baris tugas fisik.
* **Kriteria Pemeriksaan:**
  * **Pengecualian Fase:** Lead yang berada dalam fase `enrollment` (sudah daftar/daftar ulang) dan `cold-leads` (lead dingin) dikecualikan dari pengecekan ini.
  * **Kategori Ketidakaktifan:**
    1. **Tidak aktif selama tepat 4 hari:** Membuat tugas baru dengan judul `Follow-up Reminder: 4 Days Inactive` (Prioritas: Medium).
    2. **Tidak aktif selama tepat 7 hari:** Membuat tugas baru dengan judul `Follow-up Reminder: 7 Days Inactive` (Prioritas: High).
  * **Pencegahan Duplikasi:** Sistem akan memeriksa apakah sudah ada tugas belum selesai dengan judul yang sama sebelum membuat tugas baru.
