# Architecture Decision Records (ADR)

> Dokumen ini mencatat keputusan teknis penting. Setiap agent WAJIB membaca ini sebelum membuat keputusan arsitektur.
> Format: **Keputusan → Alasan → Larangan / Implikasi**

---

## ADR-001: UUID sebagai Primary Key (Semua Tabel)

**Keputusan**: Semua tabel menggunakan UUID sebagai primary key.
**Alasan**: Keamanan — tidak expose sequential ID ke publik; aman untuk distributed system.
**Implikasi**:
- Selalu gunakan `$table->uuid('id')->primary()` di migration.
- Selalu tambahkan `->index()` pada foreign key UUID.
- Di Model: tambahkan `public $incrementing = false;` dan `protected $keyType = 'string';`.

---

## ADR-002: Action Pattern (bukan Service/Repository)

**Keputusan**: Business logic wajib di `app/Actions/{Module}/{Verb}{Entity}.php`.
**Alasan**: Atomic, single-responsibility, mudah di-test secara isolasi.
**Larangan**: Jangan taruh logic di Controller, Model, atau Event Listener.

---

## ADR-003: Inertia.js Full-Stack (bukan REST API + SPA)

**Keputusan**: Pakai Inertia.js sebagai jembatan Laravel ↔ React. Tidak ada public REST API.
**Alasan**: Development speed lebih cepat, tidak perlu JWT/token management, SSR siap pakai.
**Implikasi**: Data ke React HARUS melalui `Inertia::render()` + `JsonResource`. Tidak ada `response()->json()` untuk halaman.

---

## ADR-004: Tailwind CSS v4

**Keputusan**: Proyek menggunakan Tailwind CSS **v4** (bukan v3).
**Alasan**: Sudah setup dari awal, v4 lebih performant dan CSS-native.
**Larangan**:
- ❌ Jangan gunakan `tailwind.config.js` / `theme.extend` (syntax v3).
- ✅ Gunakan `@theme` di CSS dan CSS variables untuk kustomisasi.

---

## ADR-005: WhatsApp via Node.js Gateway (Baileys)

**Keputusan**: Integrasi WhatsApp menggunakan server Node.js terpisah berbasis Baileys.
**Alasan**: Baileys lebih stabil untuk multi-session WA daripada package PHP manapun.
**Implikasi**:
- Laravel berkomunikasi ke gateway via HTTP menggunakan env `WA_SERVER_URL`.
- Semua interaksi WA di-mirror ke `ActivityLog` untuk visibility di CRM.
- Agent **tidak boleh** install package PHP untuk WA tanpa diskusi dengan Kapten.

---

## ADR-006: Cabang Opsional pada Lead (Mendukung Pembelajaran Online)

**Keputusan**: Kolom `branch_id` pada tabel `leads` dan `lead_registrations` diubah menjadi nullable.
**Alasan**: Untuk mendukung pendaftaran dan pengelolaan Lead secara Online / Branchless (tidak terikat pada cabang fisik tertentu).
**Implikasi**:
- Kolom `branch_id` didefinisikan sebagai nullable di database migration.
- Logika backend dan frontend wajib menggunakan optional chaining (`branch?->name`) untuk menghindari `TypeError` ketika mengakses properti cabang dari Lead.

---

## ADR-007: Atribut Jenis Kelas (`type`: `online` / `offline`) pada Modul Academic

**Keputusan**: Penambahan kolom `type` (`'online'` / `'offline'`) pada tabel `study_classes`.
**Alasan**: Membedakan kelas fisik (cabang) dengan kelas daring secara eksplisit untuk kebutuhan filter, pencarian, dan visualisasi badge di dashboard.
**Implikasi**:
- Migration menambahkan kolom `type` dengan nilai bawaan `'offline'`.
- Model, Validation Form Request, API Resource, dan Query Service wajib menyertakan `type`.

---

## ADR-008: Pembatalan Otomatis Invoice Lama saat Re-Invoice & Invoice Placement Test Mandiri

**Keputusan**:
1. Saat invoice baru diterbitkan untuk Lead/Student yang sama, seluruh invoice lama berstatus `pending` otomatis diubah statusnya menjadi `cancelled`.
2. Invoice dapat diterbitkan tanpa memilih kelas (`study_class_id` nullable) untuk kasus *Placement Test Fee*.
**Alasan**:
1. Mencegah penumpukan tagihan aktif ganda untuk customer yang sama.
2. Memfasilitasi pendaftaran Placement Test yang belum memiliki alokasi kelas.
**Implikasi**:
- Action `GenerateInvoice` mengeksekusi query pembaruan status `cancelled` secara otomatis di awal transaksi.
- Status `cancelled` ditampilkan dengan badge warna merah (`bg-red-50 text-red-600 border-red-100`).
