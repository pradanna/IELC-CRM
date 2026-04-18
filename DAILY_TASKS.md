# Daily Tasks - IELC-CRM

This document serves as a detailed technical specification for the Developer. Follow these requirements strictly to ensure the CRM logic aligns with business needs.

---

## 🔴 Priority: Success Rate Reports (CRM Dashboard)
*Objective: Implement granular tracking of lead transitions based on Phase Status.*

- [x] **Data Model & Query Logic**
    - [ x] Status mapping:
        - `new`: Code `lead`
        - `prospective`: Codes `prospect`, `consultation`, `placement-test`, `pre-enrollment`, `invoice`
        - `closing`: Code `enrollment`
        - `lost`: Codes `cold-leads`, `dropout-leads`
- [x] **Implement Success Rate Calculations**
    - [x] **New -> Prospective**: % of Leads created as `new` that progressed to any `prospective` phase.
    - [x] **New -> Closing**: % of Leads created as `new` that eventually reached `closing`.
    - [x] **New -> Lost**: % of Leads created as `new` that diverted to `lost`.
    - [x] **Prospective -> Closing**: % of leads that reached `prospective` and then achieved `closing`.
    - [x] **Prospective -> Lost**: % of leads that reached `prospective` and then became `lost`.
- [x] **Frontend Widget Update**
    - [x] Add a "Success Metrics" tab or section in the CRM Dashboard.
    - [x] Display these percentages clearly with comparison to previous periods if data is available.

---

## 🟠 Priority: Automation & Task Visibility Logic
*Objective: Automate pipeline hygiene and recurring follow-up reminders.*

- [ ] **Automated Phase Transitions (Scheduler)**
    - [ ] Create a Laravel Command `crm:cleanup-inactive-leads`.
    - [ ] **New -> Cold**: Automatic move to `cold-leads` if no activity for **7 days**.
    - [ ] **Prospective -> Cold**: Automatic move to `cold-leads` if no activity for **30 days**.
- [ ] **Intelligent Task Follow-up Logic**
    - [ ] Update the Dashboard Task List query to include "Silent Leads":
        - **Visibility Trigger**: Lead is in `prospective` status AND `last_activity_at` is between 4 - 7 days ago.
        - **Dismissal Logic**: Task disappears once a new `LeadActivity` (follow-up) is recorded.
        - **Recurrence**: Task re-appears after another 4-7 days of silence.
        - **Termination**: Stop showing tasks for a lead after **7 total follow-ups** have been recorded.
- [ ] **Database Schema Check**
    - [ ] Ensure `last_activity_at` and `follow_up_count` are correctly updated by all CRM actions.

---

## 🟡 Priority: Features & Polish
- [x] **Expiring Study Periods Visibility**
    - [x] Implement the widget for students whose classes end in <= 14 days and ensure empty state visibility.
- [x] **Real-time Notifications**
    - [x] Connect `LeadRegistered` and `PtSessionCompleted` events to frontend toast notifications and inbox.
- [ ] **Rejoin Student Concept**
    - [ ] Implementation of "Re-connection" phase for former students.

---

## 📝 Activity Log
- **2026-04-16**: Updated DAILY_TASKS with detailed Success Rate logic and automated follow-up specifications.
