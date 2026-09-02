<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtQuestion;
use App\Domains\Academic\Domain\Models\PtKidCanvas;
use Illuminate\Support\Str;

class KidsPtExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jsonPath = __DIR__ . '/data/kids_canvas_sample.json';
        
        if (!file_exists($jsonPath)) {
            $this->command->error("File {$jsonPath} not found.");
            return;
        }

        $sampleData = json_decode(file_get_contents($jsonPath), true);

        // Find or create PT KIDS exam package
        $exam = PtExam::firstOrCreate(
            ['title' => $sampleData['exam_title'] ?? 'PT KIDS'],
            [
                'category' => 'Kids',
                'slug' => Str::slug($sampleData['exam_title'] ?? 'PT KIDS'),
                'description' => 'Placement test khusus untuk anak-anak dengan tampilan visual komik, drag-and-drop kata, dan kanvas interaktif.',
                'duration_minutes' => 45,
                'is_active' => true,
            ]
        );

        // Ensure category is Kids even if record already existed
        if ($exam->category !== 'Kids') {
            $exam->update(['category' => 'Kids']);
        }

        $qData = $sampleData['question'];
        $cData = $sampleData['canvas'];

        // Create or update Question
        $question = PtQuestion::updateOrCreate(
            [
                'pt_exam_id' => $exam->id,
                'question_text' => $qData['question_text'],
            ],
            [
                'type' => $qData['type'] ?? 'drag_drop',
                'points' => $qData['points'] ?? 1,
                'number' => $qData['number'] ?? 1,
                'position' => $qData['position'] ?? 1,
                'audio_path' => $qData['audio_path'] ?? null,
            ]
        );

        // Create or update Kid Canvas data
        PtKidCanvas::updateOrCreate(
            [
                'pt_question_id' => $question->id,
            ],
            [
                'mode' => $cData['mode'] ?? 'freeform_canvas',
                'instruction' => $cData['instruction'] ?? '',
                'canvas_data' => $cData['canvas_data'] ?? [],
            ]
        );

        $this->command->info("Kids Placement Test Question seeded successfully for Exam: {$exam->title}");
    }
}
