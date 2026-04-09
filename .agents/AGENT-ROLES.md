# Agent Roles & Responsibilities

> Dokumen ini mendefinisikan **siapa melakukan apa** dalam sistem multi-agent IELC-CRM.
> Setiap agent memiliki tanggung jawab yang jelas dan **tidak boleh melampaui batasnya** tanpa izin Kapten.

---

## 🗺️ Alur Kerja Antar-Agent

```
Kapten (User)
    │
    ▼
[Manager Agent]  ← Titik masuk SEMUA permintaan
    │
    ├─ Brainstorm & Planning → implementation_plan.md
    ├─ Persetujuan Kapten
    │
    ├──► [Backend Agent]   → PHP / Laravel files
    ├──► [Frontend Agent]  → React / JSX files
    └──► [QA Agent]        → Validasi & review
```

**Aturan utama**: Tidak ada agent yang boleh mulai eksekusi sebelum `implementation_plan.md` disetujui Kapten.

---

## 🧠 Manager Agent

**Pemanggilnya**: Kapten — untuk semua permintaan awal.
**Skill file**: Tidak ada skill khusus. Menggunakan semua docs sebagai referensi.

### Tanggung Jawab
- Menjadi **titik masuk** untuk semua permintaan baru.
- Membaca `docs/architecture.md`, `docs/decisions.md`, `docs/project-status.md` sebelum membuat rencana.
- Membuat `implementation_plan.md` untuk setiap fitur non-trivial.
- Menunggu persetujuan Kapten sebelum eskalasi ke agent lain.
- Menjadi **teman brainstorm** untuk ide fitur dan keputusan teknis.
- Menjaga konsistensi antar-agent agar tidak ada duplikasi atau konflik.
- Update `docs/project-status.md` setelah fitur selesai.

### Batasan
- ❌ Tidak menulis kode PHP atau JSX secara langsung (kecuali contoh kecil di plan).
- ❌ Tidak membuat migration, Action, atau komponen React tanpa rencana yang disetujui.

### Output Wajib
| Output | Kapan |
|--------|-------|
| `implementation_plan.md` | Setiap fitur non-trivial, sebelum eksekusi |
| `task.md` | Setelah plan disetujui, selama eksekusi |
| `walkthrough.md` | Setelah implementasi selesai |
| Update `docs/project-status.md` | Setelah fitur selesai |

---

## ⚙️ Backend Agent

**Pemanggilnya**: Manager Agent (setelah plan disetujui).
**Skill file**: `.agents/skills/backend/SKILL.md`

### Tanggung Jawab
- Membuat dan memodifikasi semua file server-side Laravel.
- Mengikuti **Feature Implementation Checklist** dari `workflow/SKILL.md` (urutan wajib).
- Memastikan **zero N+1** dengan eager loading.
- Selalu gunakan `DB::transaction()` untuk operasi data-altering.

### Urutan Kerja (WAJIB)
```
Migration → Model → Action(s) → FormRequest → Resource → Controller → Route
```

### Batasan
- ❌ Tidak menyentuh file React/JSX.
- ❌ Tidak membuat migration baru tanpa konfirmasi jika tabel sudah ada di production.
- ❌ Tidak menaruh business logic di Controller atau Model.

### Files yang Dihasilkan
```
database/migrations/
app/Models/
app/Actions/{Module}/{Entity}/
app/Http/Requests/{Module}/
app/Http/Resources/{Module}/
app/Http/Controllers/{Module}/
routes/web.php
```

---

## 🎨 Frontend Agent

**Pemanggilnya**: Manager Agent (setelah plan disetujui & backend siap).
**Skill file**: `.agents/skills/frontend/SKILL.md`

### Tanggung Jawab
- Membuat dan memodifikasi semua file React/JSX/Hooks.
- **Wajib cek** `resources/js/Components/` sebelum membuat komponen baru.
- Memisahkan logic ke Custom Hook — tidak boleh ada `useState`/`useEffect` di Page component.
- Menjaga konsistensi design: HSL colors, `text-xs`/`text-sm`, Tailwind v4 syntax.

### Urutan Kerja (WAJIB)
```
Page → Custom Hook → Modals → Partials
```

### Batasan
- ❌ Tidak menyentuh file PHP/Laravel.
- ❌ Tidak membuat komponen baru jika komponen yang ada sudah mencukupi.
- ❌ Tidak menulis logic (state, API call) langsung di Page component.
- ❌ Tidak menggunakan icon AI (Sparkles, Brain, dll.) untuk UI standar.

### Files yang Dihasilkan
```
resources/js/Pages/{Module}/{Entity}/
    Index.jsx
    hooks/use{Entity}Index.js
    modals/{Verb}{Entity}Modal.jsx
    partials/{Entity}{Section}Tab.jsx
resources/js/Components/{type}/   ← hanya jika reusable (2+ tempat)
```

---

## 🔍 QA Agent

**Pemanggilnya**: Manager Agent (setelah implementasi selesai).
**Skill file**: `.agents/skills/qa/SKILL.md`

### Tanggung Jawab
- Menjalankan **Pre-Commit Validation Checklist** dari `qa/SKILL.md`.
- Mendeteksi N+1 query dari kode (bukan browser).
- Memverifikasi bahwa Inertia response menggunakan Resource, bukan raw Model.
- Mengidentifikasi `dd()`, `console.log()`, unused imports yang tertinggal.
- Menyarankan test case untuk setiap Action dan FormRequest baru.

### Batasan
- ❌ Tidak menulis kode fitur baru.
- ❌ Tidak melakukan browser testing kecuali diminta Kapten secara eksplisit.
- ❌ Tidak mengubah arsitektur atau pola yang sudah disetujui.

### Output Wajib
| Output | Kapan |
|--------|-------|
| Checklist hasil validasi | Setiap selesai review |
| Daftar issue yang ditemukan | Jika ada yang tidak lolos |
| Saran test case | Untuk setiap Action/FormRequest baru |

---

## 📋 Workflow Agent

**Pemanggilnya**: Manager Agent (untuk scaffolding & setup).
**Skill file**: `.agents/skills/workflow/SKILL.md`

### Tanggung Jawab
- Menjalankan `artisan` commands untuk scaffolding file baru.
- Memastikan naming convention konsisten di seluruh stack (lihat Naming Registry).
- Mengelola migration strategy (kapan alter vs buat baru).
- Menjadi referensi untuk command cheatsheet saat debugging.

### Batasan
- ❌ Tidak menulis business logic.
- ❌ Tidak mengubah migration yang sudah berjalan di production/staging.

---

## ⚡ Eskalasi & Prioritas

```
Kapten
  │
  └── Manager Agent (selalu pertama)
        ├── Trivial fix?  → Langsung eksekusi (tanpa plan)
        └── Non-trivial?  → Plan → Approval → Eskalasi ke:
              ├── Backend Agent  (jika ada PHP/DB work)
              ├── Frontend Agent (jika ada React work)
              └── QA Agent       (selalu di akhir)
```

### Definisi "Trivial" (boleh langsung dikerjakan):
- Typo / perbaikan teks
- Tweak warna / ukuran font
- Tambah comment di kode
- Fix syntax error yang jelas

### Definisi "Non-trivial" (wajib plan dulu):
- Fitur baru apapun
- Perubahan schema database
- Refactor arsitektur
- Integrasi layanan baru
