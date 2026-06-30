# Checklist Pengujian Modul CRM

Modul CRM mengelola pendaftaran calon siswa (*Leads*), proses *placement test*, otomatisasi tugas pengingat, dan integrasi WhatsApp. Gunakan lembar uji berikut saat melakukan verifikasi fitur CRM.

---

## 📋 1. Manajemen Lead (Lead CRUD & Pipeline)

### A. Pembuatan Lead (Manual)
- [v] **Validasi Input:** Coba simpan lead kosong. Pastikan validasi error muncul untuk field wajib seperti *Nama*, *No. Telepon*, dan *Branch*.
- [v] **Simpan Lead:** Isi data lengkap (Nama, Panggilan, Telepon, Email, Asal Sekolah, Kelas, Branch, Owner, Source). Pastikan lead tersimpan ke database (`leads`).
- [V] **Nomor Lead Otomatis:** Periksa apakah `lead_number` terbuat secara otomatis dengan format unik.
- [V] **Pemberian Hak Kepemilikan (Owner):** Pastikan `owner_id` terasosiasi dengan user pengelola (marketing/staff) yang dipilih.
- [V] **Hubungan Wali (Guardians):** Tambahkan data orang tua/wali saat membuat lead. Pastikan data tersimpan di tabel `lead_guardians` dan terelasi dengan benar (`lead_id`).

### B. Pembaruan & Detail Lead
- [V] **Edit Data Lead:** Ubah nomor HP atau cabang lead. Pastikan data ter-update di database.
- [V] **Catatan Aktivitas:** Setiap kali lead diedit, ditambahkan followup, atau dipindahkan fasenya, pastikan ada baris log baru di tabel `lead_activities`.
- [V] **Relasi Lead (Sibling/Kakak-Adik):** Hubungkan dua lead sebagai saudara di panel relasi. Pastikan data tersimpan di `lead_relationships`.

### C. Kanban Board (Pipeline Transition)
- [V] **Tampilan Kolom:** Pastikan kolom Kanban terbagi berdasarkan fase lead (`lead_phases`) yang ada di database.
- [V] **Drag & Drop:** Geser kartu lead dari satu kolom ke kolom lain (misal dari *New Inquiry* ke *Follow-up*). Pastikan kartu berpindah secara visual.
- [V] **Sync ke Database:** Muat ulang (*refresh*) halaman setelah drag & drop. Pastikan posisi fase lead tetap tersimpan (memanggil route `admin.crm.leads.update-phase` dengan benar).
- [V] **Visibilitas Kanban & List:** Login sebagai `frontdesk` atau peran staf lainnya. Pastikan semua lead tetap terlihat di Kanban Board maupun List View, meskipun lead tersebut memiliki `owner` (PIC) yang berbeda.

---

## 📝 2. Formulir Registrasi Mandiri (Public Self-Registration)

### A. Pengisian Form oleh Publik
- [v] **Akses Halaman:** Buka halaman registrasi publik `/register-lead` (atau rute publik yang disiapkan).
- [v] **Pengiriman Form:** Isi nama, no HP, cabang, dan data wali. Submit form.
- [v] **Penyimpanan Registrasi:** Pastikan data tersimpan di tabel `lead_registrations` dengan status `pending`.

### B. Approval / Rejection oleh Staf (Admin)
- [v] **Halaman Review:** Login sebagai `frontdesk`/`superadmin`. Masuk ke menu Registrasi Masuk. Pastikan registrasi baru berstatus `pending` terlihat di sana.
- [v] **Persetujuan (Approve):** Klik tombol Approve pada salah satu registrasi.
    - [v] Pastikan status registrasi berubah menjadi `approved`.
    - [v] Pastikan data terduplikasi ke tabel `leads` dan `lead_guardians` secara otomatis (memanggil action `ApproveLeadRegistration`).
- [v] **Penolakan (Reject):** Klik tombol Reject pada registrasi lain, masukkan alasan penolakan.
    - [v] Pastikan status registrasi berubah menjadi `rejected` dan menyimpan catatan admin.
    - [v] Pastikan data **tidak** dimasukkan ke tabel `leads`.

---

## ⏳ 3. Sistem Tugas (Tasks) & Otomatisasi Follow-up

