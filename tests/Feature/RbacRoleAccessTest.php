<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Master\Domain\Models\Branch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class RbacRoleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected User $marketingUser;
    protected User $frontdeskUser;
    protected User $financeUser;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('superadmin');
        Role::findOrCreate('it_staff');
        Role::findOrCreate('marketing');
        Role::findOrCreate('frontdesk');
        Role::findOrCreate('finance');

        $branch = Branch::create(['name' => 'Solo Branch', 'code' => 'solo']);

        $this->marketingUser = User::factory()->create(['branch_id' => $branch->id]);
        $this->marketingUser->assignRole('marketing');

        $this->frontdeskUser = User::factory()->create(['branch_id' => $branch->id]);
        $this->frontdeskUser->assignRole('frontdesk');

        $this->financeUser = User::factory()->create(['branch_id' => $branch->id]);
        $this->financeUser->assignRole('finance');
    }

    public function test_marketing_can_access_specified_modules(): void
    {
        // 1. CRM Dashboard
        $response = $this->actingAs($this->marketingUser)->get(route('admin.crm.leads.index'));
        $this->assertNotEquals(403, $response->status(), 'Marketing should be able to access CRM dashboard');

        // 2. WhatsApp Web / Inbox
        $response = $this->actingAs($this->marketingUser)->get(route('admin.whatsapp.inbox'));
        $this->assertNotEquals(403, $response->status(), 'Marketing should be able to access WhatsApp inbox');

        // 3. Placement Tests
        $response = $this->actingAs($this->marketingUser)->get(route('admin.crm.pt-sessions.index'));
        $this->assertNotEquals(403, $response->status(), 'Marketing should be able to access Placement Tests');

        // 4. Students
        $response = $this->actingAs($this->marketingUser)->get(route('admin.academic.students.index'));
        $this->assertNotEquals(403, $response->status(), 'Marketing should be able to access Students');

        // 5. Classes
        $response = $this->actingAs($this->marketingUser)->get(route('admin.academic.study-classes.index'));
        $this->assertNotEquals(403, $response->status(), 'Marketing should be able to access Classes');
    }

    public function test_frontdesk_can_access_only_whatsapp_student_and_classes(): void
    {
        // Allowed: WhatsApp Inbox
        $response = $this->actingAs($this->frontdeskUser)->get(route('admin.whatsapp.inbox'));
        $this->assertNotEquals(403, $response->status(), 'Frontdesk should be able to access WhatsApp inbox');

        // Allowed: Students
        $response = $this->actingAs($this->frontdeskUser)->get(route('admin.academic.students.index'));
        $this->assertNotEquals(403, $response->status(), 'Frontdesk should be able to access Students');

        // Allowed: Classes
        $response = $this->actingAs($this->frontdeskUser)->get(route('admin.academic.study-classes.index'));
        $this->assertNotEquals(403, $response->status(), 'Frontdesk should be able to access Classes');

        // FORBIDDEN: CRM Dashboard
        $response = $this->actingAs($this->frontdeskUser)->get(route('admin.crm.leads.index'));
        $this->assertEquals(403, $response->status(), 'Frontdesk must NOT be able to access CRM dashboard');

        // FORBIDDEN: Placement Tests
        $response = $this->actingAs($this->frontdeskUser)->get(route('admin.crm.pt-sessions.index'));
        $this->assertEquals(403, $response->status(), 'Frontdesk must NOT be able to access Placement Tests');

        // FORBIDDEN: Master Data
        $response = $this->actingAs($this->frontdeskUser)->get(route('admin.master.index'));
        $this->assertEquals(403, $response->status(), 'Frontdesk must NOT be able to access Master data');
    }

    public function test_frontdesk_redirected_to_students_from_root_and_dashboard(): void
    {
        $response1 = $this->actingAs($this->frontdeskUser)->get('/');
        $response1->assertRedirect(route('admin.academic.students.index'));

        $response2 = $this->actingAs($this->frontdeskUser)->get('/dashboard');
        $response2->assertRedirect(route('admin.academic.students.index'));
    }

    public function test_frontdesk_redirected_to_students_on_login(): void
    {
        $loginResponse = $this->post('/login', [
            'email' => $this->frontdeskUser->email,
            'password' => 'password',
        ]);
        $loginResponse->assertRedirect(route('admin.academic.students.index'));
    }

    public function test_finance_can_access_students_and_classes(): void
    {
        // 1. Allowed: Students
        $response = $this->actingAs($this->financeUser)->get(route('admin.academic.students.index'));
        $this->assertNotEquals(403, $response->status(), 'Finance should be able to access Students');

        // 2. Allowed: Classes
        $response = $this->actingAs($this->financeUser)->get(route('admin.academic.study-classes.index'));
        $this->assertNotEquals(403, $response->status(), 'Finance should be able to access Classes');

        // 3. Allowed: Finance Dashboard
        $response = $this->actingAs($this->financeUser)->get(route('admin.finance.dashboard'));
        $this->assertNotEquals(403, $response->status(), 'Finance should be able to access Finance Dashboard');

        // 4. FORBIDDEN: CRM Dashboard
        $response = $this->actingAs($this->financeUser)->get(route('admin.crm.leads.index'));
        $this->assertEquals(403, $response->status(), 'Finance must NOT be able to access CRM dashboard');

        // 5. FORBIDDEN: Master Data
        $response = $this->actingAs($this->financeUser)->get(route('admin.master.index'));
        $this->assertEquals(403, $response->status(), 'Finance must NOT be able to access Master data');
    }
}
