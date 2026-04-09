# UI Component Registry

> **ATURAN WAJIB**: Sebelum membuat komponen baru apapun, cek dokumen ini terlebih dahulu.
> Import path menggunakan alias `@/` yang merujuk ke `resources/js/`.

---

## ⚠️ Penting: Komponen di Root `Components/`

Ada beberapa komponen di `Components/` (root) yang **duplikat** dengan yang ada di sub-folder.
Selalu prioritaskan yang ada di **sub-folder** (`ui/`, `form/`, `shared/`).
Komponen root akan di-refactor di masa mendatang.

---

## 🗂️ Struktur Folder

```
resources/js/Components/
├── ui/       ← Elemen UI generik (Modal, Button, Badge, dll.)
├── form/     ← Elemen form (TextInput, DatePicker, dll.)
└── shared/   ← Layout & navigasi (Sidebar, Tabs, dll.)
```

---

## 🟦 UI Components (`Components/ui/`)

### `Modal`
**Import**: `import Modal from '@/Components/ui/Modal'`

| Prop | Tipe | Default | Deskripsi |
|------|------|---------|-----------|
| `show` | boolean | — | Kontrol visibilitas modal |
| `onClose` | function | — | Callback saat backdrop di-klik |
| `title` | string | — | Judul di header modal (opsional) |
| `maxWidth` | string | `'lg'` | Lebar: `sm`, `md`, `lg`, `xl`, `2xl`…`7xl` |
| `children` | ReactNode | — | Konten body modal |

```jsx
<Modal show={isOpen} onClose={() => setIsOpen(false)} title="Tambah Lead" maxWidth="xl">
    {/* form content */}
</Modal>
```

---

### `SlideOver`
**Import**: `import SlideOver from '@/Components/ui/SlideOver'`
> Panel slide dari kanan. Gunakan untuk detail view, bukan untuk form create.

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `show` | boolean | Kontrol visibilitas |
| `onClose` | function | Callback tutup panel |
| `title` | string | Judul di header |
| `children` | ReactNode | Konten panel |

```jsx
<SlideOver show={isOpen} onClose={() => setIsOpen(false)} title="Detail Lead">
    <LeadDetailTab lead={selected} />
</SlideOver>
```

---

### `Button`
**Import**: `import Button from '@/Components/ui/Button'`

| Prop | Tipe | Default | Deskripsi |
|------|------|---------|-----------|
| `variant` | string | `'primary'` | `primary`, `secondary`, `outline`, `ghost`, `danger` |
| `icon` | LucideIcon | — | Icon dari `lucide-react` (opsional) |
| `className` | string | `''` | Kelas tambahan |
| `...props` | — | — | Semua HTML button props (`onClick`, `disabled`, dll.) |

```jsx
<Button variant="primary" icon={Plus} onClick={handleCreate}>Tambah Lead</Button>
<Button variant="outline" onClick={handleCancel}>Batal</Button>
<Button variant="danger" onClick={handleDelete}>Hapus</Button>
```

---

### `Badge`
**Import**: `import Badge from '@/Components/ui/Badge'`
> Auto-deteksi warna berdasarkan teks tertentu (paid, pending, dll.).

| Prop | Tipe | Default | Deskripsi |
|------|------|---------|-----------|
| `type` | string | `'default'` | `success`, `warning`, `danger`, `info`, `default` |
| `children` | string | — | Teks badge |

**Auto-detect keywords**:
- `success`: paid, active, converted, hadir
- `warning`: pending, scheduled, trial
- `danger`: unpaid, overdue, lost, alpa
- `info`: new, contacted, izin

```jsx
<Badge type="success">Paid</Badge>
<Badge>pending</Badge>  {/* auto-detect → warning */}
```

---

### `DataTable`
**Import**: `import DataTable from '@/Components/ui/DataTable'`
> Support client-side dan server-side pagination.

| Prop | Tipe | Default | Deskripsi |
|------|------|---------|-----------|
| `data` | array | `[]` | Array data rows |
| `columns` | array | `[]` | Definisi kolom (lihat format di bawah) |
| `itemsPerPage` | number | `10` | Untuk client-side pagination |
| `filterSection` | ReactNode | — | Slot filter di atas tabel |
| `onRowClick` | function | — | Callback klik baris |
| `isLoading` | boolean | `false` | Tampilkan loading state |
| `pagination` | object | `null` | Object dari Laravel paginator (untuk server-side) |

**Format `columns`**:
```js
const columns = [
    { header: 'Nama', accessor: 'name' },
    { header: 'Status', accessor: 'status', render: (row) => <Badge>{row.status}</Badge> },
    { header: 'Aksi', accessor: 'id', className: 'text-right', render: (row) => (
        <TableIconButton type="edit" onClick={() => handleEdit(row)} />
    )},
];
```

