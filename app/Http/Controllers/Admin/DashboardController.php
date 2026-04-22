<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\Dashboard\FetchSuperadminDashboardData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class DashboardController extends Controller
{
    public function index(): Response|RedirectResponse
    {
        if (auth()->user()?->hasRole('finance')) {
            return redirect()->route('admin.finance.dashboard');
        }
        $dashboardData = (new FetchSuperadminDashboardData)->handle();

        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => $dashboardData,
        ]);
    }
}
