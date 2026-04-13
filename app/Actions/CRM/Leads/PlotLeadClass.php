<?php

namespace App\Actions\CRM\Leads;

use App\Models\Lead;
use App\Models\StudyClass;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;

class PlotLeadClass
{
    public function handle(Lead $lead, array $data): Lead
    {
        return DB::transaction(function () use ($lead, $data) {
            $studyClass = StudyClass::findOrFail($data['study_class_id']);
            
            // Calculate pro-rata meetings
            $remaining = 0;
            if ($studyClass->start_session_date && is_array($studyClass->schedule_days)) {
                $joinDate = Carbon::parse($data['join_date']);
                $endDate = $studyClass->end_session_date;
                
                if ($endDate && $joinDate->lessThanOrEqualTo($endDate)) {
                    $period = CarbonPeriod::create($joinDate, $endDate);
                    foreach ($period as $date) {
                        if (in_array($date->format('l'), $studyClass->schedule_days)) {
                            $remaining++;
                        }
                    }
                }
            }

            $lead->update([
                'plotting' => array_merge($data, [
                    'remaining_meetings' => $remaining,
                    'total_meetings' => $studyClass->total_meetings,
                ])
            ]);

            activity()
                ->performedOn($lead)
                ->causedBy(auth()->user())
                ->log("Leads plotted to class: " . $studyClass->name);

            return $lead->refresh();
        });
    }
}
