# Hooks Registry

> **ATURAN WAJIB**: Sebelum membuat custom hook baru, cek dokumen ini terlebih dahulu.
> Jangan duplikasi hook yang sudah ada. Jika ada yang mirip, extend — jangan buat baru.

---

## 📍 Lokasi Hooks

Hooks mengikuti pola **co-located** — disimpan di folder `hooks/` milik page masing-masing:

```
Pages/Admin/{Module}/{Entity}/hooks/use{Entity}{Action}.js
```

Tidak ada global hooks folder. Jika sebuah hook dibutuhkan di 2+ page berbeda, diskusikan dulu dengan Kapten sebelum membuat global hook.

---

## 🗂️ Registry

### 🟦 CRM Module

#### `useKanbanBoard`
**File**: `Pages/Admin/CRM/hooks/useKanbanBoard.js`
**Dipakai di**: `KanbanView.jsx`

| Item | Deskripsi |
|------|-----------|
| **Tujuan** | Mengelola state & interaksi drag-and-drop Kanban board untuk pipeline lead |
| **Input** | `kanbanData` — array phase dari Inertia props |
| **Library** | `@dnd-kit/core`, `@dnd-kit/sortable`, `axios` |

**Returns:**
| State / Action | Tipe | Deskripsi |
|----------------|------|-----------|
| `boardData` | array | Data board ter-sync dengan drag state |
| `activeLead` | object\|null | Lead yang sedang di-drag |
| `isLeadModalOpen` | boolean | State modal create/edit lead |
| `setIsLeadModalOpen` | function | Toggle modal |
| `editingLead` | object\|null | Lead yang sedang diedit (null = create mode) |
| `setEditingLead` | function | Set lead untuk diedit |
| `isDetailDrawerOpen` | boolean | State detail drawer |
| `setIsDetailDrawerOpen` | function | Toggle drawer |
| `selectedLeadId` | string\|null | ID lead yang dibuka di drawer |
| `drawerTabIndex` | number | Tab aktif di drawer (0 = Detail, 1 = Aktivitas, dll.) |
| `sensors` | — | DnD sensors (PointerSensor + KeyboardSensor) |
| `openLeadDetail(id, tabIndex?)` | function | Buka drawer untuk lead tertentu |
| `handleDragStart` | function | DnD handler — set `activeLead` |
| `handleDragOver` | function | DnD handler — visual move antar kolom |
| `handleDragEnd` | function | DnD handler — commit ke DB via axios PATCH |

> ⚠️ **Catatan**: `handleDragEnd` melakukan `axios.patch` ke route `admin.crm.leads.update-phase`. Route ini harus ada sebelum Kanban bisa berfungsi.

---

### 🟨 Academic Module

#### `useStudyClassIndex`
**File**: `Pages/Admin/Academic/StudyClass/hooks/useStudyClassIndex.js`
**Dipakai di**: `StudyClass/Index.jsx`

| Item | Deskripsi |
|------|-----------|
| **Tujuan** | Mengelola state & aksi halaman index kelas belajar |
| **Input** | `classes`, `branches`, `instructors`, `filters` (dari Inertia props) |

**Returns:**
| State / Action | Tipe | Deskripsi |
|----------------|------|-----------|
| `isModalOpen` | boolean | State modal create/edit kelas |
| `isDrawerOpen` | boolean | State drawer daftar siswa |
| `selectedClass` | object\|null | Kelas yang dibuka di drawer |
| `editingClass` | object\|null | Kelas yang diedit (null = create mode) |
| `search` | string | Nilai search input |
| `setSearch` | function | Update search value |
| `handleSearch()` | function | Submit search ke server via Inertia GET |
| `handleFilterBranch(branchId)` | function | Filter kelas berdasarkan branch |
| `openCreateModal()` | function | Buka modal dalam create mode |
| `openEditModal(studyClass)` | function | Buka modal dalam edit mode |
| `openStudentDrawer(studyClass)` | function | Buka drawer daftar siswa kelas |
| `handleResetCycle(studyClass)` | function | Reset siklus kelas (dengan konfirmasi) |
| `handleDelete(studyClass)` | function | Hapus kelas (dengan konfirmasi) |
| `closeModal()` | function | Tutup modal |
| `closeDrawer()` | function | Tutup drawer |

---

#### `useClassScheduleCalculation`
**File**: `Pages/Admin/Academic/StudyClass/hooks/useClassScheduleCalculation.js`
**Dipakai di**: Modal create/edit StudyClass

| Item | Deskripsi |
|------|-----------|
| **Tujuan** | Auto-kalkulasi `end_session_date` dan `meetings_per_week` berdasarkan input jadwal |
| **Input** | `data` (form state), `setData` (Inertia `useForm` setter) |
| **Library** | `date-fns` |
| **Returns** | `void` — bekerja via side-effect langsung ke `data` |

**Kalkulasi yang dilakukan:**
1. **`meetings_per_week`** → otomatis diupdate sesuai jumlah hari di `schedule_days`
2. **`end_session_date`** → dihitung dari `start_session_date` + `total_meetings` iterasi hari jadwal

```jsx
// Penggunaan di modal form:
const { data, setData } = useForm({ ... });
useClassScheduleCalculation(data, setData);
// Setelah ini, end_session_date dan meetings_per_week otomatis terupdate
```

---

## 📋 Naming Convention

| Pattern | Contoh |
|---------|--------|
| Index page hook | `use{Entity}Index` | `useLeadIndex`, `useStudyClassIndex` |
| Form/modal hook | `use{Entity}Form` | `useLeadForm`, `useInvoiceForm` |
| Calculation/utility hook | `use{Description}` | `useClassScheduleCalculation` |
| Feature-specific hook | `use{Feature}` | `useKanbanBoard`, `useLeadImport` |

---

## ❓ Hook yang Belum Ada (Perlu Dibuat)

| Hook | Dibutuhkan di | Catatan |
|------|---------------|---------|
| `useLeadIndex` | `CRM/ListView.jsx` | Cek apakah sudah ada inline di file |
| `useLeadForm` | Modal create/edit lead | Untuk form state lead |
| `useInvoiceIndex` | `Finance/Index.jsx` | State & filter invoice list |
| `useInvoiceForm` | Modal generate invoice | Form generate invoice |
| `useStudentIndex` | `Academic/Student/Index.jsx` | State halaman daftar siswa |
