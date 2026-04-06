<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Admin\Dashboard\FetchSuperadminDashboardData;
use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $dashboardData = (new FetchSuperadminDashboardData)->handle();

        return Inertia::render('Admin/Dashboard/Index', [
            'stats' => $dashboardData,
        ]);
    }
}
