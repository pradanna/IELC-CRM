# IELC-CRM Architecture Guide

This document captures the architectural standards, patterns, and business life-cycles of the IELC-CRM project. It serves as the primary technical reference for developers and AI agents.

## 1. Core Principles

### Atomic Business Logic (Actions)
We follow the **Action Pattern**. All data-altering logic must reside in `app/Actions`.
- **Controllers**: Thin wrappers that only handle request entry and call Actions.
- **Models**: Focus on relationships and attributes (Accessors/Mutators). No business logic.
- **N+1 Prevention**: Always use `with()` or `withCount()` when fetching relationships.

### Frontend Logic Isolation (Hooks)
We strictly separate UI from Logic in React.
- **Pages**: Strictly for layout and component assembly.
- **Hooks**: Custom hooks (`resources/js/Hooks`) contain all state management and API calls.
- **UI Components**: Use the shared components in `resources/js/Components/ui` for consistency.

---

## 2. Technical Stack

- **Backend**: Laravel 12 (PHP 8.2)
- **Frontend**: React 18, Inertia.js (SSR enabled)
- **Styling**: Tailwind CSS v4
- **Real-time**: Laravel Reverb + Echo (for notifications)
- **Database**: MySQL with UUID as primary keys for core entities (`Leads`, `Invoices`, `Students`).

---

## 3. Module: CRM (Lead Acquisition)

Focuses on capturing, nurturing, and converting potential students.

### Data Flow & Entities
```mermaid
graph TD
    A[New Inquiry] --> B[StoreLead Action]
    B --> C[Lead Model]
    C --> D[LeadGuardian Model]
    C --> E[LeadActivity Log]
    C --> F[LeadPhase Transition]
```

### Technical Specs
- **Primary Model**: `App\Models\Lead`.
- **Key Relationships**: `branch`, `owner`, `leadSource`, `leadType`, `leadPhase`, `guardians`.
- **Dashboard**: `FetchCrmDashboardData` Action provides a real-time pipeline snapshot with monthly trend comparison.
- **Automation**: Follow-up counter increments (`recordFollowUp`) and auto-resets when the lead responds (`resetFollowUp`).

---

## 4. Module: Finance (Billing & Invoicing)

Governs the conversion of a Lead into a paying customer.

### Invoicing Lifecycle
```mermaid
graph LR
    Lead[Lead: Phase Invoice] --> Gen[GenerateInvoice Action]
    Gen --> Inv[Invoice Model]
    Inv --> Items[InvoicedItem Model]
    Items --> PM[PriceMaster Model]
    Inv --> Pay[ProcessInvoicePayment Action]
    Pay --> Student[PromoteLeadToStudent Action]
```

### Technical Specs
- **Primary Model**: `App\Models\Invoice`.
- **Line Items**: `App\Models\InvoicedItem` supports both `PriceMaster` (fixed fees) and manual descriptions.
- **PDF Generation**: Uses `barryvdh/laravel-dompdf` for professional invoice generation with direct tab streaming.
- **Payment Success**: Triggers three events:
  1. Marks Invoice as `paid`.
  2. Promotes Lead to **Student** status.
  3. Enrolls Student into their assigned **StudyClass**.

---

## 5. Module: Academic (Student & Class Management)

Manages active student lifecycles, attendance, and academic progress.

### Academic Relationships
```mermaid
erDiagram
    STUDENT ||--o{ ENROLLMENT : has
    STUDENT {
        uuid id
        string name
        uuid lead_id
    }
    ENROLLMENT ||--|| STUDY-CLASS : "assigned to"
    STUDY-CLASS {
        uuid id
        string name
        uuid teacher_id
        string cycle_code
    }
    STUDY-CLASS ||--o{ ATTENDANCE : tracks
```

### Technical Specs
- **Primary Model**: `App\Models\Student`.
- **Key Actions**:
    - `PromoteLeadToStudent`: Creates student record and transfers relevant lead data.
    - `EnrollStudent`: Links a student to a `StudyClass` for a specific scholastic period.
