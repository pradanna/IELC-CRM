<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PtExam;
use Illuminate\Support\Str;

class IeltsPtExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $exam = PtExam::create([
            'title' => 'IELTS Placement Test',
            'slug' => Str::slug('IELTS Placement Test'),
            'description' => 'A comprehensive placement test to assess your readiness for the IELTS exam, covering Reading, Listening, and Language Use.',
            'duration_minutes' => 90,
            'is_active' => true,
        ]);

        // --- SECTION 1: GRAMMAR & VOCABULARY (Standalone Questions) ---
        $standaloneQuestions = [
            [
                'number' => 1,
                'position' => 1,
                'text' => 'The number of people moving to cities ___ significantly since the beginning of the century.',
                'points' => 1,
                'options' => [
                    ['text' => 'is increased', 'correct' => false],
                    ['text' => 'has increased', 'correct' => true],
                    ['text' => 'have increased', 'correct' => false],
                    ['text' => 'are increasing', 'correct' => false],
                ]
            ],
            [
                'number' => 2,
                'position' => 2,
                'text' => 'If the government ___ more in renewable energy, carbon emissions would have dropped further.',
                'points' => 1,
                'options' => [
                    ['text' => 'invested', 'correct' => false],
                    ['text' => 'had invested', 'correct' => true],
                    ['text' => 'has invested', 'correct' => false],
                    ['text' => 'invests', 'correct' => false],
                ]
            ],
            [
                'number' => 3,
                'position' => 3,
                'text' => 'The witness claimed that she ___ the suspect leaving the building at 10 PM.',
                'points' => 1,
                'options' => [
                    ['text' => 'sees', 'correct' => false],
                    ['text' => 'had seen', 'correct' => true],
                    ['text' => 'has seen', 'correct' => false],
                    ['text' => 'is seeing', 'correct' => false],
                ]
            ],
            [
                'number' => 4,
                'position' => 4,
                'text' => 'Despite ___ multiple times, he refused to change his mind.',
                'points' => 1,
                'options' => [
                    ['text' => 'being warned', 'correct' => true],
                    ['text' => 'warned', 'correct' => false],
                    ['text' => 'to be warned', 'correct' => false],
                    ['text' => 'having warned', 'correct' => false],
                ]
            ],
            [
                'number' => 5,
                'position' => 5,
                'text' => 'Hardly ___ the office when it started to rain heavily.',
                'points' => 1,
                'options' => [
                    ['text' => 'I had left', 'correct' => false],
                    ['text' => 'had I left', 'correct' => true],
                    ['text' => 'did I leave', 'correct' => false],
                    ['text' => 'I left', 'correct' => false],
                ]
            ],
        ];

        foreach ($standaloneQuestions as $qData) {
            $question = $exam->questions()->create([
                'number' => $qData['number'],
                'position' => $qData['position'],
                'question_text' => $qData['text'],
                'points' => $qData['points'],
            ]);

            foreach ($qData['options'] as $optData) {
                $question->options()->create([
                    'option_text' => $optData['text'],
                    'is_correct' => $optData['correct'],
                ]);
            }
        }

        // --- SECTION 2: READING COMPREHENSION (Group) ---
        $readingGroup = $exam->ptQuestionGroups()->create([
            'instruction' => 'Read the following text and answer questions 6-8.',
            'reading_text' => "The impact of artificial intelligence (AI) on the job market is a subject of intense debate. While some economists argue that AI will lead to mass unemployment by automating routine tasks, others suggest that it will create new roles that we cannot yet imagine. Historically, technological advancements like the steam engine and the internet have initially displaced workers but ultimately resulted in a net increase in employment opportunities. The key, according to experts, lies in education and the ability of the workforce to adapt to new technologies.",
            'position' => 6,
        ]);

        $readingQuestions = [
            [
                'number' => 6,
                'position' => 1,
                'text' => 'According to the text, what is the primary concern regarding AI in the job market?',
                'points' => 2,
                'options' => [
                    ['text' => 'The high cost of AI development', 'correct' => false],
                    ['text' => 'Mass unemployment due to automation', 'correct' => true],
                    ['text' => 'A decrease in global productivity', 'correct' => false],
                    ['text' => 'The lack of interest in AI technology', 'correct' => false],
                ]
            ],
            [
                'number' => 7,
                'position' => 2,
                'text' => 'How does the author use historical examples in the text?',
                'points' => 2,
                'options' => [
                    ['text' => 'To prove that technology is always harmful', 'correct' => false],
                    ['text' => 'To suggest that AI will follow a similar pattern to past technologies', 'correct' => true],
                    ['text' => 'To argue that the steam engine was more important than AI', 'correct' => false],
                    ['text' => 'To show that the internet has failed to create jobs', 'correct' => false],
                ]
            ],
            [
                'number' => 8,
                'position' => 3,
                'text' => 'What is identified as the "key" to managing the transition to an AI-driven economy?',
                'points' => 2,
                'options' => [
                    ['text' => 'Government regulations on AI', 'correct' => false],
                    ['text' => 'Reducing the use of computers', 'correct' => false],
                    ['text' => 'Education and workforce adaptability', 'correct' => true],
                    ['text' => 'Lowering the retirement age', 'correct' => false],
                ]
            ],
        ];

        foreach ($readingQuestions as $qData) {
            $question = $exam->questions()->create([
                'pt_question_group_id' => $readingGroup->id,
                'number' => $qData['number'],
                'position' => $qData['position'],
                'question_text' => $qData['text'],
                'points' => $qData['points'],
            ]);

            foreach ($qData['options'] as $optData) {
                $question->options()->create([
                    'option_text' => $optData['text'],
                    'is_correct' => $optData['correct'],
                ]);
            }
        }

        // --- SECTION 3: LISTENING (Group with Placeholder Audio) ---
        $listeningGroup = $exam->ptQuestionGroups()->create([
            'instruction' => 'Listen to the conversation about university enrollment and answer questions 9-10.',
            'audio_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', // Placeholder audio
            'position' => 9,
        ]);

        $listeningQuestions = [
            [
                'number' => 9,
                'position' => 1,
                'text' => 'Why is the student visiting the registrar\'s office?',
                'points' => 2,
                'options' => [
                    ['text' => 'To apply for a scholarship', 'correct' => false],
                    ['text' => 'To resolve a problem with their registration', 'correct' => true],
                    ['text' => 'To buy textbooks for the semester', 'correct' => false],
                    ['text' => 'To find a part-time job on campus', 'correct' => false],
                ]
            ],
            [
                'number' => 10,
                'position' => 2,
                'text' => 'What document does the registrar ask the student to provide?',
                'points' => 2,
                'options' => [
                    ['text' => 'A copy of their passport', 'correct' => false],
                    ['text' => 'Their high school diploma', 'correct' => false],
                    ['text' => 'A valid student identification card', 'correct' => true],
                    ['text' => 'A letter of recommendation', 'correct' => false],
                ]
            ],
        ];

        foreach ($listeningQuestions as $qData) {
            $question = $exam->questions()->create([
                'pt_question_group_id' => $listeningGroup->id,
                'number' => $qData['number'],
                'position' => $qData['position'],
                'question_text' => $qData['text'],
                'points' => $qData['points'],
            ]);

            foreach ($qData['options'] as $optData) {
                $question->options()->create([
                    'option_text' => $optData['text'],
                    'is_correct' => $optData['correct'],
                ]);
            }
        }
    }
}
