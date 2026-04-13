# IELC-CRM Public Routes Reference

This document lists the public routes used for data collection and student registration.

## 1. Global Registration Form (Isi Data Pribadi Global)
Used for new potential students (Leads) to register themselves.

- **Welcome Page**: `GET /join/{branch_code}`
    - Route Name: `public.join.welcome`
    - Purpose: Landing page for potential leads.
- **Registration Form**: `GET /join/{branch_code}/form`
    - Route Name: `public.join.form`
    - Purpose: The main form where leads fill their personal information.
- **Submit Registration**: `POST /join`
    - Route Name: `public.join.store`
    - Purpose: Submits the data to the registration inbox for admin approval.

## 2. Lead Data Completion Link (Isi Pribadi via Link)
Used by CRM admins to send a personalized link to an existing lead to complete or update their data.

- **Filling Form**: `GET /fill-data/{token}`
    - Route Name: `public.join.filling`
    - Purpose: Personalized form pre-filled with existing data (if any).
- **Submit Update**: `POST /fill-data/{token}`
    - Route Name: `public.join.filling.submit`
    - Purpose: Submits updates to the registration inbox for admin approval.

## 3. Placement Test (Public)
Used for students to take the placement test.

- **Test Info**: `GET /placement-test/{token}`
    - Route Name: `public.placement-test.show`
- **Start Test**: `POST /placement-test/{token}/start`
    - Route Name: `public.placement-test.start`
- **Exam Page**: `GET /placement-test/{token}/exam`
    - Route Name: `public.placement-test.exam`
- **Submit Test**: `POST /placement-test/{token}/submit`
    - Route Name: `public.placement-test.submit`
- **Result Page**: `GET /placement-test/{token}/result`
    - Route Name: `public.placement-test.result`

## 4. Invoices
Permits students/parents to download their invoice.

- **Download Invoice**: `GET /invoice/{id}`
    - Route Name: `public.invoice.download`
