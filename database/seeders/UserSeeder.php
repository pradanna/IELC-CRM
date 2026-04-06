<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $soloBranch = \App\Models\Branch::where('code', 'SOLO')->first();
        $semarangBranch = \App\Models\Branch::where('code', 'SMG')->first();

        $users = [
            [
                'name' => 'Super Admin',
                'email' => 'superadmin@ielc.com',
                'role' => 'superadmin',
                'branch_id' => $soloBranch?->id,
            ],
            [
                'name' => 'Marketing IELC',
                'email' => 'marketing@ielc.com',
                'role' => 'marketing',
                'branch_id' => $soloBranch?->id,
            ],
            [
                'name' => 'Frontdesk IELC',
                'email' => 'frontdesk@ielc.com',
                'role' => 'frontdesk',
                'branch_id' => $soloBranch?->id,
            ],
            [
                'name' => 'Finance IELC',
                'email' => 'finance@ielc.com',
                'role' => 'finance',
                'branch_id' => $semarangBranch?->id,
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'branch_id' => $userData['branch_id'],
                ]
            );

            $user->assignRole($userData['role']);

            // Create/Update the specific profile
            $profileData = [
                'user_id' => $user->id,
                'name' => $userData['name'],
            ];

            match ($userData['role']) {
                'superadmin' => \App\Models\Superadmin::updateOrCreate(['user_id' => $user->id], $profileData),
                'marketing' => \App\Models\Marketing::updateOrCreate(['user_id' => $user->id], $profileData),
                'frontdesk' => \App\Models\Frontdesk::updateOrCreate(['user_id' => $user->id], $profileData),
                'finance' => \App\Models\Finance::updateOrCreate(['user_id' => $user->id], $profileData),
                default => null,
            };
        }
    }
}
