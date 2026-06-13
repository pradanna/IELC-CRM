<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $isAdmin = $request->user() && $request->is('admin*');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? array_merge($request->user()->load(['superadmin', 'marketing', 'frontdesk', 'finance'])->toArray(), [
                    'role' => $request->user()->hasRole('superadmin') ? 'superadmin' : $request->user()->getRoleNames()->first(),
                ]) : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'newLeadId' => $request->session()->get('newLeadId'),
                'new_invoice_id' => $request->session()->get('new_invoice_id'),
                'download_url' => $request->session()->get('download_url'),
            ],
            'waServerUrl' => config('services.whatsapp.url'),
            'pending_registrations_count' => $request->user() ? \App\Domains\CRM\Domain\Models\LeadRegistration::where('status', 'pending')->count() : 0,
            
            // CRM Shared Lookups for Layouts/Modals
            'branches' => $isAdmin ? \App\Http\Resources\Master\BranchResource::collection(\App\Domains\Master\Domain\Models\Branch::select('id', 'name')->get()) : null,
            'phases' => $isAdmin ? \App\Http\Resources\Crm\LeadPhaseResource::collection(\App\Domains\Master\Domain\Models\LeadPhase::select('id', 'name', 'code')->get()) : null,
            'sources' => $isAdmin ? \App\Http\Resources\Crm\LeadSourceResource::collection(\App\Domains\Master\Domain\Models\LeadSource::select('id', 'name')->get()) : null,
            'infoSources' => $isAdmin ? \App\Http\Resources\Crm\InfoSourceResource::collection(\App\Domains\Master\Domain\Models\InfoSource::select('id', 'name')->get()) : null,
            'types' => $isAdmin ? \App\Http\Resources\Crm\LeadTypeResource::collection(\App\Domains\Master\Domain\Models\LeadType::select('id', 'name')->get()) : null,
            'provinces' => $isAdmin ? \App\Domains\Master\Domain\Models\Province::select('id', 'name')->orderBy('name')->get() : null,
        ];
    }
}


