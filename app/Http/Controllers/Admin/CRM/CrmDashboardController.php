<?php

namespace App\Http\Controllers\Admin\CRM;

use App\Models\Branch;
use App\Models\LeadSource;
use App\Models\LeadType;
use App\Models\Province;
use App\Models\LeadPhase;
use App\Actions\CRM\Leads\FetchCrmDashboardData;
use App\Http\Controllers\Controller;
use App\Http\Resources\Master\BranchResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CrmDashboardController extends Controller
{
    public function index(Request $request, FetchCrmDashboardData $action): Response
    {
        $filters = $request->only(['month', 'year', 'branch_id']);
        $dashboardData = $action->handle($filters);
        
        return Inertia::render('Admin/CRM/Dashboard/Index', [
            'data' => $dashboardData,
            'branches' => BranchResource::collection(Branch::select('id', 'name')->get()),
            'phases' => LeadPhase::select('id', 'name', 'code')->get(),
            'sources' => LeadSource::select('id', 'name')->get(),
            'types' => LeadType::select('id', 'name')->get(),
            'provinces' => Province::select('id', 'name')->orderBy('name')->get(),
        ]);
    }
}
