<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Domains\Academic\Application\Actions\ResetClassCycle;
use App\Domains\Academic\Application\Actions\StoreStudyClass;
use App\Domains\Academic\Application\Actions\UpdateStudyClass;
use App\Domains\Academic\Application\Services\StudyClassQueryService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Academic\StoreStudyClassRequest;
use App\Http\Requests\Admin\Academic\UpdateStudyClassRequest;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Http\Resources\Academic\StudyClassResource;
use App\Http\Resources\Master\BranchResource;
use App\Http\Resources\Finance\PriceMasterResource;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudyClassController extends Controller
{
    public function index(Request $request, StudyClassQueryService $service): Response
    {
        $data = $service->getIndexData($request);

        return Inertia::render('Admin/Academic/StudyClass/Index', [
            'classes' => StudyClassResource::collection($data['classes_query']->paginate(12)->withQueryString()),
            'branches' => BranchResource::collection($data['branches']),
            'instructors' => $data['instructors'], 
            'priceMasters' => PriceMasterResource::collection($data['priceMasters']),
            'leadTypes' => $data['leadTypes'],
            'filters' => array_merge(['status' => 'active', 'session_status' => '', 'category' => ''], $request->only(['branch_id', 'search', 'type', 'category', 'status', 'session_status'])),
        ]);
    }

    public function store(StoreStudyClassRequest $request, StoreStudyClass $action): RedirectResponse
    {
        $action->handle($request->validated());

        return redirect()->back()->with('success', 'Class created successfully.');
    }

    public function update(UpdateStudyClassRequest $request, StudyClass $studyClass, UpdateStudyClass $action): RedirectResponse
    {
        $action->handle($studyClass, $request->validated());

        return redirect()->back()->with('success', 'Class updated successfully.');
    }

    public function resetCycle(Request $request, StudyClass $studyClass, ResetClassCycle $action): RedirectResponse
    {
        $request->validate([
            'start_session_date' => 'required|date',
            'end_session_date' => 'required|date|after_or_equal:start_session_date',
        ], [
            'start_session_date.required' => 'Tanggal mulai wajib diisi.',
            'end_session_date.required' => 'Tanggal selesai wajib diisi.',
            'end_session_date.after_or_equal' => 'Tanggal selesai harus setelah atau sama dengan tanggal mulai.',
        ]);

        $action->handle(
            $studyClass,
            $request->input('start_session_date'),
            $request->input('end_session_date')
        );

        return redirect()->back()->with('success', "New cycle started for {$studyClass->name}. Keep teaching!");
    }

    public function recordAttendance(Request $request, StudyClass $studyClass): RedirectResponse
    {
        $validated = $request->validate([
            'attendance_date' => 'required|date',
            'session_number' => 'nullable|integer|min:1',
            'status' => 'required|in:present,sick,permission,absent',
            'student_id' => 'nullable|exists:students,id',
            'topic' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        $currentCycle = $studyClass->current_session_number ?? 1;

        // Determine session number if not explicitly sent
        $sessionNumber = $validated['session_number'] ?? null;
        if (!$sessionNumber) {
            $lastSession = $studyClass->attendances()
                ->where('cycle_number', $currentCycle)
                ->max('session_number');
            $sessionNumber = ($lastSession ?? 0) + 1;
        }

        $studyClass->attendances()->create([
            'study_class_id' => $studyClass->id,
            'student_id' => $validated['student_id'] ?? $studyClass->students()->first()?->id,
            'recorded_by' => auth()->id(),
            'cycle_number' => $currentCycle,
            'session_number' => $sessionNumber,
            'attendance_date' => $validated['attendance_date'],
            'status' => $validated['status'],
            'topic' => $validated['topic'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        // If class has manual_session_progress or private class, ensure manual progress is at least this new count
        $totalAttCount = $studyClass->attendances()->where('cycle_number', $currentCycle)->count();
        $newProgress = max((int) $studyClass->manual_session_progress + 1, $totalAttCount);
        $studyClass->update([
            'manual_session_progress' => min($newProgress, (int) $studyClass->total_meetings),
        ]);

        return redirect()->back()->with('success', "Kehadiran sesi ke-{$sessionNumber} berhasil dicatat.");
    }

    public function deleteAttendance(StudyClass $studyClass, \App\Domains\Academic\Domain\Models\ClassAttendance $attendance): RedirectResponse
    {
        if ($attendance->study_class_id !== $studyClass->id) {
            abort(403);
        }

        $sessionNum = $attendance->session_number;
        $currentCycle = $attendance->cycle_number;
        $attendance->delete();

        $remainingCount = $studyClass->attendances()->where('cycle_number', $currentCycle)->count();
        $studyClass->update([
            'manual_session_progress' => $remainingCount > 0 ? $remainingCount : null,
        ]);

        return redirect()->back()->with('success', "Catatan kehadiran sesi ke-{$sessionNum} berhasil dihapus.");
    }

    public function updateProgress(Request $request, StudyClass $studyClass): RedirectResponse
    {
        $validated = $request->validate([
            'session_progress' => 'required|integer|min:0|max:' . ($studyClass->total_meetings ?? 100),
        ]);

        $studyClass->update([
            'manual_session_progress' => $validated['session_progress'],
        ]);

        return redirect()->back()->with('success', "Progress sesi kelas {$studyClass->name} berhasil diubah menjadi {$validated['session_progress']} sesi.");
    }

    public function destroy(StudyClass $studyClass): RedirectResponse
    {
        $studyClass->delete();
        return redirect()->back()->with('success', 'Class deleted successfully.');
    }
}


