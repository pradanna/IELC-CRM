<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PtExam;
use Illuminate\Support\Str;

class PtExamSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Truncate existing data to avoid duplicates if running multiple times
        // Note: Use with caution in projects with existing linked data
        
        $exams = [
            [
                'title' => 'General English Placement Test',
                'description' => 'Tes penempatan bahasa Inggris umum yang mencakup tata bahasa (grammar), kosakata (vocabulary), pemahaman bacaan (reading), dan pemahaman mendengarkan (listening).',
                'duration_minutes' => 60,
                'is_active' => true,
                'standalone_questions' => [
                    [
                        'number' => 1,
                        'position' => 1,
                        'text' => 'She ___ to the market yesterday.',
                        'points' => 1,
                        'options' => [
                            ['text' => 'go', 'correct' => false],
                            ['text' => 'goes', 'correct' => false],
                            ['text' => 'went', 'correct' => true],
                            ['text' => 'gone', 'correct' => false],
                        ]
                    ],
                    [
                        'number' => 2,
                        'position' => 2,
                        'text' => 'I have been living in Jakarta ___ 5 years.',
                        'points' => 1,
                        'options' => [
                            ['text' => 'since', 'correct' => false],
                            ['text' => 'for', 'correct' => true],
                            ['text' => 'in', 'correct' => false],
                            ['text' => 'at', 'correct' => false],
                        ]
                    ],
                    [
                        'number' => 3,
                        'position' => 3,
                        'text' => 'If it rains tomorrow, we ___ at home.',
                        'points' => 1,
                        'options' => [
                            ['text' => 'would stay', 'correct' => false],
                            ['text' => 'will stay', 'correct' => true],
                            ['text' => 'stayed', 'correct' => false],
                            ['text' => 'staying', 'correct' => false],
                        ]
                    ],
                    [
                        'number' => 4,
                        'position' => 4,
                        'text' => 'He is the ___ student in the classroom.',
                        'points' => 1,
                        'options' => [
                            ['text' => 'tall', 'correct' => false],
                            ['text' => 'taller', 'correct' => false],
                            ['text' => 'tallest', 'correct' => true],
                            ['text' => 'most tall', 'correct' => false],
                        ]
                    ],
                    [
                        'number' => 5,
                        'position' => 5,
                        'text' => 'I do not have ___ money left in my wallet.',
                        'points' => 1,
                        'options' => [
                            ['text' => 'some', 'correct' => false],
                            ['text' => 'many', 'correct' => false],
                            ['text' => 'any', 'correct' => true],
                            ['text' => 'a few', 'correct' => false],
                        ]
                    ],
                ],
                'groups' => [
                    [
                        'position' => 6,
                        'instruction' => 'Part A: Reading Comprehension. Read the text and answer questions 6-10.',
                        'reading_text' => "The Amazon rainforest is the largest tropical rainforest in the world. Often referred to as the 'lungs of the Earth,' it produces about 20% of the world's oxygen. Deforestation remains a significant threat primarily driven by agriculture and logging.",
                        'questions' => [
                            [
                                'number' => 6,
                                'position' => 1,
                                'text' => 'What is the Amazon rainforest often referred to as?',
                                'points' => 2,
                                'options' => [
                                    ['text' => 'The heart of South America', 'correct' => false],
                                    ['text' => 'The lungs of the Earth', 'correct' => true],
                                    ['text' => 'The largest desert', 'correct' => false],
                                    ['text' => 'The longest river', 'correct' => false],
                                ]
                            ],
                            [
                                'number' => 7,
                                'position' => 2,
                                'text' => 'Approximately how much of the world’s oxygen is produced by the Amazon?',
                                'points' => 1,
                                'options' => [
                                    ['text' => '10%', 'correct' => false],
                                    ['text' => '20%', 'correct' => true],
                                    ['text' => '30%', 'correct' => false],
                                    ['text' => '50%', 'correct' => false],
                                ]
                            ],
                        ]
                    ],
                    [
                        'position' => 7,
                        'instruction' => 'Part B: Listening Section. Listen to the audio and answer questions 11-12.',
                        'audio_path' => 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Placeholder audio
                        'questions' => [
                            [
                                'number' => 11,
                                'position' => 1,
                                'text' => 'What is the speaker mainly talking about?',
                                'points' => 1,
                                'options' => [
                                    ['text' => 'Music theory', 'correct' => true],
                                    ['text' => 'Climate change', 'correct' => false],
                                    ['text' => 'Cooking recipes', 'correct' => false],
                                    ['text' => 'Travel plans', 'correct' => false],
                                ]
                            ],
                            [
                                'number' => 12,
                                'position' => 2,
                                'text' => 'Where does the conversation take place?',
                                'points' => 1,
                                'options' => [
                                    ['text' => 'At a library', 'correct' => false],
                                    ['text' => 'At a concert hall', 'correct' => true],
                                    ['text' => 'At a restaurant', 'correct' => false],
                                    ['text' => 'At an airport', 'correct' => false],
                                ]
                            ],
                        ]
                    ]
                ]
            ]
        ];

        foreach ($exams as $examData) {
            $exam = PtExam::create([
                'title' => $examData['title'],
                'slug' => Str::slug($examData['title']),
                'description' => $examData['description'],
                'duration_minutes' => $examData['duration_minutes'],
                'is_active' => $examData['is_active'],
            ]);

            if (isset($examData['standalone_questions'])) {
                foreach ($examData['standalone_questions'] as $qData) {
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
            }

            if (isset($examData['groups'])) {
                foreach ($examData['groups'] as $gData) {
                    $group = $exam->ptQuestionGroups()->create([
                        'instruction' => $gData['instruction'],
                        'reading_text' => $gData['reading_text'] ?? null,
                        'audio_path' => $gData['audio_path'] ?? null,
                        'position' => $gData['position'],
                    ]);

                    foreach ($gData['questions'] as $qData) {
                        $question = $exam->questions()->create([
                            'pt_question_group_id' => $group->id,
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
        }
    }
}
