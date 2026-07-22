# Checklist Pengujian Modul Academic

Modul Academic mengelola data siswa aktif (*Students*), kelas belajar (*Study Classes*), penugasan guru, pendaftaran siswa ke kelas (*Enrollment*), siklus akademik (*Cycle*), dan absensi. Gunakan lembar uji berikut saat melakukan verifikasi fitur Academic.

---

## 👥 1. Manajemen Siswa Aktif (Student CRUD)

- [ ] **Tampilan Daftar Siswa:** Pastikan daftar menampilkan semua siswa yang ditarik dari tabel `students`.
- [ ] **Pencarian & Filter:** Cari berdasarkan nama atau `student_number`. Filter berdasarkan status siswa (`active`, `stop`, `rejoin`) dan cabang (`branch_id`).
- [ ] **Detail Profil Siswa:** Masuk ke halaman profil siswa. Pastikan informasi biodata (nama, no HP, email, tanggal lahir, nama wali) terisi lengkap dari data lead asalnya.
- [ ] **Ubah Status Siswa:** Ubah status siswa dari `active` menjadi `stop` (misal karena lulus/berhenti). Pastikan perubahan tersimpan di database dan siswa tidak muncul pada pilihan enrollment kelas aktif.

---

## 🏫 2. Pengelolaan Kelas Belajar (Study Class CRUD)

### A. Pembuatan Kelas Baru
- [ ] **Validasi Form:** Coba simpan kelas baru dengan data kosong. Pastikan muncul validasi error pada field wajib (*Nama Kelas*, *Branch*, *Guru/Instruktur*).
- [ ] **Input Jadwal & Auto-Kalkulasi (Frontend Hook Check):**
    - [ ] Masukkan tanggal mulai sesi (*start_session_date*) dan tentukan hari kelas pada pilihan checkbox `schedule_days` (misal centang "Senin" dan "Rabu").
    - [ ] Pastikan sistem otomatis memperbarui nilai jumlah pertemuan per minggu (*meetings_per_week*) menjadi `2` (sesuai jumlah hari yang dicentang).
    - [ ] Pastikan tanggal akhir sesi (*end_session_date*) otomatis terhitung maju sebanyak 12 kali pertemuan (atau sesuai *total_meetings* yang diinput) dari tanggal mulai dengan melompati hari selain Senin dan Rabu (proses ini diatur oleh hook `useClassScheduleCalculation`).
- [ ] **Pilihan Jenis Kelas (Online / Offline):** Pilih jenis kelas `Online` atau `Offline` saat membuat/mengedit kelas. Pastikan terdaftar dengan benar di database.
- [ ] **Badge Display & Filter Jenis Kelas:** Buka halaman manajemen kelas. Pastikan setiap kartu kelas menampilkan badge `ONLINE` atau `OFFLINE` dan filter jenis kelas menyaring data dengan tepat.
- [ ] **Penyimpanan Kelas:** Simpan kelas dan pastikan data tersimpan di tabel `study_classes` dengan `current_session_number = 1`.

### B. Pembaruan & Penghapusan Kelas
- [ ] **Edit Kelas:** Ubah guru pendamping atau jadwal kelas. Pastikan perubahan tersimpan.
- [ ] **Penghapusan (Soft Delete):** Hapus kelas. Pastikan data tidak muncul di halaman index kelas namun tetap aman di database dengan tanda `deleted_at`.

---

## 📝 3. Pendaftaran Siswa ke Kelas (Enrollment)

- [ ] **Form Pendaftaran Siswa:** Buka detail kelas belajar, pilih opsi "Tambah Siswa" atau "Daftarkan Siswa".
- [ ] **Pencarian Siswa:** Cari siswa aktif yang belum terdaftar di kelas lain (atau siswa yang bisa di-enroll).
- [ ] **Simpan Pendaftaran:** Tambahkan siswa tersebut ke kelas.
    - [ ] Pastikan baris baru terbuat di tabel pivot `study_class_student`.
    - [ ] Pastikan nomor siklus terisi (`cycle_number = 1` secara default).
- [ ] **Tampilan Daftar Kelas Siswa:** Buka profil siswa yang baru didaftarkan, pastikan nama kelas barunya tercantum pada daftar kelas yang ia ikuti.

---

## 🔄 4. Transisi Siklus Akademik (Reset Cycle)

Fitur ini digunakan saat sebuah periode belajar kelas telah berakhir (misal 12 pertemuan selesai) dan kelas akan dilanjutkan ke siklus berikutnya dengan daftar siswa yang sama atau diperbarui.

- [ ] **Aksi Reset Siklus:** Pilih salah satu kelas, klik tombol "Reset Siklus" / "Reset Class Cycle".
- [ ] **Konfirmasi Aksi:** Pastikan muncul dialog peringatan konfirmasi sebelum reset dijalankan.
- [ ] **Verifikasi Setelah Reset (Database & Tampilan):**
    - [ ] **Sesi Pertemuan:** Pastikan `current_session_number` pada kelas tersebut kembali ke angka `1`.
    - [ ] **Tanggal Sesi Baru:** Pastikan tanggal mulai kelas (`start_session_date`) dan tanggal berakhir (`end_session_date`) bergeser maju otomatis ke periode siklus berikutnya.
    - [ ] **Siklus Pivot Siswa (cycle_number):** Periksa tabel `study_class_student` untuk siswa-siswa di kelas tersebut. Pastikan nilai `cycle_number` mereka bertambah (misal dari `1` menjadi `2`).
    - [ ] **Histori Terjaga:** Pastikan data riwayat siklus sebelumnya tidak terhapus (tetap tersimpan di database sebagai arsip rekam jejak akademik siswa).

---

## 📅 5. Pencatatan Kehadiran (Attendance)

- [ ] **Lembar Absensi Harian:** Buka lembar kehadiran kelas untuk sesi pertemuan hari ini.
- [ ] **Tandai Kehadiran:** Tandai status kehadiran tiap siswa (hadir/izin/sakit/alpa).
- [ ] **Simpan Absensi:** Simpan lembar absensi. Pastikan data tersimpan di tabel attendance dan terelasi dengan benar ke siswa, kelas, dan nomor sesi saat ini.
- [ ] **Statistik Kehadiran:** Pastikan persentase kehadiran siswa terhitung dan tampil di profil detail siswa bersangkutan.
