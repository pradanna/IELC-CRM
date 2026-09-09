<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtIeltsTask;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class IeltsAcademicPtExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeder ini membuat paket tes penempatan "IELTS Academic Placement Test"
     * berdasarkan materi resmi dari portal Exam Prep IELC:
     * - Listening (40 soal)
     * - Reading (40 soal)
     * - Writing Task 1 (Short Report 150 kata) & Task 2 (Essay 250 kata)
     * - Speaking (Konsultasi wawancara live)
     */
    public function run(): void
    {
        // 1. Sync IELTS media assets (Audio, PDF booklet, Prompt images) ke public storage
        $ieltsSource = __DIR__ . '/assets/pt_exams/ielts';
        $ieltsTarget = storage_path('app/public/pt_exams/ielts');
        $ieltsPublic = public_path('storage/pt_exams/ielts');

        if (File::exists($ieltsSource)) {
            if (!File::exists($ieltsTarget)) {
                File::makeDirectory($ieltsTarget, 0755, true);
            }
            File::copyDirectory($ieltsSource, $ieltsTarget);

            if (!File::exists($ieltsPublic)) {
                File::makeDirectory($ieltsPublic, 0755, true);
            }
            File::copyDirectory($ieltsSource, $ieltsPublic);
            $this->command->info('✅ IELTS assets synced to local storage & public.');
        }

        $jsonPath = __DIR__ . '/data/placement_test_ielts_academic.json';
        if (!file_exists($jsonPath)) {
            $this->command->error("❌ File JSON tidak ditemukan: {$jsonPath}");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->command->error('❌ JSON error: ' . json_last_error_msg());
            return;
        }

        $slug = $data['exam_slug'] ?? Str::slug($data['exam_title']);

        $exam = PtExam::firstOrCreate(
            ['slug' => $slug],
            [
                'title' => $data['exam_title'],
                'category' => 'IELTS',
                'description' => $data['exam_description'] ?? '',
                'duration_minutes' => $data['exam_duration'] ?? 150,
                'is_active' => true,
            ]
        );

        $exam->update([
            'title' => $data['exam_title'],
            'category' => 'IELTS',
            'description' => $data['exam_description'] ?? '',
            'duration_minutes' => $data['exam_duration'] ?? 150,
            'is_active' => true,
        ]);

        $this->command->info("📋 Memproses Paket Ujian: {$exam->title} (ID: {$exam->id})");

        // Hapus task lama agar selalu sinkron dengan JSON
        $exam->ieltsTasks()->delete();

        foreach ($data['tasks'] as $taskData) {
            PtIeltsTask::create([
                'pt_exam_id' => $exam->id,
                'skill_type' => $taskData['skill_type'],
                'title' => $taskData['title'],
                'description' => $taskData['description'] ?? null,
                'audio_path' => $taskData['audio_path'] ?? null,
                'question_pdf_path' => $taskData['question_pdf_path'] ?? null,
                'answer_sheet_pdf_path' => $taskData['answer_sheet_pdf_path'] ?? null,
                'min_words' => $taskData['min_words'] ?? null,
                'duration_minutes' => $taskData['duration_minutes'] ?? null,
                'max_score' => $taskData['max_score'] ?? 9.0,
                'position' => $taskData['position'] ?? 1,
            ]);
            $this->command->info("  ✔ Task tersimpan: [{$taskData['skill_type']}] {$taskData['title']}");
        }

        $this->command->info("✅ Seeder IELTS Academic Placement Test berhasil dijalankan.");
    }
}