### A. Follow-up Reminders (Silent Leads) - Dynamic Memori
- [v] **Deteksi Lead Pasif:** Cari lead di database yang berada pada fase `prospective`, dengan `follow_up_count` < 7, dan tidak memiliki aktivitas baru (`last_activity_at`) selama lebih dari 4 hari.
- [v] **Tampilan Dashboard:** Pastikan lead tersebut muncul di widget "Immediate Tasks" dengan tipe `fup_reminder` secara dinamis di memori tanpa perlu membuat baris baru di tabel `tasks`.
- [v] **Penyaringan Berbasis Owner:** Login sebagai `frontdesk` dengan user A. Pastikan pengingat follow-up dinamis (`fup_reminder`) yang muncul di dashboard hanyalah untuk Lead milik user A.

### B. Cron Job Otomatis (`app:check-lead-inactivity`) - Database Tasks
- [v] **Jalankan Command:** Di terminal, jalankan perintah `php artisan app:check-lead-inactivity`.
- [v] **Verifikasi Tugas 4 Hari:** Pastikan lead yang tidak aktif selama tepat 4 hari kini memiliki tugas fisik baru di database/tabel `tasks` bernama `Follow-up Reminder: 4 Days Inactive` (Prioritas: Medium).
- [ ] **Verifikasi Tugas 7 Hari:** Pastikan lead yang tidak aktif selama tepat 7 hari memiliki tugas fisik bernama `Follow-up Reminder: 7 Days Inactive` (Prioritas: High).
- [ ] **Pencegahan Duplikasi:** Jalankan command tersebut kembali. Pastikan tidak ada tugas dengan judul yang sama dibuat berulang kali untuk lead yang sama jika tugas sebelumnya belum selesai.
- [ ] **Kriteria Dashboard ("Immediate Tasks"):** Pastikan tugas inaktivitas yang terbentuk di database muncul di widget "Immediate Tasks" di dashboard.
- [ ] **Penyaringan Berbasis Owner:** Login sebagai `frontdesk` dengan user A. Pastikan tugas inaktivitas database yang tampil di widget "Immediate Tasks" dashboard hanyalah tugas untuk Lead yang dimiliki (`owner_id`) atau dibuat oleh user A.

---

## ✍️ 4. Ujian Online (Placement Test)

- [ ] **Pembuatan Paket Ujian:** Di menu Admin, buat paket ujian (`pt_exams`), tambahkan grup soal (Reading/Listening), masukkan soal (`pt_questions`) dan pilihan jawaban (`pt_question_options`).
- [ ] **Pembuatan Sesi (Session Token):** Buat sesi placement test untuk salah satu lead. Pastikan link ujian terbuat dengan token unik di tabel `pt_sessions`.
- [ ] **Mengakses Ujian:** Buka link ujian tersebut. Pastikan durasi pengerjaan berjalan mundur.
- [ ] **Submit Jawaban:** Jawab beberapa pertanyaan dan klik submit.
    - [ ] Pastikan jawaban tersimpan di tabel `pt_answers` dengan tanda `is_correct` sesuai kunci jawaban.
    - [ ] Pastikan session berubah status menjadi `completed`.
    - [ ] Pastikan total score terhitung otomatis dan tertera di detail session admin.
- [ ] **Waktu Habis (Expired):** Biarkan waktu ujian habis. Pastikan status pengerjaan otomatis berubah menjadi `expired` dan nilai tetap terhitung dari jawaban yang sempat tersimpan.

---

## 💬 5. Integrasi WhatsApp Gateway

- [ ] **Koneksi QR Code:** Buka tab integrasi WA di cabang tertentu (misal Solo). Jika belum tersambung, pastikan QR Code dari gateway Node.js muncul untuk di-scan.
- [ ] **Riwayat Chat:** Buka lead tertentu, klik tab WhatsApp. Pastikan 50 pesan terakhir termuat dengan benar dari SQLite gateway.
- [ ] **Kirim Pesan Teks:** Kirim pesan tes dari panel WhatsApp CRM. Pastikan pesan terkirim ke HP penerima dan log terbuat di `lead_activities`.
- [ ] **Rate Limit:** Coba kirim pesan secara beruntun dengan cepat. Pastikan jika melebihi batas (100 request/menit), sistem menampilkan peringatan rate limit dari gateway.
