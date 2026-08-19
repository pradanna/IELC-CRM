<?php

namespace Tests\Feature;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadRelationship;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeadRelationshipStoreTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_lead_with_relationships_saves_relationships_bidirectionally(): void
    {
        $user = User::factory()->create();
        $branch = Branch::create(['name' => 'Solo', 'code' => 'SOLO']);

        $existingLead = Lead::create([
            'lead_number' => 'L-20260721-000001',
            'name' => 'Existing Sibling Lead',
            'phone' => '081234567890',
            'branch_id' => $branch->id,
            'owner_id' => $user->id,
            'created_by' => $user->id,
        ]);

        $response = $this->actingAs($user)->post(route('admin.crm.leads.store'), [
            'name' => 'New Lead Sibling',
            'phone' => '081298765432',
            'branch_id' => $branch->id,
            'relationships' => [
                [
                    'related_lead_id' => $existingLead->id,
                    'type' => 'sibling',
                    'is_main_contact' => false,
                ]
            ]
        ]);

        $response->assertRedirect();

        $newLead = Lead::where('name', 'New Lead Sibling')->first();
        $this->assertNotNull($newLead);

        // Verify forward relationship
        $this->assertDatabaseHas('lead_relationships', [
            'lead_id' => $newLead->id,
            'related_lead_id' => $existingLead->id,
            'type' => 'sibling',
        ]);

        // Verify inverse/bidirectional relationship
        $this->assertDatabaseHas('lead_relationships', [
            'lead_id' => $existingLead->id,
            'related_lead_id' => $newLead->id,
            'type' => 'sibling',
        ]);
    }
}
