<?php

namespace Database\Seeders;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\ItStaff;
use App\Domains\Shared\Domain\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class ItStaffSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ensure role exists
        $role = Role::findOrCreate('it_staff', 'web');
        $role->givePermissionTo(\Spatie\Permission\Models\Permission::all());

        // Get default branch (Solo or first branch)
        $branch = Branch::where('code', 'SOLO')->first() ?? Branch::first();

        // Create or update IT Staff user
        $user = User::updateOrCreate(
            ['email' => 'itstaff@ielc.com'],
            [
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'branch_id' => $branch?->id,
            ]
        );

        // Assign role
        $user->syncRoles(['it_staff']);

        // Create or update IT Staff profile
        ItStaff::updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => 'IT Staff IELC',
                'phone' => '081234567899',
                'address' => 'Kantor Pusat IELC Solo',
            ]
        );

        $this->command?->info("Akun IT Staff berhasil dibuat: itstaff@ielc.com (password: password)");
    }
}
