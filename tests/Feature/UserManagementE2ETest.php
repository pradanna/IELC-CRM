<?php

namespace Tests\Feature;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserManagementE2ETest extends TestCase
{
    use RefreshDatabase;

    protected User $superadmin;
    protected User $frontdeskUser;
    protected Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'superadmin']);
        Role::firstOrCreate(['name' => 'frontdesk']);
        Role::firstOrCreate(['name' => 'marketing']);
        Role::firstOrCreate(['name' => 'finance']);
        Role::firstOrCreate(['name' => 'teacher']);

        $this->branch = Branch::create(['name' => 'Solo Campus', 'code' => 'SOLO']);

        $this->superadmin = User::factory()->create(['branch_id' => $this->branch->id]);
        $this->superadmin->assignRole('superadmin');

        $this->frontdeskUser = User::factory()->create(['branch_id' => $this->branch->id]);
        $this->frontdeskUser->assignRole('frontdesk');
    }

    public function test_non_superadmin_cannot_access_user_management(): void
    {
        // Frontdesk attempts to view user management
        $response = $this->actingAs($this->frontdeskUser)->get(route('admin.master.users.index'));
        $response->assertForbidden();
    }

    public function test_superadmin_can_view_user_management_screen(): void
    {
        $response = $this->actingAs($this->superadmin)->get(route('admin.master.users.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Master/UserManagement')
            ->has('users')
            ->has('roles')
            ->has('branches')
            ->has('counts.active')
            ->has('counts.trashed')
        );
    }

    public function test_superadmin_can_create_new_staff_with_role_profile(): void
    {
        $payload = [
            'name' => 'Siti Marketing',
            'email' => 'siti.marketing@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'marketing',
            'branch_id' => $this->branch->id,
            'phone' => '081234567899',
            'address' => 'Jl. Merbabu No. 10',
        ];

        $response = $this->actingAs($this->superadmin)->post(route('admin.master.users.store'), $payload);
        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'email' => 'siti.marketing@example.com',
            'branch_id' => $this->branch->id,
        ]);

        $newUser = User::where('email', 'siti.marketing@example.com')->first();
        $this->assertNotNull($newUser);
        $this->assertTrue($newUser->hasRole('marketing'));

        // Check marketing profile record
        $this->assertDatabaseHas('marketing', [
            'user_id' => $newUser->id,
            'name' => 'Siti Marketing',
            'phone' => '081234567899',
        ]);
    }

    public function test_superadmin_can_update_staff_details(): void
    {
        $teacherUser = User::factory()->create(['branch_id' => $this->branch->id]);
        $teacherUser->assignRole('teacher');
        \App\Domains\Academic\Domain\Models\Teacher::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $teacherUser->id,
            'name' => 'Guru Lama',
            'phone' => '081111111111',
            'address' => 'Alamat Lama',
        ]);

        $updatePayload = [
            'name' => 'Guru Baru Update',
            'email' => 'guru.baru@example.com',
            'role' => 'teacher',
            'branch_id' => $this->branch->id,
            'phone' => '082222222222',
            'address' => 'Alamat Baru',
        ];

        $response = $this->actingAs($this->superadmin)->put(route('admin.master.users.update', $teacherUser->id), $updatePayload);
        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $teacherUser->refresh();
        $this->assertEquals('guru.baru@example.com', $teacherUser->email);
        $this->assertEquals('Guru Baru Update', $teacherUser->teacher->name);
        $this->assertEquals('082222222222', $teacherUser->teacher->phone);
    }

    public function test_superadmin_can_soft_delete_and_restore_user(): void
    {
        $targetUser = User::factory()->create(['branch_id' => $this->branch->id]);
        $targetUser->assignRole('frontdesk');

        // 1. Soft delete
        $deleteResponse = $this->actingAs($this->superadmin)->delete(route('admin.master.users.destroy', $targetUser->id));
        $deleteResponse->assertRedirect();
        $deleteResponse->assertSessionHas('success');

        $this->assertSoftDeleted('users', ['id' => $targetUser->id]);

        // 2. Restore
        $restoreResponse = $this->actingAs($this->superadmin)->patch(route('admin.master.users.restore', $targetUser->id));
        $restoreResponse->assertRedirect();
        $restoreResponse->assertSessionHas('success');

        $this->assertNotSoftDeleted('users', ['id' => $targetUser->id]);
    }

    public function test_superadmin_can_permanently_force_delete_trashed_user(): void
    {
        $targetUser = User::factory()->create(['branch_id' => $this->branch->id]);
        $targetUser->assignRole('marketing');
        $marketingProfile = \App\Domains\CRM\Domain\Models\Marketing::create([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $targetUser->id,
            'name' => 'Marketing Trashed',
            'phone' => '083333333333',
        ]);

        $targetUser->delete();
        $this->assertSoftDeleted('users', ['id' => $targetUser->id]);

        // Force delete
        $forceResponse = $this->actingAs($this->superadmin)->delete(route('admin.master.users.force-delete', $targetUser->id));
        $forceResponse->assertRedirect();
        $forceResponse->assertSessionHas('success');

        $this->assertDatabaseMissing('users', ['id' => $targetUser->id]);
        $this->assertDatabaseMissing('marketing', ['id' => $marketingProfile->id]);
    }
}
