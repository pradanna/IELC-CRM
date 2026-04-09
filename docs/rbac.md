# Role-Based Access Control (RBAC)

> Menggunakan **Spatie Laravel Permission**. Setiap agent Backend WAJIB mengacu dokumen ini saat menulis `authorize()` di FormRequest atau middleware di route.
>
> **Aturan**: Jangan hardcode role name di controller. Selalu gunakan `->can('permission_name')` atau middleware `permission:`.

---

## 👥 Role Registry

| Role | Tabel Profil | Deskripsi |
|------|-------------|-----------|
| `superadmin` | `superadmins` | Akses penuh ke semua fitur dan modul |
| `marketing` | `marketing` | Fokus di Finance: invoice dan pembayaran |
| `frontdesk` | `frontdesks` | Operasional harian: CRM, kelas, master data |

> ⚠️ Role `finance` dan `teacher` tersedia di tabel tapi **belum memiliki permission yang didefinisikan**. Jangan assign permission ke role tersebut sebelum didiskusikan dengan Kapten.

---

## 🔐 Permission Matrix

### ✅ Superadmin — Full Access
Superadmin memiliki akses ke **semua permission** di bawah ini secara otomatis, plus:
- Manajemen User & Role
- Manajemen Branch
- Setting aplikasi

---

### 📋 Frontdesk — Operasional Harian

#### CRM
| Permission | Deskripsi |
|------------|-----------|
| `lead.view` | Lihat daftar dan detail lead |
| `lead.create` | Buat lead baru |
| `lead.update` | Edit data lead |
| `lead.delete` | Hapus lead (soft delete) |
| `lead.followup` | Rekam follow-up lead |
| `lead.change_phase` | Pindah fase pipeline lead |
| `lead.change_owner` | Ganti PIC/owner lead |
| `lead.registration.view` | Lihat daftar self-registrasi |
| `lead.registration.approve` | Approve / reject registrasi |

#### Academic
| Permission | Deskripsi |
|------------|-----------|
| `class.view` | Lihat daftar kelas |
| `class.create` | Buat kelas baru |
| `class.update` | Edit kelas |
| `class.delete` | Hapus kelas |
| `student.view` | Lihat daftar siswa |

#### Master Data
| Permission | Deskripsi |
|------------|-----------|
| `template.view` | Lihat template WA |
| `template.create` | Buat template WA |
| `template.update` | Edit template WA |
| `template.delete` | Hapus template WA |
| `media.view` | Lihat media assets |
| `media.create` | Upload media baru |
| `media.delete` | Hapus media |

---

### 💰 Marketing — Finance Operations

| Permission | Deskripsi |
|------------|-----------|
| `invoice.view` | Lihat daftar invoice |
| `invoice.create` | Buat / generate invoice baru |
| `invoice.update` | Edit invoice (sebelum paid) |
| `invoice.payment` | Proses / konfirmasi pembayaran |
| `lead.view` | Lihat data lead (read-only, untuk referensi) |
| `student.view` | Lihat data siswa (read-only) |

---

## 🛠️ Implementasi di Kode

### Di Route (`routes/web.php`)
```php
// Proteksi per permission
Route::middleware(['auth', 'permission:lead.create'])->post('/leads', ...);

// Proteksi per role
Route::middleware(['auth', 'role:superadmin|frontdesk'])->group(function () {
    // ...
});
```

### Di FormRequest (`authorize()`)
```php
public function authorize(): bool
{
    // Cek permission spesifik
    return $this->user()->can('lead.create');
}

// Superadmin selalu lolos
public function authorize(): bool
{
    return $this->user()->hasRole('superadmin') 
        || $this->user()->can('lead.create');
}
```

### Di Blade / Inertia Props (share ke frontend)
```php
// Di AppServiceProvider atau HandleInertiaRequests
'permissions' => $user->getAllPermissions()->pluck('name'),
'roles'       => $user->getRoleNames(),
```

### Di React (cek permission di FE)
```jsx
// Via Inertia usePage()
const { auth } = usePage().props;
const canCreateLead = auth.permissions.includes('lead.create');

{canCreateLead && <Button onClick={handleCreate}>Tambah Lead</Button>}
```

---

## 🌱 Seeder Reference

Permission dan role harus di-seed via `RolePermissionSeeder`. Struktur:

```php
// database/seeders/RolePermissionSeeder.php
$permissions = [
    // CRM
    'lead.view', 'lead.create', 'lead.update', 'lead.delete',
    'lead.followup', 'lead.change_phase', 'lead.change_owner',
    'lead.registration.view', 'lead.registration.approve',
    // Academic
    'class.view', 'class.create', 'class.update', 'class.delete',
    'student.view',
    // Finance
    'invoice.view', 'invoice.create', 'invoice.update', 'invoice.payment',
    // Master
    'template.view', 'template.create', 'template.update', 'template.delete',
    'media.view', 'media.create', 'media.delete',
];

$frontdeskPermissions = [
    'lead.view', 'lead.create', 'lead.update', 'lead.delete',
    'lead.followup', 'lead.change_phase', 'lead.change_owner',
    'lead.registration.view', 'lead.registration.approve',
    'class.view', 'class.create', 'class.update', 'class.delete',
    'student.view',
    'template.view', 'template.create', 'template.update', 'template.delete',
    'media.view', 'media.create', 'media.delete',
];

$marketingPermissions = [
    'lead.view',
    'student.view',
    'invoice.view', 'invoice.create', 'invoice.update', 'invoice.payment',
];
```

---

## 📋 Status Implementasi

| Item | Status | Catatan |
|------|:------:|---------|
| Spatie Permission (migrasi) | ✅ Done | Migration sudah ada |
| `RolePermissionSeeder` | 📋 Planned | Belum dibuat |
| Permission middleware di routes | 📋 Planned | Belum diimplementasi |
| Share permissions ke Inertia | 📋 Planned | Belum di HandleInertiaRequests |
| Role `finance` & `teacher` | ❓ TBD | Belum didefinisikan scope-nya |
