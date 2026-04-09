# IELC-CRM Project Status

> **Tujuan Dokumen**: Memberikan gambaran *ground truth* kondisi aktual proyek kepada setiap AI Agent sebelum memulai tugas apapun. Update dokumen ini setiap kali ada fitur yang selesai, dimulai, atau direncanakan.
>
> **Cara Membaca Status**:
> - ✅ `Done` — Fitur selesai dan siap pakai di production/staging.
> - 🔄 `In Progress` — Sedang aktif dikerjakan.
> - 🏗️ `Stub` — File/folder sudah ada tapi belum fungsional penuh.
> - 📋 `Planned` — Direncanakan tapi belum ada kode sama sekali.
> - ❌ `Blocked` — Ada dependensi atau blocker yang harus diselesaikan dulu.

---

## 🗓️ Last Updated

**Tanggal**: 2026-04-08
**Updated by**: Manager Agent (Initial Scan)

---

## 📦 Module Overview

| Module     | Backend | Frontend | Overall Status | Catatan |
|------------|:-------:|:--------:|:--------------:|---------|
| **CRM**        | 🔄 In Progress | ✅ Done | 🔄 In Progress | Backend Actions masih partial |
| **Finance**    | 🔄 In Progress | 🏗️ Stub | 🔄 In Progress | Frontend Invoice belum lengkap |
| **Academic**   | ✅ Done | 🔄 In Progress | 🔄 In Progress | Student page masih minimal |
| **Master Data**| 🏗️ Stub | ✅ Done | 🏗️ Stub | Backend route/controller belum semua ada |
| **Auth / User**| ✅ Done | ✅ Done | ✅ Done | — |

---

## 🟦 Module: CRM (Lead Acquisition)

### Backend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Migration: leads | `2026_03_31_160002_create_leads_table.php` | ✅ Done | UUID PK |
| Migration: lead_activities | `2026_03_31_160003_create_lead_activities_table.php` | ✅ Done | — |
| Migration: lead_guardians | `2026_03_31_170747_create_lead_guardians_table.php` | ✅ Done | — |
| Migration: lead_phases | `2026_03_31_160001_6_create_lead_phases_table.php` | ✅ Done | — |
| Migration: lead_sources | `2026_03_31_160001_7_create_lead_sources_table.php` | ✅ Done | — |
| Migration: lead_types | `2026_03_31_160001_5_create_lead_types_table.php` | ✅ Done | — |
| Migration: lead_registrations | `2026_04_07_152905_create_lead_registrations_table.php` | ✅ Done | Self-fill form |
| Migration: tasks | `2026_03_31_160004_create_tasks_table.php` | ✅ Done | — |
| Migration: chat_templates | `2026_04_02_160316_create_chat_templates_table.php` | ✅ Done | — |
| Migration: media_assets | `2026_04_02_161303_create_media_assets_table.php` | ✅ Done | — |
| Action: StoreLead | `app/Actions/CRM/Leads/StoreLead.php` | ✅ Done | — |
| Action: UpdateLead | — | 📋 Planned | Belum dibuat |
| Action: DeleteLead | — | 📋 Planned | Belum dibuat |
| Action: RecordFollowUp | — | 📋 Planned | Logic ada di model/controller? |
| Action: FetchCrmDashboardData | — | 📋 Planned | Disebutkan di architecture.md |
| Model: Lead | `app/Models/Lead.php` | ✅ Done | — |
| Resource: LeadResource | — | ❓ Unchecked | Perlu verifikasi |
| Controller: LeadController | — | ❓ Unchecked | Perlu verifikasi |

### Frontend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| CRM Dashboard | `Pages/Admin/CRM/Dashboard.jsx` | ✅ Done | — |
| Lead List View | `Pages/Admin/CRM/ListView.jsx` | ✅ Done | — |
| Lead Kanban View | `Pages/Admin/CRM/KanbanView.jsx` | ✅ Done | — |
| Lead Modals | `Pages/Admin/CRM/modals/` | ✅ Done | — |
| Lead Drawers | `Pages/Admin/CRM/drawers/` | ✅ Done | — |
| Lead Partials | `Pages/Admin/CRM/partials/` | ✅ Done | — |
| Lead Hooks | `Pages/Admin/CRM/hooks/` | ✅ Done | — |
| Lead Registrations | `Pages/Admin/CRM/Registrations/` | 🏗️ Stub | Perlu verifikasi isi |

---

## 🟩 Module: Finance (Billing & Invoicing)

### Backend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Migration: price_masters | `2026_04_06_161430_create_price_masters_table.php` | ✅ Done | — |
| Migration: invoices | `2026_04_06_161431_create_invoices_table.php` | ✅ Done | UUID PK |
| Migration: invoiced_items | `2026_04_06_161432_create_invoiced_items_table.php` | ✅ Done | — |
| Action: GenerateInvoice | `app/Actions/Finance/GenerateInvoice.php` | ✅ Done | — |
| Action: ProcessInvoicePayment | `app/Actions/Finance/ProcessInvoicePayment.php` | ✅ Done | — |
| Model: Invoice | — | ❓ Unchecked | Perlu verifikasi |
| Model: PriceMaster | — | ❓ Unchecked | Perlu verifikasi |
| Resource: InvoiceResource | — | ❓ Unchecked | Perlu verifikasi |
| Controller: InvoiceController | — | ❓ Unchecked | Perlu verifikasi |
| PDF Generation (dompdf) | — | ❓ Unchecked | Disebutkan di architecture.md |

