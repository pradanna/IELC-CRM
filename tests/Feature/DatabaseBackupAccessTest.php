<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Master\Domain\Models\ItStaff;
use App\Domains\Master\Domain\Models\Superadmin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class DatabaseBackupAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles
        Role::findOrCreate('it_staff', 'web');
        Role::findOrCreate('superadmin', 'web');
        Role::findOrCreate('frontdesk', 'web');
        Role::findOrCreate('marketing', 'web');
        Role::findOrCreate('finance', 'web');
        Role::findOrCreate('teacher', 'web');
    }

    /**
     * Test that IT Staff CAN access database backup index.
     */
    public function test_it_staff_can_access_database_backup_index(): void
    {
        $user = User::factory()->create();
        $user->assignRole('it_staff');
        ItStaff::create([
            'user_id' => $user->id,
            'name' => 'IT Staff Member',
        ]);

        $response = $this->actingAs($user)->get('/admin/system/backup');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Admin/System/Backup'));
    }

    /**
     * Test that IT Staff CAN trigger backup generation.
     */
    public function test_it_staff_can_generate_backup(): void
    {
        $user = User::factory()->create();
        $user->assignRole('it_staff');
        ItStaff::create([
            'user_id' => $user->id,
            'name' => 'IT Staff Member',
        ]);

        $response = $this->actingAs($user)->post('/admin/system/backup/generate', [
            'format' => 'sql',
            'download_now' => false,
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');
    }

    /**
     * Test that Superadmin is FORBIDDEN from accessing database backup index.
     */
    public function test_superadmin_cannot_access_database_backup_index(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');
        Superadmin::create([
            'user_id' => $user->id,
            'name' => 'Super Admin User',
        ]);

        $response = $this->actingAs($user)->get('/admin/system/backup');

        $response->assertStatus(403);
    }

    /**
     * Test that Superadmin is FORBIDDEN from generating backup.
     */
    public function test_superadmin_cannot_generate_backup(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');
        Superadmin::create([
            'user_id' => $user->id,
            'name' => 'Super Admin User',
        ]);

        $response = $this->actingAs($user)->post('/admin/system/backup/generate', [
            'format' => 'sql',
            'download_now' => false,
        ]);

        $response->assertStatus(403);
    }

    /**
     * Test that Superadmin is FORBIDDEN from downloading backup.
     */
    public function test_superadmin_cannot_download_backup(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');
        Superadmin::create([
            'user_id' => $user->id,
            'name' => 'Super Admin User',
        ]);

        $response = $this->actingAs($user)->get('/admin/system/backup/download/test_backup.sql');

        $response->assertStatus(403);
    }

    /**
     * Test that Superadmin is FORBIDDEN from deleting backup.
     */
    public function test_superadmin_cannot_delete_backup(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');
        Superadmin::create([
            'user_id' => $user->id,
            'name' => 'Super Admin User',
        ]);

        $response = $this->actingAs($user)->delete('/admin/system/backup/test_backup.sql');

        $response->assertStatus(403);
    }

    /**
     * Test that other staff roles (frontdesk, marketing, finance, teacher) are also FORBIDDEN.
     */
    public function test_other_roles_cannot_access_database_backup(): void
    {
        $forbiddenRoles = ['frontdesk', 'marketing', 'finance', 'teacher'];

        foreach ($forbiddenRoles as $role) {
            $user = User::factory()->create();
            $user->assignRole($role);

            $response = $this->actingAs($user)->get('/admin/system/backup');
            $response->assertStatus(403);
        }
    }

    /**
     * Test that guest is redirected to login.
     */
    public function test_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/admin/system/backup');

        $response->assertRedirect('/login');
    }
}
