# Checklist Pengujian Modul Finance

Modul Finance menangani penentuan harga penawaran (*Price Master*), pembuatan tagihan (*Invoice*), pencetakan PDF tagihan, dan pemrosesan pembayaran pembayaran yang memicu promosi lead menjadi siswa aktif. Gunakan lembar uji berikut saat melakukan verifikasi fitur Finance.

---

## 🏷️ 1. Pengelolaan Master Harga (Price Master)

- [ ] **Pembuatan Master Harga:** Buat item harga baru di menu Price Master (misal: "IELTS Course Pack 12 Sessions", nominal: Rp 2.400.000).
- [ ] **Validasi Nominal:** Coba masukkan nominal minus atau kosong. Pastikan sistem memunculkan validasi error.
- [ ] **Pembaruan Harga:** Edit nama atau nominal harga. Pastikan data ter-update di database `price_masters`.
- [ ] **Penghapusan (Soft Delete):** Hapus item harga. Pastikan data tidak tampil di daftar aktif tetapi masih ada di database dengan kolom `deleted_at` terisi (mencegah data lama di invoice yang sudah terbit menjadi rusak).

---

## 🧾 2. Pembuatan Tagihan (Generate Invoice)

- [ ] **Form Pembuatan Invoice:** Akses form pembuatan invoice baru untuk salah satu Lead.
- [ ] **Pilihan Kelas:** Pilih kelas belajar (`study_class_id`) yang ditargetkan untuk calon siswa/siswa tersebut.
- [ ] **Rincian Item (Invoiced Items):**
    - [ ] **Dari Master Harga:** Pilih item dari master harga. Pastikan kolom deskripsi dan harga satuan otomatis terisi sesuai database.
    - [ ] **Input Manual:** Tambahkan baris baru dan isi nama item serta harga secara manual (tanpa memilih Price Master). Pastikan sistem mengizinkannya (untuk biaya tambahan khusus).
- [ ] **Kalkulasi Subtotal:** Ubah kuantitas (*quantity*) pada baris item (misal: qty 2, harga satuan Rp 150.000). Pastikan subtotal otomatis terhitung Rp 300.000.
- [ ] **Diskon Otomatis Sibling:** Pilih Lead yang memiliki relasi saudara (*sibling*). Pastikan diskon 10% terhitung otomatis dan tertera pada ringkasan modal.
- [ ] **Invoice Placement Test Mandiri:** Buat invoice tanpa memilih kelas (*study_class_id* dikosongkan). Pastikan sistem memproses tanpa error dan item `Placement Test Fee` terisi otomatis saat dibuat dari Tab Placement Test.
- [ ] **Pembatalan Otomatis Re-Invoice:** Terbitkan invoice baru untuk Lead/Student yang masih memiliki invoice `pending`. Pastikan invoice lama otomatis berubah statusnya menjadi `cancelled` dengan badge berwarna merah.
- [ ] **Kalkulasi Total Tagihan:** Tambahkan beberapa item. Pastikan total keseluruhan (*total_amount*) adalah jumlah dari semua subtotal secara tepat.
- [ ] **Simpan Tagihan:** Simpan invoice.
    - [ ] Pastikan tersimpan di tabel `invoices` dan `invoiced_items`.
    - [ ] Pastikan status awal adalah `pending` dan `invoice_number` dibuat otomatis dengan format unik.
    - [ ] Pastikan field `due_date` terisi sesuai pilihan di form.

---

## 🔎 3. Tampilan Daftar, Magic Link & Filter Invoice

