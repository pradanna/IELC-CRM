<?php

namespace App\Http\Controllers\Admin\Crm;

use App\Http\Controllers\Controller;
use App\Models\CrmSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CrmSettingController extends Controller
{
    /**
     * Display current CRM settings.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/Crm/Settings/Index', [
            'settings' => CrmSetting::all()->pluck('value', 'key')->toArray()
        ]);
    }

    /**
     * Update CRM settings.
     */
    public function update(Request $request)
    {
        $data = $request->validate([
            'followUpTriggerDays' => 'required|integer|min:1|max:30',
            'autoCleanNewLeadsDays' => 'required|integer|min:1|max:90',
            'autoCleanProspectsDays' => 'required|integer|min:1|max:180',
            'expiringThresholdDays' => 'required|integer|min:1|max:30',
        ]);

        foreach ($data as $key => $value) {
            CrmSetting::updateOrCreate(
                ['key' => $key],
                ['value' => (string) $value]
            );
        }

        return redirect()->back()->with('success', 'CRM Settings updated successfully.');
    }
}
