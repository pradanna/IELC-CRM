<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Finance\Domain\Models\PriceMaster;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class StudyClassQuickCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_finance_and_frontdesk_can_create_study_class_via_json(): void
    {
        $branch = Branch::create(['name' => 'Solo Branch', 'code' => 'solo']);
        $priceMaster = PriceMaster::create([
            'name' => 'Private Package 24',
            'price_per_session' => 3600000,
            'total_sessions' => 24,
        ]);

        $roles = ['superadmin', 'frontdesk', 'finance', 'marketing'];

        foreach ($roles as $roleName) {
            $role = Role::create(['name' => $roleName]);
            $user = User::factory()->create();
            $user->assignRole($role);

            // 1. Can access form-data
            $resData = $this->actingAs($user)->getJson(route('admin.academic.study-classes.form-data'));
            $resData->assertStatus(200);
            $resData->assertJsonStructure(['branches', 'instructors', 'priceMasters', 'leadTypes']);

            // 2. Can create class via JSON
            $resCreate = $this->actingAs($user)->postJson(route('admin.academic.study-classes.store'), [
                'name' => "PRIVATE - TEST {$roleName}",
                'branch_id' => $branch->id,
                'price_master_id' => $priceMaster->id,
                'type' => 'offline',
                'category' => 'Private',
                'total_meetings' => 24,
                'meetings_per_week' => 2,
                'schedule_days' => ['Monday', 'Wednesday'],
                'start_session_date' => now()->toDateString(),
                'status' => 'active',
            ]);

            $resCreate->assertStatus(200);
            $resCreate->assertJsonPath('success', true);
            $resCreate->assertJsonPath('class.name', "PRIVATE - TEST {$roleName}");
            $this->assertDatabaseHas('study_classes', [
                'name' => "PRIVATE - TEST {$roleName}",
                'branch_id' => $branch->id,
            ]);
        }
    }

    public function test_invoice_generation_for_private_class_without_end_date_and_schedule_days(): void
    {
        $branch = Branch::create(['name' => 'Solo Branch', 'code' => 'solo']);
        $priceMaster = PriceMaster::create([
            'name' => 'Private (40 Sessions)',
            'price_per_session' => 4000000,
        ]);

        Role::create(['name' => 'superadmin']);
        $role = Role::create(['name' => 'finance']);
        $user = User::factory()->create();
        $user->assignRole($role);

        $lead = \App\Domains\CRM\Domain\Models\Lead::create([
            'lead_number' => 'LT99881',
            'name' => 'Private Lead Customer',
            'phone' => '081999888777',
            'email' => 'private@example.com',
            'branch_id' => $branch->id,
            'owner_id' => $user->id,
        ]);

        $studyClass = \App\Domains\Academic\Domain\Models\StudyClass::create([
            'name' => 'PRIVATE - TEST INVOICE',
            'branch_id' => $branch->id,
            'price_master_id' => $priceMaster->id,
            'type' => 'offline',
            'category' => 'Private',
            'total_meetings' => 40,
            'meetings_per_week' => 1,
            'schedule_days' => [],
            'start_session_date' => now()->toDateString(),
            'end_session_date' => null,
            'status' => 'active',
        ]);

        // Generate invoice with prorata (default)
        $resProrata = $this->actingAs($user)->post(route('admin.finance.invoices.generate'), [
            'lead_id' => $lead->id,
            'study_class_id' => $studyClass->id,
            'price_master_id' => $priceMaster->id,
            'join_date' => now()->toDateString(),
            'billing_mode' => 'prorata',
        ]);

        $resProrata->assertRedirect();
        $this->assertDatabaseHas('invoices', [
            'lead_id' => $lead->id,
            'study_class_id' => $studyClass->id,
            'total_amount' => 4000000,
            'session_count' => 40,
        ]);

        // Generate invoice with full & manual discount
        $resFull = $this->actingAs($user)->post(route('admin.finance.invoices.generate'), [
            'lead_id' => $lead->id,
            'study_class_id' => $studyClass->id,
            'price_master_id' => $priceMaster->id,
            'join_date' => now()->toDateString(),
            'billing_mode' => 'full',
            'manual_discounts' => [
                ['name' => 'Diskon Tambahan', 'amount' => 50000],
            ],
        ]);

        $resFull->assertRedirect();
        $this->assertDatabaseHas('invoices', [
            'lead_id' => $lead->id,
            'study_class_id' => $studyClass->id,
            'total_amount' => 3950000,
            'discount_amount' => 50000,
            'discount_breakdown' => 'Diskon Tambahan: Rp 50.000',
            'session_count' => 40,
        ]);
    }
}
