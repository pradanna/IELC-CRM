# Active Daily Tasks

Detailed history and roadmap for each phase can be found in:
- [Phase 4: Finance](./phase4.md)
- [Phase 5: Student Lifecycle & Rejoin](./phase5.md)

---

## 🎯 TARGET: TOMORROW (2026-04-19)

### 1. Finance Modal Polish ([Phase 5](./phase5.md))
- [ ] **Fix**: Re-verify `join_date` calculation when switching between billing modes in `PlotAndInvoiceModal`.
- [ ] **Fix**: Ensure UI state consistency when selecting different classes for rejoin.

### 2. Status Automation ([Phase 5](./phase5.md))
- [ ] **Feature**: Create command to mark students as `stop` if `end_session_date` is passed and no new active enrollment exists.
- [ ] **Notification**: Alert Frontdesk when a student's status changes to `stop`.

### 3. Reporting ([Phase 5](./phase5.md))
- [ ] **Data**: Add `rejoin_notes` field for tracking churn/renewal reasons.
- [ ] **Report**: Implement "Rejoin Success Rate" metrics.

---

## 📝 Activity Log (Today)
- 2026-04-18: Completed Invoice History, Smart Rejoin Dates, and Notification system.
