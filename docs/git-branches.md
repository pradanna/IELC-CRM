# Git Branch Tracking Matrix

Dokumen ini digunakan untuk melacak riwayat pembuatan branch git, status pengerjaan, tujuan, serta penanggung jawab perubahan.

---

## 📊 Daftar Branch

| Nama Branch | Status | Target Merge | Deskripsi Perubahan |
|-------------|--------|--------------|---------------------|
| `develop` | Active / Base | - | Branch utama untuk proses pengembangan (development base) |
| `feature/online-branch` | ❌ Discarded | `develop` | Dibatalkan - Diputuskan untuk memindahkan kelas online ke Cabang Solo |
| `feature/student` | 🚧 Active | `develop` | Implementasi fitur-fitur dan penyesuaian terkait modul siswa (Student) |

---

## 🛠️ Riwayat Perubahan per Branch

### 1. `feature/online-branch` (DISCARDED / DELETED)
*   **Status:** Dibatalkan. Seluruh kelas online dipetakan ke Cabang Solo. Branch lokal dihapus.
*   **Berkas Dokumentasi:** (Dihapus / Tidak di-merge)

### 2. `feature/student`
*   **Tanggal Dibuat:** 2026-07-16
*   **Status:** ✅ Completed
*   **Daftar Berkas Terkait:**
    *   [StudentController.php](file:///c:/PROJECT/WEBSITE/IELC-CRM/app/Http/Controllers/Admin/Academic/StudentController.php) - Menggabungkan kueri kalkulasi statistik dashboard akademik ke dalam database retrieval index siswa.
    *   [AdminLayout.jsx](file:///c:/PROJECT/WEBSITE/IELC-CRM/resources/js/Layouts/AdminLayout.jsx) - Menghapus menu "Academic" terpisah dari sidebar dan memperbarui izin akses.
    *   [Dashboard.jsx](file:///c:/PROJECT/WEBSITE/IELC-CRM/resources/js/Pages/Admin/Academic/Dashboard.jsx) - Mengekspor komponen grafik/dashboard secara modular agar dapat dipakai ulang.
    *   [Index.jsx](file:///c:/PROJECT/WEBSITE/IELC-CRM/resources/js/Pages/Admin/Academic/Student/Index.jsx) - Menambahkan tab switcher premium ("Database Siswa" & "Statistik & Analisis") serta merender grafik dashboard secara inline.
    *   [LegacyStudentMigrationSeeder.php](file:///c:/PROJECT/WEBSITE/IELC-CRM/database/seeders/LegacyStudentMigrationSeeder.php) - Seeder migrasi data untuk membaca file CSV siswa & kelas secara otomatis.
