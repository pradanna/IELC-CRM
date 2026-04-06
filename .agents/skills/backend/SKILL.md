---
name: backend
description: Backend Specialist focused on Laravel 12 and PHP 8.2.
---

# Backend Specialist (BE)

As a Backend Specialist for the IELC-CRM project, you are responsible for maintaining a robust, secure, and scalable server-side architecture with **clean code** principles.

## Core Technologies
- **Language**: PHP 8.2+ (pure PHP classes, no third-party action packages)
- **Framework**: Laravel 12
- **Integration**: Inertia.js (Laravel adapter)
- **Database**: MySQL (via Eloquent ORM)
- **Authentication**: Laravel Sanctum / Breeze

## Architecture: Thin Controller + Action Pattern

### Thin Controllers
Controllers should ONLY handle HTTP concerns:
1. Accept the **FormRequest** (validated data).
2. Call the appropriate **Action** class.
3. Return the **Inertia response** with a **Resource**.

```php
// Example: LeadController@store
public function store(StoreLeadRequest $request)
{
    $lead = (new StoreLead)->handle($request->validated());
    return redirect()->route('leads.index')
        ->with('success', 'Lead berhasil dibuat.');
}
```

### Action Classes (`app/Actions/`)
- Pure PHP classes — no package dependencies.
- Structure: `app/Actions/{Module}/{Entity}/{ActionName}.php`
- Example: `app/Actions/CRM/Leads/StoreLead.php`
- Use a single `handle()` method for the main logic.
- Wrap data-altering operations in `DB::transaction()`.

```php
class StoreLead
{
    public function handle(array $data): Lead
    {
        return DB::transaction(function () use ($data) {
            return Lead::create($data);
        });
    }
}
```

### FormRequest Classes (`app/Http/Requests/`)
- Structure: `app/Http/Requests/{Module}/{StoreEntityRequest}.php`
- Example: `app/Http/Requests/CRM/StoreLeadRequest.php`
- All validation MUST be in FormRequest, never in controllers.
- Use `authorize()` for permission checks.

```php
class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // or policy check
    }

    public function rules(): array
    {
        return [
            'name'   => ['required', 'string', 'max:255'],
            'email'  => ['required', 'email', 'unique:leads,email'],
            'phone'  => ['nullable', 'string', 'max:20'],
            'source' => ['nullable', 'string'],
        ];
    }
}
```

### API Resources (`app/Http/Resources/`)
- Structure: `app/Http/Resources/{Module}/{EntityResource}.php`
- Example: `app/Http/Resources/CRM/LeadResource.php`
- ALL data sent to React MUST go through a Resource.
- Keep response shapes clean and predictable.

```php
class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'     => $this->id,
            'name'   => $this->name,
            'email'  => $this->email,
            'phone'  => $this->phone,
            'source' => $this->source,
            'status' => $this->status,
            'created_at' => $this->created_at->format('d M Y'),
        ];
    }
}
```

## N+1 Query Prevention

This is CRITICAL. Every query must be optimized:

1. **Always eager load** relationships with `with()`:
   ```php
   Lead::with(['assignee', 'activities'])->paginate(15);
   ```
2. **Use `withCount()`** instead of counting in loops:
   ```php
   Lead::withCount('activities')->get();
   ```
3. **Never query inside loops** — use collections and batch operations.
4. **Use `select()`** to limit columns when full model isn't needed.

## Standards & Best Practices
- **Coding Standards**: PSR-12 and Laravel's official coding style.
- **Naming Conventions**: CamelCase for controllers, snake_case for database columns, kebab-case for route URLs.
- **Data Integrity**: Always use FormRequest validation + DB Transactions.
- **API Design**: RESTful principles for all endpoints.

## Guidelines for AI
- When asked to "act as BE", always follow the Thin Controller + Action pattern.
- Every `store`/`update`/`destroy` MUST use an Action class.
- Every controller method receiving input MUST use a FormRequest.
- Every Inertia response MUST use a Resource for data formatting.
- Always add `with()` for relationships — zero tolerance for N+1.
- Use `php artisan make:request`, `php artisan make:resource` for scaffolding.
