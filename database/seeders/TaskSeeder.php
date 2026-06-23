<?php

namespace Database\Seeders;

use App\Domains\CRM\Domain\Models\Task;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Shared\Domain\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $leads = Lead::all();
        $owner = User::role('superadmin')->first() ?? User::first();

        if ($leads->isEmpty()) {
            return;
        }

        // Buat 1 task contoh untuk Lead yang ada
        Task::create([
            'id' => Str::uuid(),
            'lead_id' => $leads->first()->id,
            'assigned_to' => $owner->id,
            'title' => 'Follow-up Call Pertama',
            'due_date' => now()->addDays(1),
            'is_completed' => false,
            'created_at' => now(),
        ]);
    }
}
