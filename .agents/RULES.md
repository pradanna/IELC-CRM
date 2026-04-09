# Repository Agent Rules (The Constitution)

This document is the **MANDATORY PROTOCOL** for every AI Agent working on the IELC-CRM repository. 

Any agent, regardless of their specific tools or persona, MUST follow these rules to ensure consistency, maintainability, and clean code standards.

---

## 1. Skill Adherence (MANDATORY)

Before starting any task, you MUST read the following skill files in `.agents/skills/`:
- **[Backend Skill](file:///c:/PROJECT/WEBSITE/IELC-CRM/.agents/skills/backend/SKILL.md)**: PHP 8.2 & Laravel 12 standards.
- **[Frontend Skill](file:///c:/PROJECT/WEBSITE/IELC-CRM/.agents/skills/frontend/SKILL.md)**: React 18 & Tailwind CSS v4 standards.
- **[QA Skill](file:///c:/PROJECT/WEBSITE/IELC-CRM/.agents/skills/qa/SKILL.md)**: Quality testing & N+1 detection.
- **[Workflow Skill](file:///c:/PROJECT/WEBSITE/IELC-CRM/.agents/skills/workflow/SKILL.md)**: Feature implementation steps & naming registry.
- **[Database Schema](file:///c:/PROJECT/WEBSITE/IELC-CRM/docs/database-schema.md)**: Referensi wajib sebelum membuat migration atau model baru. Pastikan tabel/kolom belum ada.
- **[RBAC](file:///c:/PROJECT/WEBSITE/IELC-CRM/docs/rbac.md)**: Referensi wajib untuk permission & role. Gunakan saat menulis `authorize()` di FormRequest atau middleware di route.

---

## 2. Core Development Protocol

### Workflow First (STRICTLY ENFORCED)
- **PLANNING FIRST**: Untuk setiap tugas yang tidak bersifat *trivial* (perbaikan kecil), Anda WAJIB membuat `implementation_plan.md` dan `task.md`.
- **DISCUSS & APPROVE**: Anda **TIDAK BOLEH** memulai eksekusi (menulis kode) sebelum Kapten membaca rencana tersebut dan memberikan persetujuan (katakan "OK" atau berikan masukan).
- **TASK TRACKING**: Setelah disetujui, update `task.md` secara berkala untuk menunjukkan progres kerja Anda.
- **NO AUTO-BROWSER TEST**: Jangan melakukan pengetesan menggunakan `browser_subagent` atau alat browser lainnya kecuali diminta secara spesifik oleh Kapten.
- Jangan pernah melompati tahapan di **Feature Implementation Checklist**.

### Clean Architecture
- **Backend**: Thin Controllers + Action Classes (`app/Actions`). No business logic in Controllers or Models.
- **Frontend**: Absolute separation of concerns. All logic MUST be in **Custom Hooks**; Page components MUST be purely JSX logic-free.
- **Communication**: Always use **API Resources** (`app/Http/Resources`) to pass data to Inertia/React. NEVER pass raw Eloquent models.

### Performance & Integrity
- **Zero Tolerance for N+1**: Always use `with()` or `withCount()` for relationships.
- **Data Integrity**: Wrap all data-altering operations in `DB::transaction()`.
- **Validation**: Use `FormRequest` classes for all input. No manual validation calls.

---

## 3. Communication Style
- Act as a **Manager** for these skills.
- Be concise.
- Always provide a `walkthrough.md` after completing a task.
- Use GitHub alerts (> [!IMPORTANT]) for critical information.

---

**BY WORKING ON THIS REPOSITORY, YOU AGREE TO FOLLOW THESE RULES STRICTLY.**
