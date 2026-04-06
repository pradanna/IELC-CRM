<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Actions\Academic\EnrollStudent;
use App\Actions\Academic\PromoteLeadToStudent;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Academic\EnrollStudentRequest;
use App\Models\Lead;
use App\Models\Student;
use App\Models\StudyClass;
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

        return Inertia::render('Admin/Academic/Student/Index', [
            'students' => $query->latest()->get(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function promoteFromLead(Request $request, Lead $lead, PromoteLeadToStudent $action): RedirectResponse|JsonResponse
    {
        if ($lead->student) {
            return response()->json(['message' => 'Lead is already a student.'], 422);
        }

        $student = $action->handle($lead);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Lead promoted successfully', 'student' => $student]);
        }

        return redirect()->back()->with('success', "Lead promoted successfully to {$student->student_number}.");
    }

    public function enroll(EnrollStudentRequest $request, StudyClass $studyClass, EnrollStudent $action): RedirectResponse
    {
        $action->handle($studyClass, $request->student_id);

        return redirect()->back()->with('success', 'Student enrolled successfully.');
    }

    public function unenroll(StudyClass $studyClass, Student $student): RedirectResponse
    {
        $studyClass->students()->detach($student->id);

        return redirect()->back()->with('success', 'Student unenrolled successfully.');
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

        return response()->json([
            'students' => $query->latest()->limit(10)->get(),
        ]);
    }
}
