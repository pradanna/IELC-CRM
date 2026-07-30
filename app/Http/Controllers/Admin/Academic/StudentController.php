<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Domains\Academic\Application\Actions\EnrollStudent;
use App\Domains\Academic\Application\Actions\PromoteLeadToStudent;
use App\Domains\Academic\Application\Actions\UnenrollStudent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Academic\EnrollStudentRequest;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Http\Resources\Academic\StudentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Student::with(['lead.branch', 'studyClasses']);

        if ($request->filled('search')) {
            $query->whereHas('lead', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('phone', 'like', "%{$request->search}%");
            })->orWhere('student_number', 'like', "%{$request->search}%");
        }

        if ($request->filled('expiry_status')) {
            $status = $request->input('expiry_status');
            if ($status === 'expired') {
                $query->whereHas('studyClasses', function ($q) {
                    $q->where('end_session_date', '<', now()->toDateString());
                });
            } elseif ($status === 'expiring_soon') {
                $query->whereHas('studyClasses', function ($q) {
                    $q->whereBetween('end_session_date', [now()->toDateString(), now()->addDays(21)->toDateString()]);
                });
            } elseif ($status === 'not_expired') {
                $query->whereHas('studyClasses', function ($q) {
                    $q->where('end_session_date', '>', now()->addDays(21)->toDateString());
                })->whereDoesntHave('studyClasses', function ($q) {
                    $q->where('end_session_date', '<=', now()->addDays(21)->toDateString());
                });
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('class_category')) {
            $cat = strtolower($request->input('class_category'));
            $query->whereHas('studyClasses', function ($q) use ($cat) {
                $q->where('category', $cat);
            });
        }

        if ($request->filled('study_class_id')) {
            $classId = $request->input('study_class_id');
            $query->whereHas('studyClasses', function ($q) use ($classId) {
                $q->where('study_classes.id', $classId);
            });
        }

        if ($request->filled('grade')) {
            $g = $request->input('grade');
            $query->whereHas('lead', function ($q) use ($g) {
                $q->where('grade', $g);
            });
        }

        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        if ($sortField === 'name') {
            $query->join('leads', 'students.lead_id', '=', 'leads.id')
                  ->select('students.*')
                  ->orderBy('leads.name', $sortDirection);
        } elseif ($sortField === 'student_number') {
            $query->orderBy('student_number', $sortDirection);
        } elseif ($sortField === 'start_join') {
            $query->orderByRaw('COALESCE(start_join, created_at) ' . $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $dashboardData = $this->getAcademicDashboardData($request);

        $studyClassesList = StudyClass::where('status', 'active')
            ->select('id', 'name', 'category')
            ->orderBy('name')
            ->get();

        $defaultGrades = collect(['TK / Paud', 'SD', 'SMP', 'SMA / SMK', 'Kuliah', 'Umum']);

        $dbGrades = Lead::whereNotNull('grade')
            ->where('grade', '!=', '')
            ->distinct()
            ->pluck('grade');

        $gradesList = $defaultGrades->merge($dbGrades)->unique()->values();

        $allFilters = array_merge(
            $dashboardData['filters'],
            $request->only(['search', 'expiry_status', 'status', 'class_category', 'study_class_id', 'grade', 'sort_field', 'sort_direction'])
        );

        return Inertia::render('Admin/Academic/Student/Index', array_merge($dashboardData, [
            'students' => StudentResource::collection($query->paginate(12)->withQueryString()),
            'studyClassesList' => $studyClassesList,
            'gradesList' => $gradesList,
            'filters' => $allFilters,
        ]));
    }

    private function getAcademicDashboardData(Request $request): array
    {
        $isSqlite = \DB::connection()->getDriverName() === 'sqlite';

        $year  = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;
        $activeTab = $request->input('tab', 'overall');

        // ── Available years ──────────────────────────────────────
        $yearExpr        = $isSqlite ? "cast(strftime('%Y', start_join) as integer)" : "YEAR(start_join)";
        $stoppedYearExpr = $isSqlite ? "cast(strftime('%Y', stopped_at) as integer)" : "YEAR(stopped_at)";

        $startYears = Student::selectRaw("DISTINCT {$yearExpr} as yr")
            ->whereNotNull('start_join')->pluck('yr')->filter()->toArray();

        $stopYears = Student::selectRaw("DISTINCT {$stoppedYearExpr} as yr")
            ->whereNotNull('stopped_at')->pluck('yr')->filter()->toArray();

        $availableYears = collect(array_merge($startYears, $stopYears, [(int) now()->year]))
            ->unique()->sortDesc()->values()->map(fn($v) => (int) $v)->toArray();

        if (!in_array($year, $availableYears)) {
            $availableYears[] = $year;
            rsort($availableYears);
        }

        // ── Helper: apply year/month date filter ─────────────────
        $filterByDate = function ($query, string $col, int $y, ?int $m = null) use ($isSqlite) {
            if ($isSqlite) {
                $query->whereRaw("cast(strftime('%Y', {$col}) as integer) = ?", [$y]);
                if ($m) {
                    $query->whereRaw("cast(strftime('%m', {$col}) as integer) = ?", [$m]);
                }
            } else {
                $query->whereYear($col, $y);
                if ($m) {
                    $query->whereMonth($col, $m);
                }
            }
            return $query;
        };

        // ═════════════════════════════════════════════════════════
        // 1. OVERALL
        // ═════════════════════════════════════════════════════════

        // Total active students in selected period
        $totalActiveQuery = Student::where('status', 'active');
        $filterByDate($totalActiveQuery, 'start_join', $year, $month);
        $totalActiveStudents = $totalActiveQuery->count();

        // New students in target month
        $targetMonth = $month ?? (int) now()->month;
        $newStudentsQuery = Student::where('status', 'active');
        $filterByDate($newStudentsQuery, 'created_at', $year, $targetMonth);
        $newStudentsThisMonth = $newStudentsQuery->count();

        // Monthly trend (full year – ignores month filter for the chart)
        $dateFormat = $isSqlite
            ? "strftime('%Y-%m', start_join)"
            : "DATE_FORMAT(start_join, '%Y-%m')";

        $monthlyTrendQuery = Student::where('status', 'active')
            ->whereNotNull('start_join')
            ->selectRaw("{$dateFormat} as month, count(*) as count")
            ->groupBy('month')
            ->orderBy('month', 'asc');
        $filterByDate($monthlyTrendQuery, 'start_join', $year);
        $monthlyTrendRaw = $monthlyTrendQuery->get();

        $monthlyTrend = [];
        foreach ($monthlyTrendRaw as $row) {
            if (!$row->month) continue;
            try {
                $monthlyTrend[] = [
                    'month'    => \Carbon\Carbon::createFromFormat('Y-m', $row->month)->format('M Y'),
                    'students' => (int) $row->count,
                ];
            } catch (\Exception $e) {
                $monthlyTrend[] = [
                    'month'    => $row->month,
                    'students' => (int) $row->count,
                ];
            }
        }

        // Branch distribution
        $branchQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->join('branches', 'leads.branch_id', '=', 'branches.id')
            ->selectRaw('branches.name as branch_name, count(*) as count')
            ->groupBy('branches.name');
        $filterByDate($branchQuery, 'students.start_join', $year, $month);
        $branchDistribution = $branchQuery->get()->map(fn($item) => [
            'name'  => $item->branch_name,
            'value' => (int) $item->count,
        ]);

        // ═════════════════════════════════════════════════════════
        // 2. POLA JOIN
        // ═════════════════════════════════════════════════════════

        $joinQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->leftJoin('lead_types', 'leads.lead_type_id', '=', 'lead_types.id')
            ->selectRaw("
                COALESCE(lead_types.name, 'Lainnya') as program_name,
                sum(case when leads.is_online = 1 then 1 else 0 end) as online_count,
                sum(case when leads.is_online = 0 or leads.is_online is null then 1 else 0 end) as offline_count,
                count(*) as total_count
            ")
            ->groupBy('program_name');
        $filterByDate($joinQuery, 'students.start_join', $year, $month);
        $joinPatterns = $joinQuery->get()->map(fn($item) => [
            'program' => $item->program_name,
            'online'  => (int) $item->online_count,
            'offline' => (int) $item->offline_count,
            'total'   => (int) $item->total_count,
        ]);

        // ═════════════════════════════════════════════════════════
        // 3. SISWA STOP
        // ═════════════════════════════════════════════════════════

        $stoppedAtFormat = $isSqlite
            ? "strftime('%Y-%m', stopped_at)"
            : "DATE_FORMAT(stopped_at, '%Y-%m')";

        // Trend chart (full year – ignores month filter)
        $stoppedTrendQuery = Student::where('status', 'stop')
            ->whereNotNull('stopped_at')
            ->selectRaw("{$stoppedAtFormat} as month, count(*) as count")
            ->groupBy('month')
            ->orderBy('month', 'asc');
        $filterByDate($stoppedTrendQuery, 'stopped_at', $year);
        $stoppedMonthlyRaw = $stoppedTrendQuery->get();

        $stoppedMonthly = [];
        foreach ($stoppedMonthlyRaw as $row) {
            if (!$row->month) continue;
            try {
                $stoppedMonthly[] = [
                    'month'   => \Carbon\Carbon::createFromFormat('Y-m', $row->month)->format('M Y'),
                    'stopped' => (int) $row->count,
                ];
            } catch (\Exception $e) {
                $stoppedMonthly[] = [
                    'month'   => $row->month,
                    'stopped' => (int) $row->count,
                ];
            }
        }

        // Total stopped (respects month filter for the stat card)
        $totalStoppedQuery = Student::where('status', 'stop')->whereNotNull('stopped_at');
        $filterByDate($totalStoppedQuery, 'stopped_at', $year, $month);
        $totalStopped = $totalStoppedQuery->count();

        // ═════════════════════════════════════════════════════════
        // 4. TINGKAT PENDIDIKAN
        // ═════════════════════════════════════════════════════════

        $gradeQuery = Student::where('students.status', 'active')
            ->join('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw("COALESCE(leads.grade, 'UMUM') as grade, count(*) as count")
            ->groupBy('grade');
        $filterByDate($gradeQuery, 'students.start_join', $year, $month);
        $gradeDistributionRaw = $gradeQuery->get();

        $gradeGroups = [
            'PG' => 0, 'TK' => 0, 'SD' => 0, 'SMP' => 0, 'SMA' => 0, 'KULIAH' => 0, 'UMUM' => 0
        ];

        foreach ($gradeDistributionRaw as $item) {
            $rawGrade = strtoupper(trim($item->grade));
            if (str_contains($rawGrade, 'PG') || str_contains($rawGrade, 'PLAYGROUP') || str_contains($rawGrade, 'KB')) {
                $gradeGroups['PG'] += $item->count;
            } elseif (str_contains($rawGrade, 'TK')) {
                $gradeGroups['TK'] += $item->count;
            } elseif (str_contains($rawGrade, 'SD')) {
                $gradeGroups['SD'] += $item->count;
            } elseif (str_contains($rawGrade, 'SMP')) {
                $gradeGroups['SMP'] += $item->count;
            } elseif (str_contains($rawGrade, 'SMA') || str_contains($rawGrade, 'SMK') || str_contains($rawGrade, 'SLTA')) {
                $gradeGroups['SMA'] += $item->count;
            } elseif (str_contains($rawGrade, 'KULIAH') || str_contains($rawGrade, 'UNIV') || str_contains($rawGrade, 'MHS')) {
                $gradeGroups['KULIAH'] += $item->count;
            } else {
                $gradeGroups['UMUM'] += $item->count;
            }
        }

        $gradeDistribution = [];
        foreach ($gradeGroups as $label => $count) {
            $gradeDistribution[] = [
                'name'  => $label,
                'count' => (int) $count,
            ];
        }

        // Online vs Offline breakdown derived from active enrolled class type (fallback to leads.is_online if no class enrolled yet)
        $channelCounts = Student::where('students.status', 'active')
            ->leftJoin('lead_enrollments', function ($join) {
                $join->on('students.id', '=', 'lead_enrollments.student_id')
                     ->where('lead_enrollments.status', '=', 'active');
            })
            ->leftJoin('study_classes', 'lead_enrollments.study_class_id', '=', 'study_classes.id')
            ->leftJoin('leads', 'students.lead_id', '=', 'leads.id')
            ->selectRaw("
                sum(case 
                    when study_classes.type = 'online' then 1 
                    when study_classes.type is null and leads.is_online = 1 then 1 
                    else 0 
                end) as online_count,
                sum(case 
                    when study_classes.type = 'offline' then 1 
                    when study_classes.type is null and (leads.is_online = 0 or leads.is_online is null) then 1 
                    else 0 
                end) as offline_count
            ");
        $filterByDate($channelCounts, 'students.start_join', $year); // NO $month
        $channelData = $channelCounts->first();

        $onlineCount = (int) ($channelData->online_count ?? 0);
        $offlineCount = (int) ($channelData->offline_count ?? 0);

        return [
            'filters' => [
                'year'            => $year,
                'month'           => $month,
                'tab'             => $activeTab,
                'available_years' => $availableYears,
            ],
            'reports' => [
                'overall' => [
                    'total_active'       => $totalActiveStudents,
                    'online_count'       => $onlineCount,
                    'offline_count'      => $offlineCount,
                    'new_this_month'     => $newStudentsThisMonth,
                    'target_month'       => $targetMonth,
                    'monthly_trend'      => $monthlyTrend,
                    'branch_distribution' => $branchDistribution,
                    'grade_distribution'  => $gradeDistribution,
                ],
                'join_patterns' => $joinPatterns,
                'siswa_stop' => [
                    'total_stopped'  => $totalStopped,
                    'monthly_trend'  => $stoppedMonthly,
                ],
                'grades' => $gradeDistribution,
            ],
        ];
    }

    public function promoteFromLead(Request $request, Lead $lead, PromoteLeadToStudent $action): RedirectResponse|JsonResponse
    {
        if ($lead->student) {
            return response()->json(['message' => 'Lead is already a student.'], 422);
        }

        $student = $action->handle($lead);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Lead promoted successfully', 
                'student' => new StudentResource($student->load(['lead.branch', 'studyClasses']))
            ]);
        }

        return redirect()->back()->with('success', "Lead promoted successfully to {$student->student_number}.");
    }

    public function enroll(EnrollStudentRequest $request, StudyClass $studyClass, EnrollStudent $action): RedirectResponse
    {
        $action->handle($studyClass, $request->student_id);

        return redirect()->back()->with('success', 'Student enrolled successfully.');
    }

    public function unenroll(StudyClass $studyClass, Student $student, UnenrollStudent $action): RedirectResponse
    {
        $action->handle($studyClass, $student);

        return redirect()->back()->with('success', 'Student unenrolled successfully.');
    }

    /**
     * Update the specified student's status, notes, and join date.
     */
    public function update(Request $request, Student $student): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|string|in:active,stop',
            'notes' => 'nullable|string',
            'start_join' => 'required|date',
        ]);

        $oldStatus = $student->status;

        if ($validated['status'] === 'stop' && $oldStatus !== 'stop') {
            $student->stopped_at = now();
        } elseif ($validated['status'] === 'active' && $oldStatus !== 'active') {
            $student->stopped_at = null;
        }

        $student->update([
            'status' => $validated['status'],
            'notes' => $validated['notes'],
            'start_join' => $validated['start_join'],
            'stopped_at' => $student->stopped_at,
        ]);

        return redirect()->back()->with('success', 'Student details updated successfully.');
    }

    public function search(Request $request): JsonResponse
    {
        $query = Student::with(['lead']);

        if ($request->filled('q')) {
            $query->whereHas('lead', function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->q}%")
                  ->orWhere('phone', 'like', "%{$request->q}%");
            })->orWhere('student_number', 'like', "%{$request->q}%");
        }

        $students = $query->latest()->limit(10)->get();

        return response()->json([
            'students' => StudentResource::collection($students),
        ]);
    }

    public function bulkPromote(Request $request, \App\Domains\Academic\Application\Actions\BulkPromoteStudentsAction $action): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'mode' => 'required|in:auto,auto_detailed,auto_level,custom',
            'from_grade' => 'nullable|string',
            'to_grade' => 'nullable|string',
            'branch_id' => 'nullable|string',
            'preview_only' => 'nullable|boolean',
            'selected_lead_ids' => 'nullable|array',
            'selected_lead_ids.*' => 'string|uuid',
        ]);

        if (!empty($validated['preview_only'])) {
            $previewData = $action->preview(
                $validated['mode'],
                $validated['from_grade'] ?? null,
                $validated['to_grade'] ?? null,
                $validated['branch_id'] ?? null
            );
            return response()->json($previewData);
        }

        $count = $action->execute(
            $validated['mode'],
            $validated['from_grade'] ?? null,
            $validated['to_grade'] ?? null,
            $validated['branch_id'] ?? null,
            $validated['selected_lead_ids'] ?? null
        );

        return redirect()->back()->with('success', "Berhasil menaikkan kelas massal untuk {$count} siswa.");
    }
}


