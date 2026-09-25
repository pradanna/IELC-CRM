<?php

namespace App\Http\Controllers\Admin\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreUserRequest;
use App\Http\Requests\Master\UpdateUserRequest;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Master\Domain\Models\Superadmin;
use App\Domains\CRM\Domain\Models\Marketing;
use App\Domains\Master\Domain\Models\Frontdesk;
use App\Domains\Master\Domain\Models\Finance;
use App\Domains\Academic\Domain\Models\Teacher;
use App\Domains\Master\Domain\Models\ItStaff;
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
    public function index(\Illuminate\Http\Request $request): Response
    {
        $status = $request->get('status', 'active');

        $query = User::with(['roles', 'branch', 'superadmin', 'marketing', 'frontdesk', 'finance', 'teacher', 'itStaff']);

        if ($status === 'trashed') {
            $query->onlyTrashed();
        } elseif ($status === 'all') {
            $query->withTrashed();
        }

        return Inertia::render('Admin/Master/UserManagement', [
            'users' => $query
                ->latest()
                ->get()
                ->map(fn($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->roles->first()?->name,
                    'branch_id' => $user->branch_id,
                    'branch_name' => $user->branch?->name,
                    'phone' => $user->superadmin?->phone ?? $user->marketing?->phone ?? $user->frontdesk?->phone ?? $user->finance?->phone ?? $user->teacher?->phone ?? $user->itStaff?->phone,
                    'address' => $user->superadmin?->address ?? $user->marketing?->address ?? $user->frontdesk?->address ?? $user->finance?->address ?? $user->teacher?->address ?? $user->itStaff?->address,
                    'is_deleted' => $user->trashed(),
                    'deleted_at' => $user->deleted_at?->format('d M Y H:i'),
                    'created_at' => $user->created_at->format('d M Y'),
                ]),
            'roles' => Role::all(['id', 'name']),
            'branches' => Branch::all(['id', 'name']),
            'currentStatus' => $status,
            'counts' => [
                'active' => User::count(),
                'trashed' => User::onlyTrashed()->count(),
            ],
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
                'it_staff' => ItStaff::create($profileData),
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
                'it_staff' => $user->itStaff(),
                default => null,
            };

            if ($profile) {
                if ($profile->exists()) {
                    $profile->update($profileData);
                } else {
                    $profile->create(array_merge($profileData, ['id' => Str::uuid()]));
                }
            }
        });

        return redirect()->back()->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage (Soft Delete).
     */
    public function destroy(User $user): RedirectResponse
    {
        $user->delete();
        return redirect()->back()->with('success', 'User berhasil dinonaktifkan (soft delete).');
    }

    /**
     * Restore a soft-deleted user.
     */
    public function restore(string $id): RedirectResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);
        $user->restore();

        return redirect()->back()->with('success', 'Akun user berhasil dipulihkan (restore).');
    }

    /**
     * Permanently delete a user from database.
     */
    public function forceDelete(string $id): RedirectResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);

        DB::transaction(function () use ($user) {
            $user->superadmin()?->delete();
            $user->marketing()?->delete();
            $user->frontdesk()?->delete();
            $user->finance()?->delete();
            $user->teacher()?->delete();
            $user->itStaff()?->delete();
            $user->roles()->detach();
            $user->forceDelete();
        });

        return redirect()->back()->with('success', 'User berhasil dihapus permanen.');
    }
}


