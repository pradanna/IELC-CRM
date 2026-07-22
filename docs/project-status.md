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

**Tanggal**: 2026-07-21
**Updated by**: Antigravity AI (Full Finance & Academic Updates)

---

## 📦 Module Overview

| Module     | Backend | Frontend | Overall Status | Catatan |
|------------|:-------:|:--------:|:--------------:|---------|
| **CRM**        | ✅ Done | ✅ Done | ✅ Done | Actions complete, Kanban & List views verified |
| **Finance**    | ✅ Done | ✅ Done | ✅ Done | Standalone Invoices, Placement Test Tab, Re-Invoice Auto-Cancel, Sibling Discount, Magic Link |
| **Academic**   | ✅ Done | ✅ Done | ✅ Done | Class Types (Online/Offline), Cycle Reset, Student & Class Management complete |
| **Master Data**| ✅ Done | ✅ Done | ✅ Done | Full CRUD available |
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
| Action: StoreLead | `app/Actions/Crm/Leads/StoreLead.php` | ✅ Done | — |
| Action: UpdateLead | `app/Actions/Crm/Leads/UpdateLead.php` | ✅ Done | — |
| Action: DeleteLead | — | 📋 Planned | Still on controller? |
| Action: RecordFollowUp | `app/Actions/Crm/Leads/RecordLeadFollowUp.php` | ✅ Done | — |
| Action: FetchCrmDashboardData | `app/Actions/Crm/Leads/FetchCrmDashboardData.php` | ✅ Done | — |
| Model: Lead | `app/Models/Lead.php` | ✅ Done | — |
| Resource: LeadResource | `app/Http/Resources/Admin/Crm/LeadResource.php` | ✅ Done | — |
| Controller: LeadController | `app/Http/Controllers/Admin/Crm/LeadController.php` | ✅ Done | — |

### Frontend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| CRM Dashboard | `Pages/Admin/CRM/Dashboard.jsx` | ✅ Done | — |
| Lead List View | `Pages/Admin/CRM/ListView.jsx` | ✅ Done | — |
| Lead Kanban View | `Pages/Admin/CRM/KanbanView.jsx` | ✅ Done | — |
| Lead Modals | `Pages/Admin/CRM/modals/` | ✅ Done | — |
| Lead Drawers | `Pages/Admin/CRM/drawers/` | ✅ Done | Smooth non-blocking phase switch |
| Lead Partials | `Pages/Admin/CRM/partials/` | ✅ Done | — |
| Lead Hooks | `Pages/Admin/CRM/hooks/` | ✅ Done | — |
| Lead Registrations | `Pages/Admin/CRM/Registrations/` | ✅ Done | — |

---

## 🟩 Module: Finance (Billing & Invoicing)

### Backend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Migration: price_masters | `2026_04_06_161430_create_price_masters_table.php` | ✅ Done | — |
| Migration: invoices | `2026_04_06_161431_create_invoices_table.php` | ✅ Done | UUID PK, dynamic end_date |
| Migration: invoiced_items | `2026_04_06_161432_create_invoiced_items_table.php` | ✅ Done | — |
| Action: GenerateInvoice | `app/Domains/Finance/Application/Actions/GenerateInvoice.php` | ✅ Done | Standalone/PT, Auto-cancel old pending invoices |
| Action: ProcessInvoicePayment | `app/Domains/Finance/Application/Actions/ProcessInvoicePayment.php` | ✅ Done | — |
| Service: FinanceDashboardService | `app/Domains/Finance/Application/Services/FinanceDashboardService.php` | ✅ Done | Placement Test tab query added |
| Model: Invoice | `app/Domains/Finance/Domain/Models/Invoice.php` | ✅ Done | — |
| Model: PriceMaster | `app/Domains/Finance/Domain/Models/PriceMaster.php` | ✅ Done | — |
| Controller: FinanceController| `app/Http/Controllers/Admin/Finance/FinanceController.php` | ✅ Done | Type filtering (New Join, Paket Lanjut, Rejoin, Placement Test) |
| Public Controller | `app/Http/Controllers/Public/PublicLeadController.php` | ✅ Done | Public Magic Link `/invoice/{id}` |
| PDF Generation (dompdf) | `resources/views/pdf/invoice.blade.php` | ✅ Done | Redesigned header, dynamic study period & loyalty note |

### Frontend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Billing Center Index | `Pages/Admin/Finance/Index.jsx` | ✅ Done | Placement Test Tab, Generate Invoice button |
| Invoice History Index | `Pages/Admin/Finance/Invoices/Index.jsx` | ✅ Done | Paket Diselesaikan badge, Red Cancelled badge, Magic Link, WA share |
| Invoice Detail Modal | `Pages/Admin/Finance/Invoices/modals/InvoiceDetailModal.jsx` | ✅ Done | Copy Magic Link & WA button integration |
| Plot & Invoice Modal | `Pages/Admin/Finance/modals/PlotAndInvoiceModal.jsx` | ✅ Done | Auto Sibling discount (10%), PT default item |

---

## 🟨 Module: Academic (Student & Class Management)

### Backend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Migration: students | `2026_04_05_162601_create_students_table.php` | ✅ Done | — |
| Migration: study_classes | `2026_04_05_162601_create_study_classes_table.php` | ✅ Done | — |
| Migration: add_type_to_study_classes | `2026_07_21_090000_add_type_to_study_classes_table.php` | ✅ Done | Online / Offline class type |
| Migration: study_class_student | `2026_04_05_162602_create_study_class_student_table.php` | ✅ Done | Pivot cycle tracking |
| Action: PromoteLeadToStudent | `app/Domains/Academic/Application/Actions/PromoteLeadToStudent.php` | ✅ Done | — |
| Action: EnrollStudent | `app/Domains/Academic/Application/Actions/EnrollStudent.php` | ✅ Done | — |
| Action: ResetClassCycle | `app/Domains/Academic/Application/Actions/ResetClassCycle.php` | ✅ Done | — |
| Action: StoreStudyClass | `app/Domains/Academic/Application/Actions/StoreStudyClass.php` | ✅ Done | Supports `type` validation |
| Action: UpdateStudyClass | `app/Domains/Academic/Application/Actions/UpdateStudyClass.php` | ✅ Done | Supports `type` validation |
| Model: Student | `app/Domains/Academic/Domain/Models/Student.php` | ✅ Done | — |
| Model: StudyClass | `app/Domains/Academic/Domain/Models/StudyClass.php` | ✅ Done | Includes `type` attribute |
| Resource: StudyClassResource | `app/Http/Resources/Academic/StudyClassResource.php` | ✅ Done | Includes `type` |
| Service: StudyClassQueryService| `app/Domains/Academic/Application/Services/StudyClassQueryService.php` | ✅ Done | Class type filtering |

### Frontend

| Komponen | File | Status | Catatan |
|----------|------|:------:|---------|
| Student Index | `Pages/Admin/Academic/Student/Index.jsx` | ✅ Done | Completed package count display |
| StudyClass Index | `Pages/Admin/Academic/StudyClass/Index.jsx` | ✅ Done | Complete with hooks, modals, partials |
| CreateEditClassModal | `Pages/Admin/Academic/StudyClass/modals/CreateEditClassModal.jsx` | ✅ Done | Jenis Kelas (Online/Offline) input |
| ClassCard | `Pages/Admin/Academic/StudyClass/partials/ClassCard.jsx` | ✅ Done | ONLINE / OFFLINE badge tag |

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
