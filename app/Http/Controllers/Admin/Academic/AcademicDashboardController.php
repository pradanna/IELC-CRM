<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Domains\Academic\Application\Actions\FetchAcademicDashboardData;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicDashboardController extends Controller
{
    public function index(Request $request, FetchAcademicDashboardData $action): Response
    {
        $dashboardData = $action->handle($request->all());

        return Inertia::render('Admin/Academic/Dashboard', $dashboardData);
    }
}

