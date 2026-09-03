<?php

namespace Tests\Unit\Domains\Academic;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Domains\Academic\Domain\Models\PtExam;
use App\Domains\Academic\Domain\Models\PtSession;
use App\Domains\Academic\Domain\Models\PtGeneralQuestionGroup;
use App\Domains\Academic\Domain\Models\PtGeneralQuestion;
use App\Domains\Academic\Domain\Models\PtGeneralQuestionOption;
use App\Domains\Academic\Domain\Models\PtKidsQuestion;
use App\Domains\Academic\Domain\Models\PtKidsAnswer;
use App\Domains\Academic\Domain\Models\PtIeltsSection;
use App\Domains\Academic\Domain\Models\PtIeltsTask;
use App\Domains\Academic\Domain\Models\PtIeltsAnswer;
use App\Http\Resources\Crm\PtExam\PtExamPublicResource;
use Illuminate\Http\Request;

class PlacementTestMultiDomainTest extends TestCase
{
    /** @test */
    public function it_can_instantiate_general_domain_models_and_relations()
    {
        $exam = new PtExam([
            'id' => '00000000-0000-0000-0000-000000000001',
            'title' => 'General English Diagnostic',
            'category' => 'General',
            'duration_minutes' => 45,
        ]);

        $group = new PtGeneralQuestionGroup([
            'id' => '00000000-0000-0000-0000-000000000002',
            'pt_exam_id' => $exam->id,
            'instruction' => 'Choose the correct answer',
            'position' => 1,
        ]);

        $question = new PtGeneralQuestion([
            'id' => '00000000-0000-0000-0000-000000000003',
            'pt_exam_id' => $exam->id,
            'pt_general_question_group_id' => $group->id,
            'number' => 1,
            'type' => 'mcq',
            'question_text' => 'She ___ to school everyday.',
            'points' => 1,
        ]);

        $option = new PtGeneralQuestionOption([
            'id' => '00000000-0000-0000-0000-000000000004',
            'pt_general_question_id' => $question->id,
            'option_text' => 'goes',
            'is_correct' => true,
        ]);

        $this->assertEquals('General', $exam->category);
        $this->assertEquals('goes', $option->option_text);
        $this->assertTrue($option->is_correct);
    }

    /** @test */
    public function it_can_instantiate_kids_domain_models_and_canvas_data()
    {
        $exam = new PtExam([
            'id' => '00000000-0000-0000-0000-000000000010',
            'title' => 'Kids Starters Placement',
            'category' => 'Kids',
        ]);

        $canvasData = [
            'canvas' => ['background_url' => '/test.png'],
            'targets' => [
                ['id' => 't1', 'type' => 'word_target', 'correct_token_id' => 'tok_apple']
            ],
            'tokens' => [
                ['id' => 'tok_apple', 'label' => 'Apple']
            ]
        ];

        $kidsQuestion = new PtKidsQuestion([
            'id' => '00000000-0000-0000-0000-000000000011',
            'pt_exam_id' => $exam->id,
            'mode' => 'freeform_canvas',
            'instruction' => 'Drag the word Apple to the picture',
            'canvas_data' => $canvasData,
        ]);

        $kidsAnswer = new PtKidsAnswer([
            'id' => '00000000-0000-0000-0000-000000000012',
            'pt_session_id' => '00000000-0000-0000-0000-000000000099',
            'pt_kids_question_id' => $kidsQuestion->id,
            'user_mapping' => ['t1' => 'tok_apple'],
            'is_correct' => true,
            'score_earned' => 1,
            'teacher_notes' => 'Good observation',
        ]);

        $this->assertEquals('freeform_canvas', $kidsQuestion->mode);
        $this->assertTrue($kidsAnswer->is_correct);
        $this->assertEquals(1, $kidsAnswer->score_earned);
        $this->assertEquals('Good observation', $kidsAnswer->teacher_notes);
    }

    /** @test */
    public function it_can_instantiate_ielts_domain_models_and_criteria_scores()
    {
        $exam = new PtExam([
            'id' => '00000000-0000-0000-0000-000000000020',
            'title' => 'IELTS Placement Diagnostic',
            'category' => 'IELTS',
        ]);

        $task = new PtIeltsTask([
            'id' => '00000000-0000-0000-0000-000000000022',
            'pt_exam_id' => $exam->id,
            'skill_type' => 'writing',
            'title' => 'Academic Writing Task 2',
            'description' => 'Write about climate change',
            'min_words' => 250,
            'max_score' => 9.0,
        ]);

        $answer = new PtIeltsAnswer([
            'id' => '00000000-0000-0000-0000-000000000023',
            'pt_session_id' => '00000000-0000-0000-0000-000000000099',
            'pt_ielts_task_id' => $task->id,
            'essay_text' => 'Global warming is a critical issue...',
            'score_tr' => 7.0,
            'score_cc' => 6.5,
            'score_lr' => 7.0,
            'score_gra' => 6.5,
            'band_score' => 6.75,
            'evaluator_notes' => 'Good vocabulary, need more coherence in body 2.',
        ]);

        $this->assertEquals(7.0, $answer->score_tr);
        $this->assertEquals(6.75, $answer->band_score);
        $this->assertEquals('writing', $task->skill_type);
    }

    /** @test */
    public function it_can_transform_kids_exam_to_normalized_pages()
    {
        $exam = new PtExam([
            'id' => '00000000-0000-0000-0000-000000000010',
            'title' => 'Kids Starters Placement',
            'category' => 'Kids',
            'duration_minutes' => 30,
            'slug' => 'kids-starters',
        ]);

        $kidsQuestion = new PtKidsQuestion([
            'id' => '00000000-0000-0000-0000-000000000011',
            'pt_exam_id' => $exam->id,
            'mode' => 'freeform_canvas',
            'instruction' => 'Drag the words to the picture',
            'canvas_data' => ['tokens' => [], 'targets' => []],
            'position' => 1,
        ]);

        $exam->setRelation('kidsQuestions', collect([$kidsQuestion]));

        $resource = new PtExamPublicResource($exam);
        $result = $resource->toArray(new Request());

        $this->assertEquals('Kids', $result['category']);
        $this->assertEquals(1, $result['total_questions']);
        $this->assertCount(1, $result['pages']);
        $this->assertEquals('drag_drop', $result['pages'][0]['questions'][0]['type']);
        $this->assertEquals('freeform_canvas', $result['pages'][0]['questions'][0]['kid_canvas']['mode']);
    }
}