- [ ] **Pencarian:** Cari invoice berdasarkan nomor invoice (`invoice_number`) atau nama lead/siswa. Pastikan data yang cocok tampil.
- [ ] **Filter Status:** Saring berdasarkan status: `pending`, `paid`, atau `cancelled`. Pastikan status `cancelled` tampil dengan badge merah (`bg-red-50 text-red-600`).
- [ ] **Filter Tipe Invoice:** Filter berdasarkan `Semua Tipe`, `New Join`, `Paket Lanjut`, `Rejoin`, dan `Placement Test`. Pastikan hasil pencarian sesuai kriteria.
- [ ] **Magic Link & WhatsApp Sharing:** Klik "Copy Magic Link" atau "Kirim via WhatsApp". Pastikan link mengarah ke URL publik `/invoice/{id}` dan pesan WhatsApp terformat dengan rapi.
- [ ] **Tab Placement Test Billing Center:** Buka Tab Placement Test di Billing Center. Pastikan seluruh Lead di fase `placement-test` tampil dan tombol aksinya dinamai "Generate Invoice".
- [ ] **Filter Branch:** Saring invoice per cabang (untuk user Superadmin). Pastikan hanya menampilkan invoice milik cabang terpilih.
- [ ] **Hak Akses Peran (Role RBAC):**
    - [ ] Login sebagai `marketing`. Pastikan memiliki akses penuh untuk melihat, membuat, dan memproses pembayaran invoice.
    - [ ] Login sebagai `frontdesk`. Pastikan **tidak** bisa mengakses menu finance atau membuat invoice (atau hanya bisa melihat read-only jika diperbolehkan).

---

## 📄 4. Unduh & Cetak PDF Invoice (dompdf)

- [ ] **Tombol Download/Stream:** Klik tombol "Cetak PDF" atau "Download PDF" pada baris invoice.
- [ ] **Kesesuaian Tampilan:** Pastikan PDF terbuka di tab baru atau terunduh secara langsung.
- [ ] **Verifikasi Isi PDF:**
    - [ ] Logo dan nama lembaga kursus (IELC).
    - [ ] Detail tagihan: nomor invoice, tanggal terbit, tanggal jatuh tempo.
    - [ ] Detail penerima: nama siswa/lead, no HP, alamat/cabang.
    - [ ] Tabel item tagihan: nama layanan, kuantitas, harga satuan, subtotal, dan total keseluruhan.
    - [ ] Status invoice tercetak dengan jelas (misal cap "PENDING" atau "PAID").

---

## 💳 5. Pemrosesan Pembayaran & Konversi Lead (Process Payment)

Ini adalah alur integrasi krusial yang menyatukan modul CRM, Finance, dan Academic.

- [ ] **Proses Pembayaran:** Pilih invoice berstatus `pending` milik seorang **Lead** (belum menjadi Student), lalu klik tombol "Confirm Payment" / "Proses Pembayaran".
- [ ] **Verifikasi Perubahan Data (Database):** setelah pembayaran berhasil dikonfirmasi, periksa database untuk memastikan 3 hal ini terjadi secara otomatis:
    - [ ] **1. Status Invoice:** Status invoice berubah menjadi `paid` dan kolom `paid_at` terisi dengan timestamp waktu konfirmasi pembayaran.
    - [ ] **2. Promosi Lead ke Siswa (Action: PromoteLeadToStudent):**
        - [ ] Lead tersebut kini tercatat sebagai siswa aktif baru di tabel `students`.
        - [ ] Memiliki nomor induk siswa (`student_number`) yang dibuat unik otomatis.
        - [ ] Tanggal bergabung (`start_join`) terisi hari ini, dan status siswa adalah `active`.
    - [ ] **3. Pendaftaran Kelas (Action: EnrollStudent):**
        - [ ] Siswa baru tersebut otomatis terdaftar ke dalam kelas belajar (`study_classes`) yang sebelumnya dipilih pada invoice.
        - [ ] Terbuat record baru di tabel pivot `study_class_student` dengan siklus nomor `cycle_number = 1`.
- [ ] **Perubahan Status di Tampilan:** Muat ulang halaman detail lead tersebut. Pastikan lead tersebut status fasenya sudah berpindah ke fase `enrollment` (atau disesuaikan dengan alur bisnis yang disepakati).