### Frontend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Invoice Index | `Pages/Admin/Finance/Index.jsx` | 🏗️ Stub | Ada file, belum jelas kelengkapannya |
| Price Master | `Pages/Admin/Finance/PriceMaster/` | 🏗️ Stub | Ada folder, perlu verifikasi |
| Invoice Modals | `Pages/Admin/Finance/modals/` | 🏗️ Stub | Ada folder, perlu verifikasi |

---

## 🟨 Module: Academic (Student & Class Management)

### Backend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Migration: students | `2026_04_05_162601_create_students_table.php` | ✅ Done | — |
| Migration: study_classes | `2026_04_05_162601_create_study_classes_table.php` | ✅ Done | — |
| Migration: study_class_student | `2026_04_05_162602_create_study_class_student_table.php` | ✅ Done | Pivot |
| Action: PromoteLeadToStudent | `app/Actions/Academic/PromoteLeadToStudent.php` | ✅ Done | — |
| Action: EnrollStudent | `app/Actions/Academic/EnrollStudent.php` | ✅ Done | — |
| Action: ResetClassCycle | `app/Actions/Academic/ResetClassCycle.php` | ✅ Done | — |
| Action: StoreStudyClass | `app/Actions/Academic/StoreStudyClass.php` | ✅ Done | — |
| Action: UpdateStudyClass | `app/Actions/Academic/UpdateStudyClass.php` | ✅ Done | — |
| Model: Student | — | ❓ Unchecked | Perlu verifikasi |
| Model: StudyClass | — | ❓ Unchecked | Perlu verifikasi |
| Resource: StudentResource | — | ❓ Unchecked | Perlu verifikasi |
| Controller: StudentController | — | ❓ Unchecked | Perlu verifikasi |

### Frontend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Student Index | `Pages/Admin/Academic/Student/Index.jsx` | 🏗️ Stub | Ada, belum ada hooks/modals |
| StudyClass Index | `Pages/Admin/Academic/StudyClass/Index.jsx` | ✅ Done | Lengkap dengan hooks, modals, partials |
| StudyClass Modals | `Pages/Admin/Academic/StudyClass/modals/` | ✅ Done | — |
| StudyClass Drawers | `Pages/Admin/Academic/StudyClass/drawers/` | ✅ Done | — |
| StudyClass Hooks | `Pages/Admin/Academic/StudyClass/hooks/` | ✅ Done | — |

---

## 🟧 Module: Master Data

### Backend

| Komponen | Status | Catatan |
|----------|:------:|---------|
| Migration: branches | ✅ Done | — |
| Migration: provinces / cities | ✅ Done | — |
| Migration: teachers | ✅ Done | `2026_04_07_041700` |
| Migration: permissions (Spatie) | ✅ Done | — |
| Migration: monthly_targets | ✅ Done | — |
| Controller: UserManagement | ❓ Unchecked | Perlu verifikasi |
| Controller: TeacherController | ❓ Unchecked | Perlu verifikasi |

### Frontend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Master Data Page | `Pages/Admin/Master/MasterData.jsx` | ✅ Done | — |
| User Management | `Pages/Admin/Master/UserManagement.jsx` | ✅ Done | — |
| Master Partials | `Pages/Admin/Master/master/` | ✅ Done | — |
| Master Modals | `Pages/Admin/Master/modals/` | ✅ Done | — |

---

## 🔧 Infrastructure & Integrations

| Integrasi | Status | Catatan |
|-----------|:------:|---------|
| Laravel Reverb (WebSocket) | ✅ Done | Real-time notifications aktif |
| WhatsApp Gateway (Baileys) | ❓ Unchecked | Node.js server terpisah, perlu konfirmasi status |
| PDF Generation (dompdf) | ❓ Unchecked | Disebutkan di architecture.md |
| Spatie ActivityLog | ✅ Done | Migration sudah ada |
| Spatie Permission (RBAC) | ✅ Done | Migration sudah ada |
| Self-Registration Form (Public) | 🔄 In Progress | Table ada, form di `Public/` |

---

## 📋 Backlog / Fitur yang Belum Dimulai

> Daftar ini untuk referensi agent. Update ketika fitur dipindah ke "In Progress".

| Fitur | Modul | Prioritas | Catatan |
|-------|-------|:---------:|---------|
| UpdateLead & DeleteLead Actions | CRM | 🔴 High | Krusial untuk flow CRM |
| FetchCrmDashboardData Action | CRM | 🔴 High | Dashboard CRM butuh ini |
| RecordFollowUp / ResetFollowUp | CRM | 🔴 High | Core CRM automation |
| Invoice PDF Streaming | Finance | 🟡 Medium | dompdf sudah di architecture |
| Student Detail Page | Academic | 🟡 Medium | Student/Index.jsx masih stub |
| Teacher Management CRUD | Master | 🟡 Medium | Migration ada, frontend belum |
| Reporting / Analytics | — | 🟢 Low | Belum ada di architecture |
| Role-Based Access Control UI | Master | 🟢 Low | Spatie sudah install |

---

## ❓ Unchecked Items

Item-item di bawah ini perlu diverifikasi langsung ke filesystem sebelum agen mulai bekerja di area tersebut:

- [ ] `app/Models/` — Verifikasi semua Model yang ada
- [ ] `app/Http/Controllers/` — Verifikasi semua Controller dan route-nya
- [ ] `app/Http/Resources/` — Verifikasi semua API Resources
- [ ] `Pages/Admin/CRM/Registrations/` — Verifikasi kelengkapan self-registration form
- [ ] `Pages/Admin/Finance/` — Verifikasi kelengkapan Invoice frontend
- [ ] WhatsApp Gateway status — Server masih running?

---

*Dokumen ini bukan pengganti membaca kode secara langsung. Selalu verifikasi dengan `list_dir` dan `view_file` sebelum membuat perubahan.*
