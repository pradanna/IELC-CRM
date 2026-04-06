<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            'view leads',
            'create leads',
            'edit leads',
            'delete leads',
            'assign leads',
            'view dashboard',
            'view reports',
            'manage branches',
            'manage users',
        ];

        foreach ($permissions as $permission) {
            \Spatie\Permission\Models\Permission::findOrCreate($permission);
        }

        // Roles
        \Spatie\Permission\Models\Role::findOrCreate('superadmin')->givePermissionTo(\Spatie\Permission\Models\Permission::all());
        \Spatie\Permission\Models\Role::findOrCreate('marketing')->givePermissionTo(['view leads', 'create leads', 'edit leads', 'view dashboard', 'view reports']);
        \Spatie\Permission\Models\Role::findOrCreate('frontdesk')->givePermissionTo(['view leads', 'create leads', 'edit leads', 'view dashboard']);
        \Spatie\Permission\Models\Role::findOrCreate('finance')->givePermissionTo(['view dashboard', 'view reports']);
    }
}
