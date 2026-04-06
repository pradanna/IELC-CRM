<?php

namespace App\Actions\CRM\Leads;

use App\Models\Lead;
use Illuminate\Support\Facades\DB;

class StoreLead
{
    public function handle(array $data): Lead
    {
        return DB::transaction(function () use ($data) {
            $count = Lead::withTrashed()->count() + 1;
            $leadNumber = 'LD-' . str_pad($count, 6, '0', STR_PAD_LEFT);
            
            // If name is null, default to "Leads [number]" as requested
            $name = $data['name'] ?? "Leads {$count}";

            $lead = Lead::create([
                'lead_number' => $leadNumber,
                'name'        => $name,
                'phone'       => $data['phone'],
                'email'       => $data['email'] ?? null,
                'branch_id'   => $data['branch_id'],
                'owner_id'    => auth()->id(), // Set current user as owner
                'lead_type'   => $data['lead_type'] ?? null,
                'is_online'   => $data['is_online'] ?? false,
                'province'    => $data['province'] ?? null,
                'city'        => $data['city'] ?? null,
            ]);

            // Save Guardians (HasMany)
            if (!empty($data['guardians'])) {
                foreach ($data['guardians'] as $guardian) {
                    $lead->guardians()->create($guardian);
                }
            }

            return $lead;
        });
    }
}
