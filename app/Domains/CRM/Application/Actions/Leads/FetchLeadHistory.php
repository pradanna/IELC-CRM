<?php

namespace App\Domains\CRM\Application\Actions\Leads;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\LeadType;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\InfoSource;
use App\Domains\Shared\Domain\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class FetchLeadHistory
{
    /**
     * Mapping of foreign-key fields to their lookup tables.
     * Key = attribute name stored in activity log, Value = [Model class, display column].
     */
    private const RESOLVABLE_FIELDS = [
        'lead_phase_id'  => [LeadPhase::class,  'name', 'Phase'],
        'lead_type_id'   => [LeadType::class,   'name', 'Minat Program'],
        'lead_source_id' => [LeadSource::class,  'name', 'Info Source'],
        'branch_id'      => [Branch::class,      'name', 'Branch'],
        'info_source_id' => [InfoSource::class,  'name', 'Info Source Detail'],
        'owner_id'       => [null,               'name', 'Owner'],
        'created_by'     => [null,               'name', 'Created By'],
    ];

    public function handle(Lead $lead): LengthAwarePaginator
    {
        // Pre-load lookup maps so we don't N+1 query inside the loop
        $lookups = $this->buildLookupMaps();

        return $lead->activities()
            ->with('causer')
            ->latest()
            ->paginate(10)
            ->through(fn($log) => [
                'id'          => $log->id,
                'description' => $log->description,
                'changes'     => $this->formatChanges($log, $lookups),
                'causer'      => [
                    'name' => $log->causer?->name ?? 'System',
                ],
                'created_at'  => $log->created_at->toISOString(),
                'human_at'    => $log->created_at->diffForHumans(),
            ]);
    }

    /**
     * Build id → name lookup maps for all resolvable foreign-key fields.
     */
    private function buildLookupMaps(): array
    {
        $maps = [];
        foreach (self::RESOLVABLE_FIELDS as $field => [$modelClass, $displayColumn, $label]) {
            if ($modelClass !== null) {
                $maps[$field] = $modelClass::pluck($displayColumn, 'id')->all();
            }
        }

        // Custom map for Users (since Name is a dynamic attribute)
        $userMap = [];
        $users = User::with(['superadmin', 'marketing', 'frontdesk', 'finance', 'teacher'])->get();
        foreach ($users as $user) {
            $userMap[$user->id] = $user->name ?? 'Unknown User';
        }
        $maps['owner_id'] = $userMap;
        $maps['created_by'] = $userMap;

        return $maps;
    }

    /**
     * Format the changes array, resolving UUIDs to human-readable names.
     */
    private function formatChanges($log, array $lookups): array
    {
        return collect($log->properties['attributes'] ?? [])
            ->reject(fn($val, $key) => in_array($key, ['updated_at', 'last_activity_at']))
            ->map(function ($value, $key) use ($log, $lookups) {
                // Check if this field has a resolvable lookup
                if (isset(self::RESOLVABLE_FIELDS[$key])) {
                    $map   = $lookups[$key] ?? [];
                    $label = self::RESOLVABLE_FIELDS[$key][2];
                    $oldRaw = $log->properties['old'][$key] ?? null;

                    return [
                        'field' => $label,
                        'old'   => $oldRaw ? ($map[$oldRaw] ?? $oldRaw) : null,
                        'new'   => $value  ? ($map[$value]  ?? $value)  : null,
                    ];
                }

                return [
                    'field' => str_replace('_', ' ', ucfirst($key)),
                    'old'   => $log->properties['old'][$key] ?? null,
                    'new'   => $value,
                ];
            })->values()->all();
    }
}



