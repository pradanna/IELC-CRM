<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtKidCanvas;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

class KidsPtExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Seeder ini membuat/memperbarui soal-soal PT Kids beserta canvas data-nya.
     * Data soal dibaca dari: database/seeders/data/kids_pt_questions.json
     * Gambar diambil dari:    database/seeders/assets/pt_exams/kids_canvas/
     */
    public function run(): void
    {
        // 1. Sync asset gambar dari seeder/assets ke storage
        $assetSourceDir  = __DIR__ . '/assets/pt_exams/kids_canvas';
        $storageTargetDir = storage_path('app/public/pt_exams/kids_canvas');

        if (File::exists($assetSourceDir)) {
            if (!File::exists($storageTargetDir)) {
                File::makeDirectory($storageTargetDir, 0755, true);
            }
            File::copyDirectory($assetSourceDir, $storageTargetDir);
            $this->command->info('✅ Canvas assets synced to storage.');
        } else {
            $this->command->warn("⚠️  Asset dir not found: {$assetSourceDir}");
        }

        // 2. Baca data soal dari JSON
        $jsonPath = __DIR__ . '/data/kids_pt_questions.json';

        if (!file_exists($jsonPath)) {
            $this->command->error("❌ Data file not found: {$jsonPath}");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->command->error('❌ Invalid JSON: ' . json_last_error_msg());
            return;
        }

        // 3. Buat / perbarui Exam package
        $exam = PtExam::firstOrCreate(
            ['slug' => $data['exam_slug'] ?? Str::slug($data['exam_title'] ?? 'PT KIDS')],
            [
                'title'            => $data['exam_title']       ?? 'PT KIDS',
                'category'         => 'Kids',
                'description'      => $data['exam_description'] ?? 'Placement test khusus untuk anak-anak dengan tampilan visual komik, drag-and-drop kata, dan kanvas interaktif.',
                'duration_minutes' => $data['exam_duration']    ?? 45,
                'is_active'        => true,
            ]
        );

        // Pastikan kategori Kids
        if ($exam->category !== 'Kids') {
            $exam->update(['category' => 'Kids']);
        }

        $this->command->info("📋 Exam: {$exam->title} (ID: {$exam->id})");

        // 4. Loop setiap soal
        $questions = $data['questions'] ?? [];
        $this->command->info("📝 Seeding " . count($questions) . " questions...");

        foreach ($questions as $index => $qData) {
            $canvasPayload = $qData['canvas'] ?? [];
            $canvasData    = $canvasPayload['canvas_data'] ?? [];

            // Buat / perbarui PtQuestion
            $question = PtQuestion::updateOrCreate(
                [
                    'pt_exam_id'    => $exam->id,
                    'question_text' => $qData['question_text'],
                ],
                [
                    'type'       => $qData['type']       ?? 'drag_drop',
                    'points'     => $qData['points']     ?? 1,
                    'number'     => $qData['number']     ?? ($index + 1),
                    'position'   => $qData['position']   ?? ($index + 1),
                    'audio_path' => $qData['audio_path'] ?? null,
                ]
            );

            // Buat / perbarui PtKidCanvas
            PtKidCanvas::updateOrCreate(
                ['pt_question_id' => $question->id],
                [
                    'mode'        => $canvasPayload['mode']        ?? 'freeform_canvas',
                    'instruction' => $canvasPayload['instruction']  ?? '',
                    'canvas_data' => $canvasData,
                ]
            );

            $tokenCount  = count($canvasData['tokens']   ?? []);
            $targetCount = count($canvasData['targets']  ?? []);
            $elemCount   = count($canvasData['elements'] ?? []);
            $num = $index + 1;

            $this->command->info(
                "  [{$num}] {$qData['question_text']} " .
                "— tokens: {$tokenCount}, targets: {$targetCount}, elements: {$elemCount}"
            );
        }

        $this->command->info('');
        $this->command->info('✅ Kids Placement Test seeded successfully!');
        $this->command->info('   Exam  : ' . $exam->title);
        $this->command->info('   Total : ' . count($questions) . ' question(s)');
    }
}
