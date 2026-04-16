<?php

namespace App\Actions\Crm\Leads;

use App\Models\Lead;
use Illuminate\Pagination\LengthAwarePaginator;

class FetchLeadHistory
{
    public function handle(Lead $lead): LengthAwarePaginator
    {
        return $lead->activities()
            ->with('causer')
            ->latest()
            ->paginate(10)
            ->through(fn($log) => [
                'id'          => $log->id,
                'description' => $log->description,
                'changes'     => collect($log->properties['attributes'] ?? [])
                    ->reject(fn($val, $key) => in_array($key, ['updated_at', 'last_activity_at']))
                    ->map(fn($value, $key) => [
                        'field' => str_replace('_', ' ', ucfirst($key)),
                        'old'   => $log->properties['old'][$key] ?? null,
                        'new'   => $value,
                    ])->values()->all(),
                'causer'      => [
                    'name' => $log->causer?->name ?? 'System',
                ],
                'created_at'  => $log->created_at->toISOString(),
                'human_at'    => $log->created_at->diffForHumans(),
            ]);
    }
}