**Server-side pagination** (pass `pagination` prop dari Inertia):
```jsx
<DataTable data={leads.data} columns={columns} pagination={leads} />
```

---

### `Panel`
**Import**: `import Panel from '@/Components/ui/Panel'`
> Container putih dengan header opsional. Gunakan sebagai wrapper page section.

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `title` | string | Judul section (opsional) |
| `description` | string | Sub-judul (opsional) |
| `action` | ReactNode | Tombol aksi di kanan header (opsional) |
| `children` | ReactNode | Konten (biasanya `DataTable`) |

```jsx
<Panel
    title="Daftar Lead"
    description="Semua lead yang masuk"
    action={<Button icon={Plus} onClick={handleCreate}>Tambah</Button>}
>
    <DataTable data={leads} columns={columns} />
</Panel>
```

---

### `Select`
**Import**: `import Select from '@/Components/ui/Select'`
> Dropdown custom. Untuk searchable, gunakan `PremiumSearchableSelect`.

| Prop | Tipe | Default | Deskripsi |
|------|------|---------|-----------|
| `value` | any | — | Nilai terpilih |
| `onChange` | function | — | Callback dengan `value` terpilih |
| `options` | array | `[]` | Array string atau `[{ label, value }]` |
| `placeholder` | string | `'Select an option'` | |
| `label` | string | — | Label di atas dropdown |
| `icon` | LucideIcon | — | Icon opsional |

```jsx
<Select
    label="Fase Lead"
    value={data.lead_phase_id}
    onChange={(val) => setData('lead_phase_id', val)}
    options={phases.map(p => ({ label: p.name, value: p.id }))}
/>
```

---

### `TableIconButton`
**Import**: `import TableIconButton from '@/Components/ui/TableIconButton'`
> Tombol icon kecil untuk aksi di dalam tabel. Sudah include tooltip.

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `type` | string | `detail`, `edit`, `delete`, `followup`, `payment` |
| `onClick` | function | Callback klik |

```jsx
<TableIconButton type="edit" onClick={() => handleEdit(row)} />
<TableIconButton type="delete" onClick={() => handleDelete(row.id)} />
<TableIconButton type="detail" onClick={() => handleDetail(row)} />
```

---

### `Toast`
**Import**: `import Toast from '@/Components/ui/Toast'`
> Notifikasi flash otomatis dari `usePage().props.flash`. Tidak butuh props.
> **Sudah dipasang di layout utama** — tidak perlu tambah lagi di tiap halaman.

```jsx
// Hanya perlu di Layout (sudah ada):
<Toast />
// Di Controller, cukup:
return redirect()->back()->with('success', 'Data berhasil disimpan.');
```

---

### `SearchInput`
**Import**: `import SearchInput from '@/Components/ui/SearchInput'`
> Input search dengan debounce/icon sudah built-in. Cek source untuk props.

### `StatusBadge`
**Import**: `import StatusBadge from '@/Components/ui/StatusBadge'`
> Varian Badge untuk status spesifik. Cek source untuk konfigurasi warna.

### `Pagination`
**Import**: `import Pagination from '@/Components/ui/Pagination'`
> Komponen pagination dari Laravel links. Sudah dipakai di `DataTable` (server-side).

### `Dropdown`
**Import**: `import Dropdown from '@/Components/ui/Dropdown'`
> Dropdown generik berbasis Headless UI.

### `Card`
**Import**: `import Card from '@/Components/ui/Card'`
> Container card sederhana.

### `TextArea`
**Import**: `import TextArea from '@/Components/ui/TextArea'`

---

## 🟩 Form Components (`Components/form/`)

### `TextInput`
**Import**: `import TextInput from '@/Components/form/TextInput'`

```jsx
<TextInput
    value={data.name}
    onChange={(e) => setData('name', e.target.value)}
    placeholder="Nama lengkap"
    className="mt-1 block w-full"
/>
```

### `DatePicker`
**Import**: `import DatePicker from '@/Components/form/DatePicker'`
> Custom date picker dengan kalender. Lihat source untuk props lengkap.

### `InputError`
**Import**: `import InputError from '@/Components/form/InputError'`
```jsx
<InputError message={errors.name} className="mt-1" />
```

### `InputLabel`
**Import**: `import InputLabel from '@/Components/form/InputLabel'`
```jsx
<InputLabel value="Nama Lead" htmlFor="name" />
```

### `Checkbox`
**Import**: `import Checkbox from '@/Components/form/Checkbox'`

### Buttons (form context)
| Komponen | Import | Kegunaan |
|----------|--------|---------|
| `PrimaryButton` | `@/Components/form/PrimaryButton` | Submit form (loading state) |
| `SecondaryButton` | `@/Components/form/SecondaryButton` | Cancel / secondary action |
| `DangerButton` | `@/Components/form/DangerButton` | Destructive action (hapus) |

