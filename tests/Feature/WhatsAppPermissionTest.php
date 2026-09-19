<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Services\WhatsAppService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Mockery;

class WhatsAppPermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_roles_can_send_whatsapp(): void
    {
        // Mock WhatsAppService
        $mockWa = Mockery::mock(WhatsAppService::class);
        $mockWa->shouldReceive('sendMessage')->andReturn(['success' => true, 'message' => 'Message sent successfully']);
        $mockWa->shouldReceive('getStatus')->andReturn(['connected' => true]);
        $mockWa->shouldReceive('getHistory')->andReturn([]);
        $this->app->instance(WhatsAppService::class, $mockWa);

        $owner = User::factory()->create();
        $branch = Branch::create(['name' => 'Solo Branch', 'code' => 'solo']);
        $phase = LeadPhase::create(['name' => 'New Lead', 'code' => 'new-lead', 'status' => 'active']);
        $lead = Lead::create([
            'name' => 'Budi Tester',
            'phone' => '08975050520',
            'owner_id' => $owner->id,
            'branch_id' => $branch->id,
            'lead_phase_id' => $phase->id,
            'lead_number' => 'LD-001',
        ]);

        $roles = ['superadmin', 'finance', 'frontdesk', 'marketing', 'teacher'];

        foreach ($roles as $roleName) {
            $role = Role::create(['name' => $roleName]);
            $user = User::factory()->create();
            $user->assignRole($role);

            // 1. Test /admin/whatsapp/send
            $response1 = $this->actingAs($user)->postJson('/admin/whatsapp/send', [
                'branch' => 'solo',
                'phone' => '628975050520',
                'message' => 'Test message',
            ]);
            $this->assertNotEquals(403, $response1->status(), "Role {$roleName} should NOT get 403 on /admin/whatsapp/send");
            $this->assertEquals(200, $response1->status(), "Role {$roleName} should get 200 on /admin/whatsapp/send");

            // 2. Test /admin/crm/leads/{lead}/send-whatsapp
            $response2 = $this->actingAs($user)->postJson("/admin/crm/leads/{$lead->id}/send-whatsapp", [
                'message' => 'Test lead message',
            ]);
            $this->assertNotEquals(403, $response2->status(), "Role {$roleName} should NOT get 403 on /admin/crm/leads/send-whatsapp");
            $this->assertEquals(200, $response2->status(), "Role {$roleName} should get 200 on /admin/crm/leads/send-whatsapp");

            // 3. Test /admin/whatsapp/inbox
            $response3 = $this->actingAs($user)->get('/admin/whatsapp/inbox');
            $this->assertNotEquals(403, $response3->status(), "Role {$roleName} should NOT get 403 on /admin/whatsapp/inbox");

            // 4. Test /admin/whatsapp index
            $response4 = $this->actingAs($user)->get('/admin/whatsapp');
            $this->assertNotEquals(403, $response4->status(), "Role {$roleName} should NOT get 403 on /admin/whatsapp");
        }
    }
}