- **Class Cycles**: `ResetClassCycle` Action handles the transition of all classes to a new academic term.

---

## 6. Module: Placement Test (Multi-Domain Diagnostic)

Manages diagnostic testing for prospective students across 3 independent educational domains while maintaining unified CRM Lead reporting and magic link generation.

### Placement Test Architecture
```mermaid
erDiagram
    LEADS ||--o{ PT_SESSIONS : "assigned_to"
    PT_EXAMS ||--o{ PT_SESSIONS : "generates_token"

    %% General Domain (MCQ / Auto-grading)
    PT_EXAMS ||--o{ PT_GENERAL_QUESTION_GROUPS : "has"
    PT_GENERAL_QUESTION_GROUPS ||--o{ PT_GENERAL_QUESTIONS : "groups"
    PT_GENERAL_QUESTIONS ||--o{ PT_GENERAL_QUESTION_OPTIONS : "options"
    PT_SESSIONS ||--o{ PT_GENERAL_ANSWERS : "submits"
    PT_GENERAL_QUESTIONS ||--o{ PT_GENERAL_ANSWERS : "for_question"

    %% Kids Domain (Interactive Freeform Canvas & Pin)
    PT_EXAMS ||--o{ PT_KIDS_QUESTION_GROUPS : "has"
    PT_KIDS_QUESTION_GROUPS ||--o{ PT_KIDS_QUESTIONS : "groups"
    PT_SESSIONS ||--o{ PT_KIDS_ANSWERS : "submits"
    PT_KIDS_QUESTIONS ||--o{ PT_KIDS_ANSWERS : "for_question"

    %% IELTS Domain (Academic Tasks & Band Criteria)
    PT_EXAMS ||--o{ PT_IELTS_SECTIONS : "has"
    PT_IELTS_SECTIONS ||--o{ PT_IELTS_TASKS : "tasks"
    PT_SESSIONS ||--o{ PT_IELTS_ANSWERS : "submits"
    PT_IELTS_TASKS ||--o{ PT_IELTS_ANSWERS : "for_task"
```

### Technical Specs
- **Unified Master**: `PtExam` (category: `General`, `Kids`, `IELTS`) and `PtSession` (token, status, `final_score`, `recommended_level`).
- **General Domain**: `PtGeneralQuestionGroup`, `PtGeneralQuestion`, `PtGeneralQuestionOption`, `PtGeneralAnswer` (instant score).
- **Kids Domain**: `PtKidsQuestionGroup`, `PtKidsQuestion` (`canvas_data` JSON layout/tokens), `PtKidsAnswer` (`user_mapping` JSON, `score_earned`, `teacher_notes`).
- **IELTS Domain**: `PtIeltsSection` (Listening, Reading, Writing, Speaking), `PtIeltsTask`, `PtIeltsAnswer` (Essay text, file attachment, criteria scores: TR, CC, LR, GRA, `band_score`, `evaluator_notes`).
- **Unified Public Runner**: `PtExamPublicResource` transforms domain-specific groups & questions into normalized frontend `pages` consumed by `Exam.jsx`.
- **Domain Submission**: `SubmitPlacementTestAction` routes submitted answers to their corresponding domain answer models based on `exam.category`.

---

## 7. Integrations & Coding Standards

### WhatsApp Integration
- **Node.js Gateway**: A separate Baileys-based server.
- **Front-end Link**: `LeadWhatsappTab.jsx` uses `WA_SERVER_URL` to communicate with the Node.js API.
- **Activity Logging**: All WA interactions are mirrored in `ActivityLog` for visibility within the CRM.

### AI Agent Rules
- **Verify before Edit**: Always check `docs/architecture.md` and `.agents/skills` first.
- **Standard Layout**: Maintain "Premium" UI patterns (consistent margins, HSL-based colors, and subtle micro-animations).
- **Communication**: Use `Inertia::render()` only with `JsonResource` collections.

