<?php

namespace App\Domains\Academic\Application\Exports;

use App\Domains\Academic\Domain\Models\BranchMonthlyStudentSnapshot;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Master\Domain\Models\Branch;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BranchMatrixExport
{
    public function build(Request $request): array
    {
        $year = (int) ($request->input('year') ?: now()->year);
        $branches = Branch::orderBy('name')->get();

        $monthNames = [
            1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
            5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
            9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December'
        ];

        $matrixData = [];
        $targetList = [];

        foreach ($branches as $branch) {
            if (strtoupper($branch->code ?? $branch->name) === 'SOLO' || str_contains(strtoupper($branch->name), 'SOLO')) {
                $targetList[] = [
                    'branch'     => $branch,
                    'title_name' => 'SOLO (ON CAMPUS / OFFLINE)',
                    'mode'       => 'offline',
                ];
                $targetList[] = [
                    'branch'     => $branch,
                    'title_name' => 'SOLO (ONLINE)',
                    'mode'       => 'online',
                ];
            } else {
                $targetList[] = [
                    'branch'     => $branch,
                    'title_name' => strtoupper($branch->name),
                    'mode'       => null,
                ];
            }
        }

        foreach ($targetList as $item) {
            $branch = $item['branch'];
            $titleName = $item['title_name'];
            $modeFilter = $item['mode'];

            $branchData = [
                'branch_name' => $titleName,
                'year' => $year,
                'months' => [],
                'totals' => [
                    'group' => 0, 'private' => 0, 'ielts' => 0, 'toefl' => 0,
                    'total_active' => 0, 'inactive' => 0, 'total_students' => 0
                ],
                'averages' => [
                    'group' => 0, 'private' => 0, 'ielts' => 0, 'toefl' => 0,
                    'total_active' => 0, 'inactive' => 0, 'total_students' => 0
                ]
            ];

            $now = now();
            $monthsCounted = 0;

            for ($m = 1; $m <= 12; $m++) {
                $isFutureMonth = ($year == $now->year && $m > $now->month) || ($year > $now->year);

                if ($isFutureMonth) {
                    $branchData['months'][$m] = [
                        'month_name'     => $monthNames[$m],
                        'group'          => '',
                        'private'        => '',
                        'ielts'          => '',
                        'toefl'          => '',
                        'total_active'   => '',
                        'inactive'       => '',
                        'total_students' => 0,
                        'is_empty'       => true,
                    ];
                    continue;
                }

                $monthsCounted++;
                $isPastMonth = ($year < $now->year) || ($year == $now->year && $m < $now->month);

                // ── 1. Past Month: Load from frozen DB Snapshot if available ─────
                if ($isPastMonth) {
                    $snapshot = BranchMonthlyStudentSnapshot::where('branch_id', $branch->id)
                        ->where('year', $year)
                        ->where('month', $m)
                        ->first();

                    if ($snapshot && (int) $snapshot->total_students_count > 0) {
                        $branchData['months'][$m] = [
                            'month_name'     => $monthNames[$m],
                            'group'          => $snapshot->group_count,
                            'private'        => $snapshot->private_count,
                            'ielts'          => $snapshot->ielts_count,
                            'toefl'          => $snapshot->toefl_count,
                            'total_active'   => $snapshot->total_active_count,
                            'inactive'       => $snapshot->inactive_count,
                            'total_students' => $snapshot->total_students_count,
                            'is_empty'       => false,
                        ];

                        $branchData['totals']['group']          += $snapshot->group_count;
                        $branchData['totals']['private']        += $snapshot->private_count;
                        $branchData['totals']['ielts']          += $snapshot->ielts_count;
                        $branchData['totals']['toefl']          += $snapshot->toefl_count;
                        $branchData['totals']['total_active']   += $snapshot->total_active_count;
                        $branchData['totals']['inactive']       += $snapshot->inactive_count;
                        $branchData['totals']['total_students'] += $snapshot->total_students_count;
                    } else {
                        $branchData['months'][$m] = [
                            'month_name'     => $monthNames[$m],
                            'group'          => '-',
                            'private'        => '-',
                            'ielts'          => '-',
                            'toefl'          => '-',
                            'total_active'   => '-',
                            'inactive'       => '-',
                            'total_students' => '-',
                            'is_empty'       => true,
                        ];
                    }
                    continue;
                }

                // ── 2. Current Month: Live Calculation ───────────────────────────
                $activeEnrollmentsQuery = DB::table('lead_enrollments as le')
                    ->join('students as s', 'le.student_id', '=', 's.id')
                    ->join('leads as l', 's.lead_id', '=', 'l.id')
                    ->leftJoin('study_classes as sc', 'le.study_class_id', '=', 'sc.id')
                    ->leftJoin('price_masters as pm', 'sc.price_master_id', '=', 'pm.id')
                    ->where('l.branch_id', $branch->id)
                    ->where('s.status', 'active')
                    ->where('le.status', 'active');

                if ($modeFilter === 'online') {
                    $activeEnrollmentsQuery->where(function($q) {
                        $q->where('sc.type', 'online')
                          ->orWhere(fn($sq) => $sq->whereNull('sc.type')->where('l.is_online', 1));
                    });
                } elseif ($modeFilter === 'offline') {
                    $activeEnrollmentsQuery->where(function($q) {
                        $q->where(fn($sq) => $sq->whereNotNull('sc.type')->where('sc.type', '!=', 'online'))
                          ->orWhere(fn($sq) => $sq->whereNull('sc.type')->where(fn($ssq) => $ssq->where('l.is_online', 0)->orWhereNull('l.is_online')));
                    });
                }

                $activeEnrollments = $activeEnrollmentsQuery->select([
                    's.id as student_id',
                    'sc.name as class_name',
                    'sc.category as class_category',
                    'sc.type as delivery_type',
                    'pm.name as package_name',
                ])->get();

                $groupCount = 0;
                $privateCount = 0;
                $ieltsCount = 0;
                $toeflCount = 0;

                $uniqueStudentIds = [];

                foreach ($activeEnrollments as $enr) {
                    $uniqueStudentIds[$enr->student_id] = true;
                    $classNameUpper = strtoupper(($enr->class_name ?? '') . ' ' . ($enr->package_name ?? '') . ' ' . ($enr->class_category ?? ''));

                    if (str_contains($classNameUpper, 'IELTS')) {
                        $ieltsCount++;
                    } elseif (str_contains($classNameUpper, 'TOEFL')) {
                        $toeflCount++;
                    } elseif (str_contains($classNameUpper, 'GROUP') || str_contains($classNameUpper, '& CO') || str_contains($classNameUpper, '&CO')) {
                        $groupCount++;
                    } elseif (str_contains($classNameUpper, 'PRIVATE') || str_contains($classNameUpper, 'PRIVAT')) {
                        $privateCount++;
                    } else {
                        $groupCount++;
                    }
                }

                $totalActive = count($uniqueStudentIds);

                $inactiveQuery = Student::whereHas('lead', fn($q) => $q->where('branch_id', $branch->id))
                    ->where('status', 'stop')
                    ->whereYear('stopped_at', $year)
                    ->whereMonth('stopped_at', $m);

                if ($modeFilter === 'online') {
                    $inactiveQuery->whereHas('lead', fn($q) => $q->where('is_online', 1));
                } elseif ($modeFilter === 'offline') {
                    $inactiveQuery->whereHas('lead', fn($q) => $q->where('is_online', 0)->orWhereNull('is_online'));
                }

                $inactiveCount = $inactiveQuery->count();
                $totalStudents = $totalActive + $inactiveCount;

                $branchData['months'][$m] = [
                    'month_name'     => $monthNames[$m],
                    'group'          => $groupCount,
                    'private'        => $privateCount,
                    'ielts'          => $ieltsCount,
                    'toefl'          => $toeflCount,
                    'total_active'   => $totalActive,
                    'inactive'       => $inactiveCount,
                    'total_students' => $totalStudents,
                    'is_empty'       => false,
                ];

                $branchData['totals']['group'] += $groupCount;
                $branchData['totals']['private'] += $privateCount;
                $branchData['totals']['ielts'] += $ieltsCount;
                $branchData['totals']['toefl'] += $toeflCount;
                $branchData['totals']['total_active'] += $totalActive;
                $branchData['totals']['inactive'] += $inactiveCount;
                $branchData['totals']['total_students'] += $totalStudents;
            }

            // Calculate averages
            $divisor = max(1, $monthsCounted);
            foreach ($branchData['totals'] as $key => $sum) {
                $branchData['averages'][$key] = (int) round($sum / $divisor);
            }

            $matrixData[] = $branchData;
        }

        $headers = ['Month', 'Group', 'Private', 'IELTS', 'TOEFL', 'In Active', 'Total', 'Total Student Active'];

        return [
            $headers,
            $matrixData,
            "student-numbers-matrix-{$year}",
            "Student Numbers Campus {$year}",
        ];
    }

    public function toExcelHtml(array $matrixData): string
    {
        $branchChunks = array_chunk($matrixData, 2);

        $html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
        $html .= '<head><meta charset="UTF-8">';
        $html .= '<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Student Numbers Matrix</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
        $html .= '<style>';
        $html .= 'body { font-family: Arial, sans-serif; font-size: 11px; }';
        $html .= 'table { border-collapse: collapse; margin-bottom: 20px; }';
        $html .= 'th, td { border: 1px solid #000000; padding: 5px 8px; text-align: center; font-size: 11px; }';
        $html .= 'th.title-header { font-size: 13px; font-weight: bold; text-align: center; border: 2px solid #000000; text-transform: uppercase; }';
        $html .= 'th.col-header { background-color: #d1d5db; font-weight: bold; border: 1px solid #000000; }';
        $html .= 'td.month-cell { text-align: left; }';
        $html .= 'tr.summary-row td { background-color: #9ca3af; font-weight: bold; border: 1px solid #000000; }';
        $html .= '</style></head><body>';

        foreach ($branchChunks as $chunk) {
            $b1 = $chunk[0] ?? null;
            $b2 = $chunk[1] ?? null;

            if (!$b1) continue;

            $html .= '<table><thead>';

            // Title Row
            $html .= '<tr>';
            $html .= '<th colspan="8" class="title-header">STUDENT NUMBERS ' . strtoupper($b1['branch_name']) . ' ' . $b1['year'] . '</th>';
            $html .= '<th style="border:none;"></th>';
            if ($b2) {
                $html .= '<th colspan="8" class="title-header">STUDENT NUMBERS ' . strtoupper($b2['branch_name']) . ' ' . $b2['year'] . '</th>';
            }
            $html .= '</tr>';

            // Column Header Row
            $cols = ['Month', 'Group', 'Private', 'IELTS', 'TOEFL', 'Total', 'In Active', 'Total Students'];
            $html .= '<tr>';
            foreach ($cols as $c) {
                $html .= '<th class="col-header">' . $c . '</th>';
            }
            $html .= '<th style="border:none;"></th>';
            if ($b2) {
                foreach ($cols as $c) {
                    $html .= '<th class="col-header">' . $c . '</th>';
                }
            }
            $html .= '</tr></thead><tbody>';

            // Month Rows
            for ($m = 1; $m <= 12; $m++) {
                $m1 = $b1['months'][$m];
                $html .= '<tr>';
                $html .= '<td class="month-cell">' . $m1['month_name'] . '</td>';
                if (!empty($m1['is_empty'])) {
                    $html .= '<td></td><td></td><td></td><td></td><td></td><td></td><td style="font-weight:bold;">0</td>';
                } else {
                    $html .= '<td>' . $m1['group'] . '</td>';
                    $html .= '<td>' . $m1['private'] . '</td>';
                    $html .= '<td>' . $m1['ielts'] . '</td>';
                    $html .= '<td>' . $m1['toefl'] . '</td>';
                    $html .= '<td>' . $m1['total_active'] . '</td>';
                    $html .= '<td>' . $m1['inactive'] . '</td>';
                    $html .= '<td style="font-weight:bold;">' . $m1['total_students'] . '</td>';
                }

                $html .= '<td style="border:none;"></td>';

                if ($b2) {
                    $m2 = $b2['months'][$m];
                    $html .= '<td class="month-cell">' . $m2['month_name'] . '</td>';
                    if (!empty($m2['is_empty'])) {
                        $html .= '<td></td><td></td><td></td><td></td><td></td><td></td><td style="font-weight:bold;">0</td>';
                    } else {
                        $html .= '<td>' . $m2['group'] . '</td>';
                        $html .= '<td>' . $m2['private'] . '</td>';
                        $html .= '<td>' . $m2['ielts'] . '</td>';
                        $html .= '<td>' . $m2['toefl'] . '</td>';
                        $html .= '<td>' . $m2['total_active'] . '</td>';
                        $html .= '<td>' . $m2['inactive'] . '</td>';
                        $html .= '<td style="font-weight:bold;">' . $m2['total_students'] . '</td>';
                    }
                }
                $html .= '</tr>';
            }

            // Total Row
            $t1 = $b1['totals'];
            $html .= '<tr class="summary-row">';
            $html .= '<td class="month-cell">Total</td>';
            $html .= '<td>' . $t1['group'] . '</td><td>' . $t1['private'] . '</td><td>' . $t1['ielts'] . '</td><td>' . $t1['toefl'] . '</td>';
            $html .= '<td>' . $t1['total_active'] . '</td><td>' . $t1['inactive'] . '</td><td>' . $t1['total_students'] . '</td>';
            $html .= '<td style="border:none;background:none;"></td>';

            if ($b2) {
                $t2 = $b2['totals'];
                $html .= '<td class="month-cell">Total</td>';
                $html .= '<td>' . $t2['group'] . '</td><td>' . $t2['private'] . '</td><td>' . $t2['ielts'] . '</td><td>' . $t2['toefl'] . '</td>';
                $html .= '<td>' . $t2['total_active'] . '</td><td>' . $t2['inactive'] . '</td><td>' . $t2['total_students'] . '</td>';
            }
            $html .= '</tr>';

            // Average Row
            $a1 = $b1['averages'];
            $html .= '<tr class="summary-row">';
            $html .= '<td class="month-cell">Average</td>';
            $html .= '<td>' . $a1['group'] . '</td><td>' . $a1['private'] . '</td><td>' . $a1['ielts'] . '</td><td>' . $a1['toefl'] . '</td>';
            $html .= '<td>' . $a1['total_active'] . '</td><td>' . $a1['inactive'] . '</td><td>' . $a1['total_students'] . '</td>';
            $html .= '<td style="border:none;background:none;"></td>';

            if ($b2) {
                $a2 = $b2['averages'];
                $html .= '<td class="month-cell">Average</td>';
                $html .= '<td>' . $a2['group'] . '</td><td>' . $a2['private'] . '</td><td>' . $a2['ielts'] . '</td><td>' . $a2['toefl'] . '</td>';
                $html .= '<td>' . $a2['total_active'] . '</td><td>' . $a2['inactive'] . '</td><td>' . $a2['total_students'] . '</td>';
            }
            $html .= '</tr>';

            $html .= '</tbody></table><br/><br/>';
        }

        $html .= '</body></html>';
        return $html;
    }
}
