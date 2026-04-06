---
name: workflow
description: Workflow & DevOps Specialist for IELC-CRM.
---

# Workflow & DevOps Specialist

As a Workflow Specialist for the IELC-CRM project, you ensure that every feature is built systematically, following a consistent process from start to finish.

## Core Technologies
- **Backend**: Laravel 12, PHP 8.2
- **Frontend**: React 18, Inertia.js, Tailwind CSS v4
- **Build**: Vite 6
- **WebSocket**: Laravel Reverb
- **Database**: MySQL

---

## 1. Feature Implementation Checklist

When building a new feature (e.g., CRUD for a module), follow this EXACT order:

### Backend First
```
□ 1. Migration        → database/migrations/xxxx_create_{table}_table.php
□ 2. Model             → app/Models/{Entity}.php
□ 3. Action(s)         → app/Actions/{Module}/{Entity}/Store{Entity}.php
                         app/Actions/{Module}/{Entity}/Update{Entity}.php
                         app/Actions/{Module}/{Entity}/Delete{Entity}.php
□ 4. FormRequest(s)    → app/Http/Requests/{Module}/Store{Entity}Request.php
                         app/Http/Requests/{Module}/Update{Entity}Request.php
□ 5. Resource          → app/Http/Resources/{Module}/{Entity}Resource.php
□ 6. Controller        → app/Http/Controllers/{Module}/{Entity}Controller.php
□ 7. Route             → routes/web.php (resource route)
```

### Frontend Second
```
□ 8.  Page             → resources/js/Pages/{Module}/{Entity}/Index.jsx
□ 9.  Custom Hook      → resources/js/Pages/{Module}/{Entity}/hooks/use{Entity}Index.js
□ 10. Modals           → resources/js/Pages/{Module}/{Entity}/modals/Create{Entity}Modal.jsx
□ 11. Partials         → resources/js/Pages/{Module}/{Entity}/partials/ (if tabs/slides)
```

### Finalize
```
□ 12. Seeder (optional) → database/seeders/{Entity}Seeder.php
□ 13. Sidebar/Nav link  → Update navigation if needed
□ 14. Test              → Verify in browser
```

> **RULE**: Never skip a step. If a step is not applicable, explicitly mark it as N/A with a reason.

---

## 2. Naming Convention Registry

Consistent naming across the entire stack:

| Layer | Pattern | Example (Module: CRM, Entity: Lead) |
|---|---|---|
| **Migration** | `create_{table}_table` | `create_leads_table` |
| **Model** | `{Entity}` (singular, PascalCase) | `Lead` |
| **Action** | `{Verb}{Entity}` | `StoreLead`, `UpdateLead`, `DeleteLead` |
| **FormRequest** | `{Verb}{Entity}Request` | `StoreLeadRequest` |
| **Resource** | `{Entity}Resource` | `LeadResource` |
| **Controller** | `{Entity}Controller` | `LeadController` |
| **Route URL** | `/{module}/{entity}` (kebab, plural) | `/crm/leads` |
| **Route Name** | `{module}.{entity}.{action}` | `crm.leads.index` |
| **Page** | `Pages/{Module}/{Entity}/Index.jsx` | `Pages/CRM/Leads/Index.jsx` |
| **Hook** | `use{Entity}{Page}` | `useLeadIndex`, `useLeadForm` |
| **Modal** | `{Verb}{Entity}Modal` | `CreateLeadModal` |
| **Partial** | `{Entity}{Section}Tab` | `LeadDetailTab` |
| **DB columns** | `snake_case` | `created_at`, `lead_source` |

---

## 3. Command Cheatsheet

### Development
| Command | Description |
|---|---|
| `composer dev` | 🚀 Start all 4 processes (server, queue, pail, vite) |
| `php artisan serve` | Start Laravel server only |
| `npm run dev` | Start Vite dev server only |
| `php artisan queue:listen` | Start queue worker |
| `php artisan pail` | Live log tail |

### Database
| Command | Description |
|---|---|
| `php artisan make:migration create_{table}_table` | New migration |
| `php artisan migrate` | Run pending migrations |
| `php artisan migrate:rollback` | Rollback last batch |
| `php artisan migrate:fresh --seed` | Reset DB + seed |
| `php artisan db:seed --class={Seeder}` | Run specific seeder |

### Scaffolding
| Command | Description |
|---|---|
| `php artisan make:model {Name} -m` | Model + migration |
| `php artisan make:controller {Name}Controller` | Controller |
| `php artisan make:request {Name}Request` | FormRequest |
| `php artisan make:resource {Name}Resource` | API Resource |

### Cache & Troubleshooting
| Command | Description |
|---|---|
| `php artisan optimize:clear` | Clear ALL caches |
| `php artisan config:clear` | Clear config cache |
| `php artisan route:list` | List all routes |
| `php artisan tinker` | Interactive REPL |

---

## 4. Migration Strategy

### When to CREATE a new migration:
- Adding a new table.
- Adding/removing columns on an existing table in production.
- Adding indexes or foreign keys.

### When to MODIFY an existing migration:
- ONLY during early development when `migrate:fresh` is acceptable.
- Never modify a migration that has been run on staging/production.

### Migration Best Practices:
- Always add `->index()` on foreign keys and frequently queried columns.
- Use `->nullable()` explicitly — don't assume defaults.
- Add `->after('column')` for readability when adding columns.
- Name migration files descriptively: `add_status_column_to_leads_table`.

---

## 5. Debugging Flow

When something goes wrong, follow this order:

```
Step 1: Check Laravel Pail (terminal)
        → Look for PHP errors, exceptions, query logs.

Step 2: Check Browser Console (F12 → Console)
        → Look for React errors, JS exceptions.

Step 3: Check Network Tab (F12 → Network)
        → Look for failed HTTP requests, 422 validation errors, 500 server errors.

Step 4: Check Queue (terminal)
        → If using jobs/events, check if the queue worker is running.
        → Look for failed jobs: php artisan queue:failed

Step 5: Check Reverb (WebSocket)
        → If real-time features fail, verify Reverb is running.
        → Check VITE_REVERB_* env variables match REVERB_* variables.

Step 6: Clear Caches
        → Run: php artisan optimize:clear
        → Run: npm run dev (restart Vite)
```

---

## Guidelines for AI

### MANDATORY Workflow:
1. **Before any feature**: Print the Feature Implementation Checklist and track progress.
2. **Use naming conventions**: Always follow the Naming Convention Registry table.
3. **Suggest artisan commands** for scaffolding instead of manually creating files.
4. **Check environment state** via `list_dir` and `view_file` before making changes.
5. **Document breaking changes** in commit suggestions.
6. **Follow debug flow** when troubleshooting — don't skip steps.
