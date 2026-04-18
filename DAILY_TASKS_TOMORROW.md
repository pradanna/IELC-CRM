# Daily Tasks - IELC-CRM (Tomorrow's Plan)

## 🔴 Priority: Rejoin Lifecycle Optimization
*Objective: Automate student status management and track renewal performance.*

- [ ] **Debug: PlotAndInvoiceModal Sync Issues**
    - [ ] Re-verify `join_date` calculation when switching between billing modes multiple times.
    - [ ] Ensure `remainingSessions` handles edge cases where `join_date` is exactly on the `end_session_date`.
    - [ ] Fix potential UI state lag when changing class selection in Rejoin mode.

- [ ] **Automated Student Status Management**
    - [ ] **Status: STOP Automation**:
        - Create a command/job to check students whose class `end_session_date` has passed.
        - If no new **paid** invoice/enrollment exists for the next cycle, change student status to `stop`.
        - Trigger notification to Frontdesk when a student officially becomes `stop`.
    - [ ] **Rejoin Retention Logic**:
        - When a student status changes from `stop` -> `active` (via payment), tag the record as a "Rejoin Success".

- [ ] **Rejoin Reporting & Analytics**
    - [ ] **Database**: Add `rejoin_notes` or similar field to track reasons for continuing/stopping.
    - [ ] **New Report Section**: "Renewal & Rejoin Performance":
        - Total students expiring this month.
        - % Successfully Rejoined (Invoiced & Paid).
        - % Lost (Status changed to `stop`).
    - [ ] **Dashboard Integration**: Show "Expected Revenue" from pending renewal invoices.

---

## 🟠 Priority: Automation & Task Visibility (Pending from Previous)
- [ ] **Automated Phase Transitions**
    - [ ] Move inactive leads to `cold-leads` (7 days for New, 30 days for Prospective).
- [ ] **Intelligent Task Follow-up**
    - [ ] "Silent Leads" visibility in Dashboard Task List.

---

## 🟡 Activity Log
- **2026-04-18**: 
    - Implemented Smart Date Calculation for Rejoin.
    - Integrated Invoice Modal to CRM Lead Drawer.
    - Fixed Pro-rata calculation sync between Modal & PDF.
    - Added Real-time Notifications for Invoice & Payment.
    - Created Dedicated Invoice History Page with Search/Filters.
