# Agent Onboarding — Start Here

Selamat datang di repository **IELC-CRM**. Dokumen ini adalah titik masuk pertama untuk setiap AI Agent sebelum memulai pekerjaan apapun.

---

## ⚡ TL;DR — Baca Dalam Urutan Ini

```
1. RULES.md          (wajib, ~3 menit)
2. AGENT-ROLES.md    (wajib, ~2 menit)
3. docs/ yang relevan dengan tugasmu
4. Skill file sesuai peranmu
```

---

## 📋 Langkah Wajib Sebelum Mulai

### Step 1 — Baca Konstitusi
**[RULES.md](./RULES.md)** — Aturan yang berlaku untuk SEMUA agent tanpa terkecuali.

### Step 2 — Pahami Peranmu
**[AGENT-ROLES.md](./AGENT-ROLES.md)** — Siapa kamu, apa tanggung jawabmu, dan kapan kamu dipanggil.

### Step 3 — Baca Docs yang Relevan

| Dokumen | Kapan Dibaca |
|---------|-------------|
| [docs/architecture.md](../docs/architecture.md) | Selalu — gambaran besar sistem |
| [docs/project-status.md](../docs/project-status.md) | Selalu — apa yang sudah dan belum ada |
| [docs/decisions.md](../docs/decisions.md) | Selalu — kenapa arsitektur seperti ini |
| [docs/database-schema.md](../docs/database-schema.md) | Wajib jika menyentuh BE / DB |
| [docs/rbac.md](../docs/rbac.md) | Wajib jika menyentuh auth / permission |
| [docs/ui-components.md](../docs/ui-components.md) | Wajib jika menyentuh FE / UI |
| [docs/hooks-registry.md](../docs/hooks-registry.md) | Wajib jika membuat/modifikasi hooks |

### Step 4 — Baca Skill File Sesuai Peranmu

| Peranmu | Skill File |
|---------|-----------|
| Backend Agent | [skills/backend/SKILL.md](./skills/backend/SKILL.md) |
| Frontend Agent | [skills/frontend/SKILL.md](./skills/frontend/SKILL.md) |
| QA Agent | [skills/qa/SKILL.md](./skills/qa/SKILL.md) |
| Workflow Agent | [skills/workflow/SKILL.md](./skills/workflow/SKILL.md) |

---

## 🚦 Alur Kerja Singkat

```
Terima tugas dari Kapten
    │
    ▼
Baca docs yang relevan
    │
    ▼
Trivial? ──── Ya ──► Kerjakan langsung
    │
    Tidak
    │
    ▼
Buat implementation_plan.md
    │
    ▼
Tunggu persetujuan Kapten
    │
    ▼
Eksekusi + update task.md
    │
    ▼
Buat walkthrough.md
```

---

## 🗂️ Struktur Repository Sekilas

```
IELC-CRM/
├── .agents/
│   ├── README.md          ← Kamu di sini
│   ├── RULES.md           ← Konstitusi
│   ├── AGENT-ROLES.md     ← Roster agent
│   └── skills/            ← Skill per peran
│
├── docs/
│   ├── architecture.md    ← Arsitektur modul
│   ├── project-status.md  ← Status fitur
│   ├── decisions.md       ← ADR
│   ├── database-schema.md ← Schema DB
│   ├── ui-components.md   ← Registry komponen
│   ├── hooks-registry.md  ← Registry hooks
│   └── rbac.md            ← Role & permission
│
├── app/
│   ├── Actions/           ← Business logic (WAJIB pakai ini)
│   ├── Http/
│   │   ├── Controllers/   ← Thin controllers
│   │   ├── Requests/      ← Validasi input
│   │   └── Resources/     ← Response shaping
│   └── Models/
│
├── database/migrations/   ← Selalu cek sebelum buat tabel baru
│
└── resources/js/
    ├── Components/        ← Shared UI (cek ui-components.md dulu!)
    └── Pages/Admin/       ← Page + hooks + modals + partials
        ├── CRM/
        ├── Finance/
        ├── Academic/
        └── Master/
```

---

## ⚠️ Hal yang Paling Sering Salah

| Kesalahan | Yang Benar |
|-----------|-----------|
| Logic di Controller | Taruh di `app/Actions/` |
| `useState` di Page component | Taruh di custom hook |
| Raw Eloquent di `Inertia::render()` | Pakai `Resource::collection()` |
| Buat komponen baru tanpa cek | Cek `docs/ui-components.md` dulu |
| Buat tabel tanpa cek schema | Cek `docs/database-schema.md` dulu |
| Hardcode role name | Pakai permission dari `docs/rbac.md` |
| Query relation dalam loop | Pakai `with()` / `withCount()` |
| Mulai coding tanpa plan | Buat `implementation_plan.md` dulu |
