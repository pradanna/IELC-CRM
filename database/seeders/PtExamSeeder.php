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
        $exams = [
            [
                'title' => 'General English Placement Test',
                'description' => 'Tes penempatan bahasa Inggris umum yang mencakup tata bahasa (grammar), kosakata (vocabulary), dan pemahaman bacaan (reading comprehension).',
                'duration_minutes' => 60,
                'is_active' => true,
                'standalone_questions' => [
                    [
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
                        'instruction' => 'Read the following text carefully and answer questions 6 to 10.',
                        'reading_text' => "The Amazon rainforest is the largest tropical rainforest in the world. It covers over 5.5 million square kilometers and spans across nine countries in South America, with the majority located in Brazil. Often referred to as the 'lungs of the Earth,' it produces about 20% of the world's oxygen. The Amazon is home to incredibly diverse ecosystems, containing millions of species of insects, plants, and animals. However, deforestation remains a significant threat to its survival, primarily driven by agriculture and logging.",
                        'questions' => [
                            [
                                'text' => 'What is the Amazon rainforest often referred to as?',
                                'points' => 1,
                                'options' => [
                                    ['text' => 'The heart of South America', 'correct' => false],
                                    ['text' => 'The lungs of the Earth', 'correct' => true],
                                    ['text' => 'The largest desert', 'correct' => false],
                                    ['text' => 'The longest river', 'correct' => false],
                                ]
                            ],
                            [
                                'text' => 'How many countries does the Amazon rainforest span across?',
                                'points' => 1,
                                'options' => [
                                    ['text' => 'Five countries', 'correct' => false],
                                    ['text' => 'Seven countries', 'correct' => false],
                                    ['text' => 'Nine countries', 'correct' => true],
                                    ['text' => 'Eleven countries', 'correct' => false],
                                ]
                            ],
                            [
                                'text' => 'In which continent is the Amazon rainforest primarily located?',
                                'points' => 1,
                                'options' => [
                                    ['text' => 'North America', 'correct' => false],
                                    ['text' => 'Africa', 'correct' => false],
                                    ['text' => 'Asia', 'correct' => false],
                                    ['text' => 'South America', 'correct' => true],
                                ]
                            ],
                            [
                                'text' => 'Approximately how much of the world’s oxygen is produced by the Amazon?',
                                'points' => 1,
                                'options' => [
                                    ['text' => '10%', 'correct' => false],
                                    ['text' => '20%', 'correct' => true],
                                    ['text' => '30%', 'correct' => false],
                                    ['text' => '50%', 'correct' => false],
                                ]
                            ],
                            [
                                'text' => 'According to the text, what is the main cause of deforestation in the Amazon?',
                                'points' => 1,
                                'options' => [
                                    ['text' => 'Climate change', 'correct' => false],
                                    ['text' => 'Urban development', 'correct' => false],
                                    ['text' => 'Agriculture and logging', 'correct' => true],
                                    ['text' => 'Tourism', 'correct' => false],
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
                        'reading_text' => $gData['reading_text'],
                    ]);

                    foreach ($gData['questions'] as $qData) {
                        $question = $exam->questions()->create([
                            'pt_question_group_id' => $group->id,
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