---

## 🟧 Shared Components (`Components/shared/`)

### Shared Components
- `Navbar`: Main application navigation.
- `Sidebar`: Admin side navigation menu.
- `AdminPageLayout`: Standard layout for admin pages with title, subtitle, and actions.
- `AdminCard`: Reusable panel/card with white background, thin border, and rounded-sm edges.
- `Tabs`: Reusable tab navigation.

| Prop | Tipe | Deskripsi |
|------|------|-----------|
| `tabs` | array | Array of `{ name: string, content: ReactNode }` |

```jsx
<Tabs tabs={[
    { name: 'Detail', content: <LeadDetailTab lead={lead} /> },
    { name: 'Aktivitas', content: <LeadActivityTab activities={activities} /> },
    { name: 'Tugas', content: <LeadTaskTab tasks={tasks} /> },
]} />
```

---

### `AdminCard`
**Import**: `import AdminCard from '@/Components/shared/AdminCard'`
> Panel standar dengan tepian `rounded-sm`, background putih, border `slate-200`, dan shadow tipis. Gunakan ini untuk dashboard dan list view.

| Prop | Tipe | Default | Deskripsi |
|------|------|---------|-----------|
| `padding` | string | `'p-8'` | Tailwind padding class |
| `header` | ReactNode | — | Konten header (dengan garis pemisah) |
| `footer` | ReactNode | — | Konten footer (dengan garis pemisah) |
| `className` | string | `''` | Kelas tambahan untuk container |
| `children` | ReactNode | — | Konten utama |

```jsx
<AdminCard 
    header={<h3 className="font-bold">Informasi Paket</h3>}
    footer={<Button variant="ghost">Reset Form</Button>}
>
    <p>Isi konten di sini...</p>
</AdminCard>
```

### `Sidebar`
Layout sidebar — sudah ada di AppLayout, tidak perlu dipakai manual.

### `Navbar`
Layout navbar — sudah ada di AppLayout, tidak perlu dipakai manual.

### `NotificationDropdown`
Sudah terintegrasi di Navbar via Reverb.

---

## 🔵 Premium Components (Root `Components/`)

Komponen-komponen ini berada di root `Components/` dan **belum dipindah ke sub-folder**.

### `PremiumSearchableSelect`
**Import**: `import PremiumSearchableSelect from '@/Components/PremiumSearchableSelect'`
> Select dengan fitur search (Combobox Headless UI). Gunakan ini untuk data banyak (fase, branch, user).

| Prop | Tipe | Default | Deskripsi |
|------|------|---------|-----------|
| `options` | array | `[]` | Array `[{ label, value }]` |
| `value` | any | — | Nilai terpilih (ID) |
| `onChange` | function | — | Callback `(value) => void` |
| `placeholder` | string | `'Search...'` | |
| `icon` | LucideIcon | — | Icon opsional |

```jsx
<PremiumSearchableSelect
    options={users.map(u => ({ label: u.name, value: u.id }))}
    value={data.owner_id}
    onChange={(val) => setData('owner_id', val)}
    placeholder="Pilih PIC..."
/>
```

### `PremiumSearchableMultiSelect`
**Import**: `import PremiumSearchableMultiSelect from '@/Components/PremiumSearchableMultiSelect'`
> Versi multi-select dari `PremiumSearchableSelect`. Props serupa, `value` berupa array.

### `PremiumSelect`
**Import**: `import PremiumSelect from '@/Components/PremiumSelect'`
> Versi premium dari Select standar (styling lebih premium).

---

## 📋 Quick Decision Guide

> *"Komponen mana yang harus saya pakai?"*

| Kebutuhan | Gunakan |
|-----------|---------|
| Modal form / konfirmasi | `Modal` (ui/) |
| Panel detail slide dari kanan | `SlideOver` (ui/) |
| Tombol aksi utama | `Button` variant `primary` (ui/) |
| Tombol di dalam tabel | `TableIconButton` (ui/) |
| Tabel data dengan pagination | `DataTable` (ui/) |
| Container section halaman | `Panel` (ui/) |
| Dropdown pilihan (data sedikit) | `Select` (ui/) |
| Dropdown pilihan + search (data banyak) | `PremiumSearchableSelect` (root) |
| Multi-select + search | `PremiumSearchableMultiSelect` (root) |
| Label status / fase | `Badge` (ui/) |
| Tab navigasi | `Tabs` (shared/) |
| Input teks form | `TextInput` (form/) |
| Input tanggal | `DatePicker` (form/) |
| Error message form | `InputError` (form/) |
| Flash notification | `Toast` (ui/) — sudah di layout |
