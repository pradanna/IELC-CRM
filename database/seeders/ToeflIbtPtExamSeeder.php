<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtIeltsTask;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class ToeflIbtPtExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeder ini membuat paket tes penempatan "TOEFL iBT Placement Test"
     * berdasarkan materi resmi dari portal Exam Prep IELC (Google Sites):
     * https://sites.google.com/ielc.co.id/examprepplacementtest/toefl-ibt
     *
     * - Task 1: Reading Section (2 Passages, 20 questions, 35 mins)
     * - Task 2: Listening Section (3 lectures & 2 conversations, 28 questions, 36 mins)
     * - Task 3: Writing Task 1 (Integrated Essay: School Organization, 20 mins, 150-225 words with audio lecture)
     * - Task 4: Writing Task 2 (Writing for an Academic Discussion, 10 mins, 100+ words)
     * - Task 5: Speaking Section (Live interview with instructor during consultation)
     * Total Duration: 115 minutes
     */
    public function run(): void
    {
        // 1. Sync TOEFL iBT media assets (Audio MP3, PDF Question Booklets) ke storage & public
        $ibtSource = __DIR__ . '/assets/pt_exams/toefl_ibt';
        $ibtTarget = storage_path('app/public/pt_exams/toefl_ibt');
        $ibtPublic = public_path('storage/pt_exams/toefl_ibt');

        if (File::exists($ibtSource)) {
            if (!File::exists($ibtTarget)) {
                File::makeDirectory($ibtTarget, 0755, true);
            }
            File::copyDirectory($ibtSource, $ibtTarget);

            if (!File::exists($ibtPublic)) {
                File::makeDirectory($ibtPublic, 0755, true);
            }
            File::copyDirectory($ibtSource, $ibtPublic);
            $this->command->info('✅ TOEFL iBT assets synced to local storage & public.');
        } else {
            $this->command->warn("⚠️ Folder assets sumber tidak ditemukan: {$ibtSource}");
        }

        // 2. Load JSON data
        $jsonPath = __DIR__ . '/data/placement_test_toefl_ibt.json';
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
                'duration_minutes' => $data['exam_duration'] ?? 115,
                'is_active' => true,
            ]
        );

        $exam->update([
            'title' => $data['exam_title'],
            'category' => 'IELTS',
            'description' => $data['exam_description'] ?? '',
            'duration_minutes' => $data['exam_duration'] ?? 115,
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
                'max_score' => $taskData['max_score'] ?? 30.0,
                'position' => $taskData['position'] ?? 1,
            ]);
            $this->command->info("  ✔ Task tersimpan: [{$taskData['skill_type']}] {$taskData['title']}");
        }

        $this->command->info("✅ Seeder TOEFL iBT Placement Test berhasil dijalankan.");
    }
}
