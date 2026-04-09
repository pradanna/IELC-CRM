# Database Schema Reference

> Dikompilasi dari semua migration file. Selalu verifikasi ke migration jika ada keraguan.
> **Aturan Global**: Semua tabel core menggunakan UUID sebagai primary key. Lihat `docs/decisions.md` ADR-001.

---

## 🗂️ Daftar Tabel

| Tabel | Modul | Deskripsi |
|-------|-------|-----------|
| `branches` | Core | Cabang/lokasi IELC |
| `users` | Auth | Akun login staff |
| `superadmins` | Master | Profil Superadmin |
| `marketing` | Master | Profil Staff Marketing |
| `frontdesks` | Master | Profil Staff Frontdesk |
| `finance` | Master | Profil Staff Finance |
| `teachers` | Master | Profil Guru |
| `monthly_targets` | CRM | Target enrollment per bulan per cabang |
| `lead_types` | CRM | Jenis lead (referensi) |
| `lead_phases` | CRM | Fase pipeline lead (referensi) |
| `lead_sources` | CRM | Sumber lead (referensi) |
| `leads` | CRM | Data utama calon siswa |
| `lead_guardians` | CRM | Data wali/orang tua lead |
| `lead_activities` | CRM | Log aktivitas lead |
| `lead_relationships` | CRM | Relasi antar lead (saudara, dll) |
| `lead_registrations` | CRM | Form self-registrasi publik |
| `tasks` | CRM | To-do / follow-up tasks |
| `chat_templates` | CRM | Template pesan WhatsApp |
| `media_assets` | CRM | File media untuk WA template |
| `price_masters` | Finance | Master harga per sesi |
| `invoices` | Finance | Invoice tagihan siswa |
| `invoiced_items` | Finance | Line item invoice |
| `students` | Academic | Data siswa aktif |
| `study_classes` | Academic | Kelas belajar |
| `study_class_student` | Academic | Pivot enrollment siswa ke kelas |
| `sessions` | System | Laravel session |
| `password_reset_tokens` | System | Token reset password |

---

## 🔵 Core

### `branches`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `name` | string | ❌ | |
| `code` | string | ❌ | Unique |
| `created_at` / `updated_at` | timestamp | ✅ | |

### `users`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `email` | string | ❌ | Unique |
| `email_verified_at` | timestamp | ✅ | |
| `password` | string | ❌ | |
| `branch_id` | uuid | ✅ | FK → branches |
| `remember_token` | string | ✅ | |
| `created_at` / `updated_at` | timestamp | ✅ | |

---

## 👥 Master Data (Staff Profiles)

### `superadmins` / `marketing` / `frontdesks` / `finance` / `teachers`
> Semua tabel profil staff menggunakan skema yang sama.

| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `user_id` | uuid | ❌ | FK → users, cascade |
| `name` | string | ❌ | |
| `phone` | string | ✅ | |
| `address` | text | ✅ | |
| `photo_path` | string | ✅ | |
| `created_at` / `updated_at` | timestamp | ✅ | |

---

## 🟦 CRM Module

### `lead_types` / `lead_phases` / `lead_sources`
> Tabel referensi — hanya ada `id`, `name`, timestamps (dan `color`/`code` tergantung tabel).

### `leads` ⭐ (Tabel Utama CRM)
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `lead_number` | string | ❌ | Unique, auto-generated |
| `name` | string | ✅ | |
| `nickname` | string | ✅ | |
| `phone` | string | ❌ | |
| `email` | string | ✅ | |
| `birth_date` | date | ✅ | |
| `gender` | enum(`L`,`P`) | ✅ | |
| `school` | string | ✅ | |
| `grade` | string | ✅ | |
| `branch_id` | uuid | ❌ | FK → branches, cascade |
| `owner_id` | uuid | ❌ | FK → users (PIC marketing) |
| `created_by` | uuid | ✅ | FK → users, set null |
| `lead_source_id` | uuid | ✅ | FK → lead_sources |
| `lead_type_id` | uuid | ✅ | FK → lead_types |
| `lead_phase_id` | uuid | ✅ | FK → lead_phases |
| `is_online` | boolean | ❌ | Default: false |
| `province` | string | ✅ | |
| `city` | string | ✅ | |
| `address` | text | ✅ | |
| `postal_code` | string(10) | ✅ | |
| `follow_up_count` | unsignedInt | ❌ | Default: 0 |
| `last_activity_at` | timestamp | ✅ | Indexed |
| `enrolled_at` | timestamp | ✅ | Indexed, set saat masuk fase enrollment |
| `self_registration_token` | string | ✅ | Unique, untuk form self-fill |
| `pending_updates` | json | ✅ | Data pending review dari self-fill |
| `deleted_at` | timestamp | ✅ | SoftDeletes |
| `created_at` / `updated_at` | timestamp | ✅ | |

