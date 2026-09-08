<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtQuestionGroup;
use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtQuestionOption;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class PlacementTestInterchangeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeder ini membuat/memperbarui paket soal "Placement Test Interchange" (General)
     * lengkap dengan 70 soal pilihan ganda:
     * - Bagian I: Listening (No. 1-20, 9 Groups dengan file audio MP3)
     * - Bagian II: Reading (No. 21-40, 8 Groups dengan teks bacaan)
     * - Bagian III: Language Use (No. 41-70, 30 Soal Standalone)
     */
    public function run(): void
    {
        // 1. Sync media assets (Listening audio) ke public storage
        $listeningSource = __DIR__ . '/assets/pt_exams/interchange_listening';
        $listeningTarget = storage_path('app/public/pt_exams/interchange_listening');
        if (File::exists($listeningSource)) {
            if (!File::exists($listeningTarget)) {
                File::makeDirectory($listeningTarget, 0755, true);
            }
            File::copyDirectory($listeningSource, $listeningTarget);
            File::copyDirectory($listeningSource, public_path('storage/pt_exams/interchange_listening'));
            $this->command->info('✅ Interchange listening assets synced to storage.');
        }

        // 2. Baca data soal dari placement_test_interchange.json
        $jsonPath = __DIR__ . '/data/placement_test_interchange.json';
        if (!file_exists($jsonPath)) {
            $this->command->error("❌ Data file not found: {$jsonPath}");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->command->error('❌ Invalid JSON: ' . json_last_error_msg());
            return;
        }

        // 3. Buat atau perbarui PtExam
        $slug = $data['exam_slug'] ?? Str::slug($data['exam_title'] ?? 'Placement Test Interchange');
        $exam = PtExam::firstOrCreate(
            ['slug' => $slug],
            [
                'title'            => $data['exam_title'] ?? 'Placement Test Interchange',
                'category'         => 'General',
                'description'      => $data['exam_description'] ?? '',
                'duration_minutes' => $data['exam_duration'] ?? 50,
                'is_active'        => true,
            ]
        );

        $exam->update([
            'title'            => $data['exam_title'] ?? 'Placement Test Interchange',
            'category'         => 'General',
            'description'      => $data['exam_description'] ?? '',
            'duration_minutes' => $data['exam_duration'] ?? 50,
            'is_active'        => true,
        ]);

        $this->command->info("📋 Exam: {$exam->title} (ID: {$exam->id})");

        // 4. Bersihkan soal dan grup lama dari paket ujian ini
        foreach ($exam->questions as $existingQ) {
            $existingQ->options()->delete();
            $existingQ->delete();
        }
        $exam->ptQuestionGroups()->delete();

        $this->command->info("🧹 Cleaned questions for Placement Test Interchange.");

        // 5. Seed Question Groups (Bagian I: Listening & Bagian II: Reading)
        $groupsList = $data['groups'] ?? [];
        $this->command->info("📦 Seeding " . count($groupsList) . " question groups (Listening & Reading)...");

        foreach ($groupsList as $gData) {
            $group = $exam->ptQuestionGroups()->create([
                'instruction'  => $gData['instruction'],
                'section_type' => $gData['section_type'] ?? null,
                'reading_text' => $gData['reading_text'] ?? null,
                'file_path'    => $gData['file_path'] ?? null,
                'audio_path'   => $gData['audio_path'] ?? null,
                'position'     => $gData['position'],
            ]);

            foreach ($gData['questions'] as $qData) {
                $question = $exam->questions()->create([
                    'pt_question_group_id' => $group->id,
                    'number'               => $qData['number'],
                    'position'             => $qData['position'],
                    'question_text'        => $qData['text'],
                    'type'                 => 'mcq',
                    'points'               => $qData['points'] ?? 1,
                ]);

                foreach ($qData['options'] as $opt) {
                    $question->options()->create([
                        'option_text' => $opt['text'],
                        'is_correct'  => (bool)$opt['correct'],
                    ]);
                }
            }
        }

        // 6. Seed Standalone Questions (Bagian III: Language Use, No. 41 - 70)
        $standaloneList = $data['standalone_questions'] ?? [];
        $this->command->info("📝 Seeding " . count($standaloneList) . " standalone questions (Language Use)...");

        foreach ($standaloneList as $qData) {
            $question = $exam->questions()->create([
                'pt_question_group_id' => null,
                'number'               => $qData['number'],
                'position'             => $qData['position'],
                'question_text'        => $qData['text'],
                'type'                 => 'mcq',
                'points'               => $qData['points'] ?? 1,
            ]);

            foreach ($qData['options'] as $opt) {
                $question->options()->create([
                    'option_text' => $opt['text'],
                    'is_correct'  => (bool)$opt['correct'],
                ]);
            }
        }

        $totalQ = $exam->questions()->count();
        $totalGroups = $exam->ptQuestionGroups()->count();
        $this->command->info("🎉 Successfully seeded Placement Test Interchange! Total Questions: {$totalQ}, Groups: {$totalGroups}.");
    }
}
