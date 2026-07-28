<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\LeadType;
use App\Domains\Master\Domain\Models\Province;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\CRM\Application\Actions\Leads\FetchCrmDashboardData;
use App\Http\Controllers\Controller;
use App\Http\Resources\Crm\LeadPhaseResource;
use App\Http\Resources\Crm\LeadSourceResource;
use App\Http\Resources\Crm\LeadTypeResource;
use App\Http\Resources\Master\BranchResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

use App\Domains\Master\Domain\Models\InfoSource;
use App\Http\Resources\Crm\InfoSourceResource;

class CrmDashboardController extends Controller
{
    public function index(Request $request, FetchCrmDashboardData $action): Response
    {
        $filters = $request->only(['month', 'year', 'branch_id']);
        $dashboardData = $action->handle($filters);
        
        return Inertia::render('Admin/Crm/Dashboard/Index', [
            'data' => $dashboardData,
            'branches' => BranchResource::collection(Branch::select('id', 'name')->get()),
            'phases' => LeadPhaseResource::collection(LeadPhase::select('id', 'name', 'code')->get()),
            'sources' => LeadSourceResource::collection(LeadSource::select('id', 'name')->get()),
            'infoSources' => InfoSourceResource::collection(InfoSource::select('id', 'name')->get()),
            'types' => LeadTypeResource::collection(LeadType::select('id', 'name')->get()),
            'provinces' => Province::select('id', 'name')->orderBy('name')->get(),
        ]);
    }
}



