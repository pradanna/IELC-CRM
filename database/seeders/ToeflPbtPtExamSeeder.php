<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtIeltsTask;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ToeflPbtPtExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeder ini membuat paket tes penempatan "TOEFL PBT Placement Test"
     * berdasarkan materi resmi dari portal Exam Prep IELC (Google Sites):
     * https://sites.google.com/ielc.co.id/examprepplacementtest/toefl-pbt
     *
     * - Section 1: Listening Comprehension (50 questions, 30 mins)
     * - Section 2: Structure & Written Expression (40 questions, 25 mins)
     * - Section 3: Reading Comprehension (50 questions, 55 mins)
     * Total Duration: 110 minutes
     */
    public function run(): void
    {
        // 1. Sync TOEFL media assets (Audio MP3, PDF Question Booklets) ke storage & public
        $toeflSource = __DIR__ . '/assets/pt_exams/toefl';
        $toeflTarget = storage_path('app/public/pt_exams/toefl');
        $toeflPublic = public_path('storage/pt_exams/toefl');

        if (File::exists($toeflSource)) {
            if (!File::exists($toeflTarget)) {
                File::makeDirectory($toeflTarget, 0755, true);
            }
            File::copyDirectory($toeflSource, $toeflTarget);

            if (!File::exists($toeflPublic)) {
                File::makeDirectory($toeflPublic, 0755, true);
            }
            File::copyDirectory($toeflSource, $toeflPublic);
            $this->command->info('✅ TOEFL PBT assets synced to local storage & public.');
        } else {
            $this->command->warn("⚠️ Folder assets sumber tidak ditemukan: {$toeflSource}");
        }

        // 2. Load JSON data
        $jsonPath = __DIR__ . '/data/placement_test_toefl_pbt.json';
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
                'duration_minutes' => $data['exam_duration'] ?? 110,
                'is_active' => true,
            ]
        );

        $exam->update([
            'title' => $data['exam_title'],
            'category' => 'IELTS',
            'description' => $data['exam_description'] ?? '',
            'duration_minutes' => $data['exam_duration'] ?? 110,
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
                'max_score' => $taskData['max_score'] ?? 68.0,
                'position' => $taskData['position'] ?? 1,
            ]);
            $this->command->info("  ✔ Task tersimpan: [{$taskData['skill_type']}] {$taskData['title']}");
        }

        $this->command->info("✅ Seeder TOEFL PBT Placement Test berhasil dijalankan.");
    }
}
