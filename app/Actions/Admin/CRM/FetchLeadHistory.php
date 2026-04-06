<?php

namespace App\Actions\Admin\CRM;

use App\Models\Lead;
use Illuminate\Support\Collection;

class FetchLeadHistory
{
    public function handle(Lead $lead): Collection
    {
        return $lead->activities()
            ->with('causer')
            ->latest()
            ->get()
            ->map(fn($log) => [
                'id'          => $log->id,
                'description' => $log->description,
                'properties'  => $log->properties,
                'causer_name' => $log->causer?->name ?? 'System',
                'created_at'  => $log->created_at->toISOString(),
                'human_at'    => $log->created_at->diffForHumans(),
            ]);
    }
}
