<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Domains\Academic\Application\Actions\EnrollStudent;
use App\Domains\Academic\Application\Actions\FetchAcademicDashboardData;
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
        $query = Student::with([
            'lead.branch', 
            'lead.leadSource', 
            'lead.infoSource', 
            'lead.leadType', 
            'lead.guardians', 
            'lead.enrollments.studyClass', 
            'studyClasses',
            'progressReports',
        ]);

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

        if ($request->filled('price_master_id')) {
            $pmId = $request->input('price_master_id');
            $query->whereHas('studyClasses', function ($q) use ($pmId) {
                $q->where('price_master_id', $pmId);
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

        $priceMastersList = \App\Domains\Finance\Domain\Models\PriceMaster::select('id', 'name')
            ->orderBy('name')
            ->get();

        $defaultGrades = collect(['TK / Paud', 'SD', 'SMP', 'SMA / SMK', 'Umum']);

        $dbGrades = Lead::whereNotNull('grade')
            ->where('grade', '!=', '')
            ->distinct()
            ->pluck('grade');

        $gradesList = $defaultGrades->merge($dbGrades)->unique()->values();

        $allFilters = array_merge(
            $dashboardData['filters'],
            array_filter($request->only(['search', 'expiry_status', 'status', 'class_category', 'study_class_id', 'price_master_id', 'grade', 'sort_field', 'sort_direction', 'branch_id', 'mode']), fn($v) => !is_null($v) && $v !== '')
        );

        return Inertia::render('Admin/Academic/Student/Index', array_merge($dashboardData, [
            'students' => StudentResource::collection($query->paginate(12)->withQueryString()),
            'studyClassesList' => $studyClassesList,
            'priceMastersList' => $priceMastersList,
            'gradesList' => $gradesList,
            'filters' => $allFilters,
        ]));
    }

    private function getAcademicDashboardData(Request $request): array
    {
        return (new FetchAcademicDashboardData())->handle($request->all());
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
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            'status'     => 'nullable|string|in:active,stop',
            'notes'      => 'nullable|string|max:5000',
            'start_join' => 'nullable|date',
        ]);

        $updates = [];

        if (array_key_exists('status', $validated)) {
            $oldStatus = $student->status;
            if ($validated['status'] === 'stop' && $oldStatus !== 'stop') {
                $updates['stopped_at'] = now();
            } elseif ($validated['status'] === 'active' && $oldStatus !== 'active') {
                $updates['stopped_at'] = null;
            }
            $updates['status'] = $validated['status'];
        }

        if (array_key_exists('notes', $validated)) {
            $updates['notes'] = $validated['notes'];
        }

        if (array_key_exists('start_join', $validated)) {
            $updates['start_join'] = $validated['start_join'];
        }

        if (!empty($updates)) {
            $student->update($updates);
        }

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Detail siswa berhasil diperbarui.',
                'student' => $student->refresh(),
            ]);
        }

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

    public function storeProgressReport(
        \App\Http\Requests\Academic\StoreStudentProgressReportRequest $request,
        Student $student,
        \App\Domains\Academic\Application\Actions\StoreStudentProgressReport $action
    ): RedirectResponse {
        $action->handle($student, $request->validated(), $request->file('file'));

        return redirect()->back()->with('success', 'Progress report berhasil ditambahkan.');
    }

    public function destroyProgressReport(
        Student $student,
        \App\Domains\Academic\Domain\Models\StudentProgressReport $report,
        \App\Domains\Academic\Application\Actions\DeleteStudentProgressReport $action
    ): RedirectResponse {
        if ($report->student_id !== $student->id) {
            abort(404);
        }

        $action->handle($report);

        return redirect()->back()->with('success', 'Progress report berhasil dihapus.');
    }

    public function uploadProfilePicture(Request $request, Student $student): JsonResponse
    {
        $request->validate([
            'profile_picture' => ['required', 'image', 'max:51200'],
        ]);

        if ($request->hasFile('profile_picture')) {
            // Delete old picture if exists
            if ($student->profile_picture && \Illuminate\Support\Facades\Storage::disk('public')->exists($student->profile_picture)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($student->profile_picture);
            }

            $path = $request->file('profile_picture')->store('student-profiles', 'public');
            $student->update(['profile_picture' => $path]);
        }

        return response()->json([
            'message'             => 'Foto profil siswa berhasil diperbarui.',
            'profile_picture'     => $student->profile_picture,
            'profile_picture_url' => asset('storage/' . $student->profile_picture),
        ]);
    }
}