**Indexes**: `branch_id`, `owner_id`, `last_activity_at`, `enrolled_at`

### `lead_guardians`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `lead_id` | uuid | ❌ | FK → leads, cascade |
| `role` | string | ✅ | `ayah`, `ibu`, `wali`, `lainnya` |
| `name` | string | ❌ | |
| `phone` | string | ❌ | Indexed |
| `email` | string | ✅ | |
| `occupation` | string | ✅ | |
| `is_main_contact` | boolean | ❌ | Default: false |

### `lead_activities`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `lead_id` | uuid | ❌ | FK → leads, cascade |
| `user_id` | uuid | ❌ | FK → users |
| `type` | string | ❌ | `phase_changed`, `follow_up`, `note`, `task_created`, `owner_changed` |
| `description` | text | ❌ | |

### `lead_relationships`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `lead_id` | uuid | ❌ | FK → leads |
| `related_lead_id` | uuid | ❌ | FK → leads |
| `type` | enum | ❌ | `sibling`, `parent`, `child`, `guardian` |
| `is_main_contact` | boolean | ❌ | Default: false |

### `lead_registrations`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `name` | string | ❌ | |
| `nickname` | string | ✅ | |
| `phone` | string | ❌ | |
| `email` | string | ✅ | |
| `gender` | string(1) | ✅ | `L` / `P` |
| `birth_date` | date | ✅ | |
| `school` | string | ✅ | |
| `grade` | string | ✅ | |
| `branch_id` | uuid | ❌ | FK → branches |
| `province` / `city` / `address` / `postal_code` | — | ✅ | |
| `guardian_data` | json | ✅ | Data wali dalam format JSON |
| `status` | enum | ❌ | `pending`, `approved`, `rejected`. Default: `pending` |
| `admin_notes` | text | ✅ | |
| `deleted_at` | timestamp | ✅ | SoftDeletes |

### `tasks`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `lead_id` | uuid | ❌ | FK → leads, cascade |
| `assigned_to` | uuid | ❌ | FK → users |
| `title` | string | ❌ | |
| `description` | text | ✅ | |
| `priority` | string | ❌ | `normal`, `urgent`. Default: `normal` |
| `is_completed` | boolean | ❌ | Default: false. Indexed |
| `due_date` | date | ❌ | |

### `chat_templates`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `title` | string | ❌ | |
| `message` | text | ❌ | |
| `target_type` | string | ❌ | `global`, `lead_phase`, `lead_type` |
| `lead_phase_id` | uuid | ✅ | FK → lead_phases |
| `lead_type_id` | uuid | ✅ | FK → lead_types |
| `file_path` | string | ✅ | |
| `file_name` | string | ✅ | |

### `monthly_targets`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `branch_id` | uuid | ❌ | FK → branches |
| `year` | unsignedInt | ❌ | |
| `month` | unsignedTinyInt | ❌ | 1–12 |
| `target_enrolled` | unsignedInt | ❌ | Default: 0 |

**Unique**: `[branch_id, year, month]`

---

## 🟩 Finance Module

### `price_masters`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `name` | string | ❌ | |
| `price_per_session` | unsignedBigInt | ❌ | Default: 0 (dalam Rupiah) |
| `deleted_at` | timestamp | ✅ | SoftDeletes |

### `invoices`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `invoice_number` | string | ❌ | Unique |
| `lead_id` | uuid | ✅ | FK → leads, null on delete |
| `student_id` | uuid | ✅ | FK → students, null on delete |
| `study_class_id` | uuid | ✅ | FK → study_classes |
| `total_amount` | unsignedBigInt | ❌ | Total (Rupiah) |
| `session_count` | unsignedInt | ❌ | Jumlah sesi |
| `due_date` | date | ✅ | |
| `status` | enum | ❌ | `pending`, `paid`, `cancelled`. Default: `pending` |
| `paid_at` | timestamp | ✅ | Diset saat payment berhasil |
| `notes` | text | ✅ | |
| `deleted_at` | timestamp | ✅ | SoftDeletes |

### `invoiced_items`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `invoice_id` | uuid | ❌ | FK → invoices, cascade |
| `price_master_id` | uuid | ✅ | FK → price_masters (nullable = manual item) |
| `name` | string | ❌ | Nama item/layanan |
| `quantity` | unsignedInt | ❌ | |
| `unit_price` | unsignedBigInt | ❌ | Harga satuan (Rupiah) |
| `subtotal` | unsignedBigInt | ❌ | `quantity × unit_price` |

