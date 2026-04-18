<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // If it's an Inertia request for the full page
        if (!$request->wantsJson()) {
            return Inertia::render('Admin/Notifications/Index', [
                'notifications' => $user->notifications()->paginate(20)
            ]);
        }

        // If it's an AJAX request (e.g. from the dropdown)
        return response()->json([
            'notifications' => $user->unreadNotifications()->take(10)->get(),
            'unread_count' => $user->unreadNotifications()->count()
        ]);
    }

    public function markAsRead($id)
    {
        $notification = Auth::user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();

        return response()->json(['success' => true]);
    }
}
