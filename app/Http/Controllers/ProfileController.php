<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->only('email'));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        $name = $request->validated()['name'] ?? '';
        if ($user->superadmin) {
            $user->superadmin->update(['name' => $name]);
        } elseif ($user->marketing) {
            $user->marketing->update(['name' => $name]);
        } elseif ($user->frontdesk) {
            $user->frontdesk->update(['name' => $name]);
        } elseif ($user->finance) {
            $user->finance->update(['name' => $name]);
        } elseif ($user->teacher) {
            $user->teacher->update(['name' => $name]);
        } else {
            \App\Domains\Master\Domain\Models\Superadmin::updateOrCreate(
                ['user_id' => $user->id],
                ['name' => $name]
            );
        }

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}


