<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreUserRequest;
use App\Http\Requests\Master\UpdateUserRequest;
use App\Models\Branch;
use App\Models\User;
use App\Models\Superadmin;
use App\Models\Marketing;
use App\Models\Frontdesk;
use App\Models\Finance;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Master/UserManagement', [
            'users' => User::with(['roles', 'branch', 'superadmin', 'marketing', 'frontdesk', 'finance', 'teacher'])
                ->latest()
                ->get()
                ->map(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->first()?->name,
                    'branch_id' => $user->branch_id,
                    'branch_name' => $user->branch?->name,
                    'phone' => $user->superadmin?->phone ?? $user->marketing?->phone ?? $user->frontdesk?->phone ?? $user->finance?->phone ?? $user->teacher?->phone,
                    'address' => $user->superadmin?->address ?? $user->marketing?->address ?? $user->frontdesk?->address ?? $user->finance?->address ?? $user->teacher?->address,
                    'created_at' => $user->created_at->format('d M Y'),
                ]),
            'roles' => Role::all(['id', 'name']),
            'branches' => Branch::all(['id', 'name']),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $user = User::create([
                'id' => Str::uuid(),
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'branch_id' => $request->branch_id,
            ]);

            $user->assignRole($request->role);

            $profileData = [
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'name' => $request->name,
                'phone' => $request->phone,
                'address' => $request->address,
            ];

            match ($request->role) {
                'superadmin' => Superadmin::create($profileData),
                'marketing' => Marketing::create($profileData),
                'frontdesk' => Frontdesk::create($profileData),
                'finance' => Finance::create($profileData),
                'teacher' => Teacher::create($profileData),
                default => null,
            };
        });

        return redirect()->back()->with('success', 'User berhasil dibuat.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        DB::transaction(function () use ($request, $user) {
            $user->update([
                'email' => $request->email,
                'branch_id' => $request->branch_id,
            ]);

            if ($request->filled('password')) {
                $user->update(['password' => Hash::make($request->password)]);
            }

            // Sync Role
            $user->syncRoles([$request->role]);

            $profileData = [
                'name' => $request->name,
                'phone' => $request->phone,
                'address' => $request->address,
            ];

            // Update appropriate profile
            $profile = match ($request->role) {
                'superadmin' => $user->superadmin(),
                'marketing' => $user->marketing(),
                'frontdesk' => $user->frontdesk(),
                'finance' => $user->finance(),
                'teacher' => $user->teacher(),
                default => null,
            };

            if ($profile) {
                $profile->update($profileData);
            }
        });

        return redirect()->back()->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();
        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }
}
