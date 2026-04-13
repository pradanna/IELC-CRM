<?php

namespace App\Actions\CRM\PtExam;

use App\Models\PtQuestionGroup;
use Illuminate\Support\Facades\Storage;

class CreatePtQuestionGroupAction
{
    public function handle(array $data): PtQuestionGroup
    {
        $groupData = [
            'pt_exam_id' => $data['pt_exam_id'],
            'instruction' => $data['instruction'],
            'reading_text' => $data['reading_text'] ?? null,
            'position' => $this->getNextPosition($data['pt_exam_id']),
        ];

        if (isset($data['media']) && $data['media']->isValid()) {
            $groupData['audio_path'] = $data['media']->store('pt_exams/audio', 'public');
        }

        return PtQuestionGroup::create($groupData);
    }

    private function getNextPosition(string $examId): int
    {
        $maxGroup = \Illuminate\Support\Facades\DB::table('pt_question_groups')->where('pt_exam_id', $examId)->max('position') ?? 0;
        $maxQuestion = \Illuminate\Support\Facades\DB::table('pt_questions')->where('pt_exam_id', $examId)->whereNull('pt_question_group_id')->max('position') ?? 0;
        
        return max($maxGroup, $maxQuestion) + 1;
    }
}