---

## 🟨 Academic Module

### `students`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `lead_id` | uuid | ❌ | FK → leads, cascade |
| `student_number` | string | ❌ | Unique |
| `profile_picture` | string | ✅ | |
| `start_join` | date | ❌ | |
| `status` | enum | ❌ | `active`, `stop`, `rejoin`. Default: `active` |
| `notes` | text | ✅ | |
| `deleted_at` | timestamp | ✅ | SoftDeletes |

### `study_classes`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `branch_id` | uuid | ❌ | FK → branches, cascade |
| `instructor_id` | uuid | ✅ | FK → users (guru), null on delete |
| `name` | string | ❌ | |
| `start_session_date` | date | ✅ | |
| `end_session_date` | date | ✅ | |
| `total_meetings` | unsignedInt | ❌ | Default: 12 |
| `meetings_per_week` | unsignedInt | ❌ | Default: 2 |
| `current_session_number` | unsignedInt | ❌ | Default: 1 |
| `schedule_days` | string | ✅ | Format: `Senin,Rabu` |
| `deleted_at` | timestamp | ✅ | SoftDeletes |

### `study_class_student` (Pivot)
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | bigInt | ❌ | Auto-increment (pivot, bukan UUID) |
| `study_class_id` | uuid | ❌ | FK → study_classes, cascade |
| `student_id` | uuid | ❌ | FK → students, cascade |
| `cycle_number` | unsignedInt | ❌ | Default: 1 (siklus ke berapa) |
| `created_at` / `updated_at` | timestamp | ✅ | |

**Index**: `[study_class_id, student_id, cycle_number]`

---

## ⚙️ System Tables

| Tabel | Catatan |
|-------|---------|
| `sessions` | Laravel session driver |
| `password_reset_tokens` | PK = email (string) |
| `cache` / `cache_locks` | Laravel cache |
| `jobs` / `job_batches` / `failed_jobs` | Laravel queue |
| `activity_log` | Spatie ActivityLog |
| `permissions` / `roles` / `model_has_*` | Spatie Permission (RBAC) |
| `pt_exams` | CRM | Management paket placement test |
| `pt_question_groups` | CRM | Kelompok soal (Reading/Listening) |
| `pt_questions` | CRM | Detail soal |
| `pt_question_options` | CRM | Pilihan jawaban soal |
| `pt_sessions` | CRM | Sesi pengerjaan test oleh lead |
| `pt_answers` | CRM | Jawaban yang diberikan lead |

---

## 🟣 Placement Test Module

### `pt_exams`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `title` | string | ❌ | |
| `slug` | string | ❌ | Unique |
| `description` | text | ✅ | |
| `duration_minutes` | unsignedInt | ❌ | Default: 60 |
| `is_active` | boolean | ❌ | Default: true |

### `pt_question_groups`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `pt_exam_id` | uuid | ❌ | FK → pt_exams |
| `instruction` | text | ✅ | |
| `audio_path` | string | ✅ | |
| `reading_text` | text | ✅ | |
| `position` | integer | ❌ | Order pengerjaan |

### `pt_questions`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `pt_exam_id` | uuid | ❌ | FK → pt_exams |
| `pt_question_group_id` | uuid | ✅ | FK → pt_question_groups |
| `number` | integer | ✅ | Nomor urut soal |
| `question_text` | text | ❌ | |
| `audio_path` | string | ✅ | |
| `points` | integer | ❌ | Default: 1 |
| `position` | integer | ❌ | Order pengerjaan |

### `pt_question_options`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `pt_question_id` | uuid | ❌ | FK → pt_questions |
| `option_text` | string | ❌ | |
| `is_correct` | boolean | ❌ | Default: false |
| `position` | integer | ❌ | |

### `pt_sessions`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `lead_id` | uuid | ❌ | FK → leads |
| `pt_exam_id` | uuid | ❌ | FK → pt_exams |
| `token` | string | ❌ | Unique access token |
| `status` | enum | ❌ | `pending`, `in_progress`, `completed`, `expired` |
| `started_at` | timestamp | ✅ | |
| `finished_at` | timestamp | ✅ | |
| `total_score` | integer | ✅ | |

### `pt_answers`
| Kolom | Tipe | Nullable | Catatan |
|-------|------|:--------:|---------|
| `id` | uuid | ❌ | PK |
| `pt_session_id` | uuid | ❌ | FK → pt_sessions |
| `pt_question_id` | uuid | ❌ | FK → pt_questions |
| `pt_question_option_id` | uuid | ❌ | FK → pt_question_options |
| `is_correct` | boolean | ❌ | |
