<?php

namespace Tests\Feature;

use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadRegistration;
use App\Domains\CRM\Domain\Models\LeadUpdateQueue;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\InfoSource;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Shared\Domain\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PublicRegistrationE2ETest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch;
    protected LeadSource $leadSource;
    protected InfoSource $infoSource;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin']);
        Role::firstOrCreate(['name' => 'frontdesk']);

        $this->branch = Branch::create(['name' => 'Solo Campus', 'code' => 'SOLO']);
        $this->leadSource = LeadSource::create(['name' => 'Website', 'code' => 'website']);
        $this->infoSource = InfoSource::create(['name' => 'Instagram', 'code' => 'instagram']);
        LeadPhase::create(['name' => 'Lead Baru', 'code' => 'lead', 'status' => 'prospective']);
    }

    public function test_public_join_form_renders_successfully(): void
    {
        $response = $this->get(route('public.join.form'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Form')
            ->has('branches')
            ->has('leadSources')
            ->has('infoSources')
            ->where('branch', null)
        );
    }

    public function test_public_join_branch_redirects_to_form(): void
    {
        $response = $this->get('/join/' . $this->branch->code);
        $response->assertRedirect(route('public.join.form'));
    }

    public function test_successful_public_lead_registration_redirects_to_success_page(): void
    {
        $payload = [
            'name' => 'Aditya Pratama',
            'nickname' => 'Adit',
            'phone' => '081234567890',
            'email' => 'aditya@example.com',
            'gender' => 'L',
            'birth_date' => '2008-08-17',
            'branch_id' => $this->branch->id,
            'school' => 'SMA 1 Surakarta',
            'grade' => 'SMA',
            'province' => 'Jawa Tengah',
            'city' => 'Surakarta',
            'address' => 'Jl. Veteran No. 45',
            'postal_code' => '57155',
            'lead_source_id' => $this->leadSource->id,
            'info_source_id' => $this->infoSource->id,
            'guardian_data' => [
                'father_name' => 'Bambang Pratama',
                'father_phone' => '081234567891',
                'mother_name' => 'Sri Pratama',
                'mother_phone' => '081234567892',
            ]
        ];

        $response = $this->post(route('public.join.store'), $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('public.join.success'));
        $response->assertSessionHas('success');

        // Check registration record created in pending state
        $this->assertDatabaseHas('lead_registrations', [
            'name' => 'Aditya Pratama',
            'phone' => '081234567890',
            'status' => 'pending',
        ]);

        $registration = LeadRegistration::where('phone', '081234567890')->first();
        $this->assertEquals('Bambang Pratama', $registration->guardian_data['father_name']);
        $this->assertEquals('081234567891', $registration->guardian_data['father_phone']);

        // Follow redirect to success page
        $successResponse = $this->get(route('public.join.success'));
        $successResponse->assertOk();
        $successResponse->assertInertia(fn (Assert $page) => $page
            ->component('Public/Success')
            ->has('message')
        );
    }

    public function test_registration_fails_with_invalid_phone_number(): void
    {
        $payload = [
            'name' => 'Aditya Pratama',
            'phone' => '12345', // Invalid Indonesian phone format
            'branch_id' => $this->branch->id,
            'guardian_data' => [
                'father_phone' => 'abcde', // Invalid
            ]
        ];

        $response = $this->post(route('public.join.store'), $payload);
        $response->assertSessionHasErrors(['phone', 'guardian_data.father_phone']);
    }

    public function test_admin_can_approve_registration_with_branch_selection(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $registration = LeadRegistration::create([
            'name' => 'Dimas Anggara',
            'phone' => '081298765432',
            'branch_id' => null, // Online / Tanpa Cabang
            'status' => 'pending',
            'lead_source_id' => $this->leadSource->id,
            'info_source_id' => $this->infoSource->id,
        ]);

        // Superadmin approves with selected branch
        $response = $this->actingAs($admin)->post(route('admin.crm.registrations.approve', $registration->id), [
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $registration->refresh();
        $this->assertEquals('approved', $registration->status);

        $this->assertDatabaseHas('leads', [
            'phone' => '081298765432',
            'branch_id' => $this->branch->id,
        ]);
    }

    public function test_self_filling_form_renders_and_submits_to_queue(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('superadmin');

        $lead = Lead::create([
            'lead_number' => 'L-20260914-000001',
            'name' => 'Citra Dewi',
            'phone' => '081398765432',
            'branch_id' => $this->branch->id,
            'owner_id' => $admin->id,
            'created_by' => $admin->id,
            'self_registration_token' => 'test-valid-public-token-123',
        ]);

        // Access self filling form via token
        $response = $this->get(route('public.join.filling', ['token' => 'test-valid-public-token-123']));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Form')
            ->where('token', 'test-valid-public-token-123')
            ->where('initialData.name', 'Citra Dewi')
        );

        // Submit self-filling updates
        $updatePayload = [
            'name' => 'Citra Dewi Updated',
            'nickname' => 'Citra',
            'phone' => '081398765432',
            'email' => 'citra.updated@example.com',
            'gender' => 'P',
            'birth_date' => '2005-03-20',
            'branch_id' => $this->branch->id,
            'school' => 'Universitas Sebelas Maret',
            'grade' => 'UMUM',
            'guardian_data' => [
                'father_name' => 'Joko Dewi',
                'father_phone' => '081299998888',
            ]
        ];

        $submitResponse = $this->post(route('public.join.filling.submit', ['token' => 'test-valid-public-token-123']), $updatePayload);
        $submitResponse->assertSessionHasNoErrors();
        $submitResponse->assertRedirect();
        $submitResponse->assertSessionHas('success');

        // Verify pending_updates field on Lead
        $lead->refresh();
        $this->assertEquals('Citra Dewi Updated', $lead->pending_updates['name']);
        $this->assertEquals('Joko Dewi', $lead->pending_updates['guardian_data']['father_name']);
    }
}
