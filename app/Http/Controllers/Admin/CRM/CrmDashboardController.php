<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Models\Branch;
use App\Models\LeadSource;
use App\Models\LeadType;
use App\Models\Province;
use App\Actions\Admin\CRM\FetchCrmDashboardData;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CrmDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->only(['month', 'year', 'branch_id']);
        $dashboardData = (new FetchCrmDashboardData)->handle($filters);
        
        return Inertia::render('Admin/CRM/Dashboard', [
            'data' => $dashboardData,
            'branches' => Branch::select('id', 'name')->get(),
            'phases' => \App\Models\LeadPhase::select('id', 'name', 'code')->get(),
            'sources' => LeadSource::select('id', 'name')->get(),
            'types' => LeadType::select('id', 'name')->get(),
            'provinces' => Province::select('id', 'name')->orderBy('name')->get(),
        ]);
    }
}
