<?php

namespace App\Http\Controllers\Admin\Academic;

use App\Domains\Academic\Application\Exports\BranchMatrixExport;
use App\Domains\Academic\Application\Exports\ClassTransfersExport;
use App\Domains\Academic\Application\Exports\ExportFormatter;
use App\Domains\Academic\Application\Exports\JoinLifecycleExport;
use App\Domains\Academic\Application\Exports\JoinPatternsExport;
use App\Domains\Academic\Application\Exports\OverallAndGradesExport;
use App\Domains\Academic\Application\Exports\SiswaStopExport;
use App\Domains\Academic\Application\Exports\StudentListExport;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class StudentExportController extends Controller
{
    public function __construct(
        protected StudentListExport $studentListExport,
        protected JoinLifecycleExport $joinLifecycleExport,
        protected JoinPatternsExport $joinPatternsExport,
        protected SiswaStopExport $siswaStopExport,
        protected BranchMatrixExport $branchMatrixExport,
        protected ClassTransfersExport $classTransfersExport,
        protected OverallAndGradesExport $overallAndGradesExport
    ) {}

    /**
     * Export as Excel (.xls or .csv).
     */
    public function exportExcel(Request $request): Response
    {
        $tab = $request->input('tab', 'list');

        if ($tab === 'join_lifecycle') {
            $lifecycleData = $this->joinLifecycleExport->build($request);
            $content = view('pdf.join-lifecycle-export', $lifecycleData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$lifecycleData['filename']}.xls\"",
            ]);
        }

        if ($tab === 'join_patterns') {
            $pivotData = $this->joinPatternsExport->buildPivot($request);
            $content = view('pdf.join-pattern-export', $pivotData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$pivotData['filename']}.xls\"",
            ]);
        }

        if ($tab === 'join_invoices') {
            $invoiceData = $this->joinPatternsExport->buildInvoices($request);
            $content = view('pdf.join-invoices-export', $invoiceData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$invoiceData['filename']}.xls\"",
            ]);
        }

        if ($tab === 'join_grades') {
            $gradeData = $this->joinPatternsExport->buildGrades($request);
            $content = view('pdf.join-grades-export', $gradeData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$gradeData['filename']}.xls\"",
            ]);
        }

        if (in_array($tab, ['siswa_stop_packages', 'siswa_stop_programs', 'siswa_stop_grades'])) {
            $groupType = str_replace('siswa_stop_', '', $tab);
            $stopData = $this->siswaStopExport->buildPivot($request, $groupType);
            $content = view('pdf.siswa-stop-export', $stopData)->render();
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$stopData['filename']}.xls\"",
            ]);
        }

        [$headers, $rows, $filename] = $this->buildData($request, $tab);

        if (in_array($tab, ['overall', 'branch_matrix'])) {
            $content = $this->branchMatrixExport->toExcelHtml($rows);
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}.xls\"",
            ]);
        }

        if ($tab === 'list') {
            $content = $this->studentListExport->toExcelHtml($headers, $rows);
            return response($content, 200, [
                'Content-Type'        => 'application/vnd.ms-excel; charset=UTF-8',
                'Content-Disposition' => "attachment; filename=\"{$filename}.xls\"",
            ]);
        }

        $csv = ExportFormatter::buildCsv($headers, $rows);

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}.csv\"",
        ]);
    }

    /**
     * Export as PDF file download attachment.
     */
    public function exportPdf(Request $request)
    {
        ini_set('memory_limit', '1024M');
        ini_set('max_execution_time', '300');

        $tab = $request->input('tab', 'list');

        if ($tab === 'join_lifecycle') {
            $lifecycleData = $this->joinLifecycleExport->build($request);
            $pdf = Pdf::loadView('pdf.join-lifecycle-export', $lifecycleData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$lifecycleData['filename']}.pdf");
        }

        if ($tab === 'join_patterns') {
            $pivotData = $this->joinPatternsExport->buildPivot($request);
            $pdf = Pdf::loadView('pdf.join-pattern-export', $pivotData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$pivotData['filename']}.pdf");
        }

        if ($tab === 'join_invoices') {
            $invoiceData = $this->joinPatternsExport->buildInvoices($request);
            $pdf = Pdf::loadView('pdf.join-invoices-export', $invoiceData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$invoiceData['filename']}.pdf");
        }

        if ($tab === 'join_grades') {
            $gradeData = $this->joinPatternsExport->buildGrades($request);
            $pdf = Pdf::loadView('pdf.join-grades-export', $gradeData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$gradeData['filename']}.pdf");
        }

        if (in_array($tab, ['siswa_stop_packages', 'siswa_stop_programs', 'siswa_stop_grades'])) {
            $groupType = str_replace('siswa_stop_', '', $tab);
            $stopData = $this->siswaStopExport->buildPivot($request, $groupType);
            $pdf = Pdf::loadView('pdf.siswa-stop-export', $stopData)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'isHtml5ParserEnabled' => false,
                    'isPhpEnabled' => true,
                    'enable_font_subsetting' => false,
                ]);
            return $pdf->download("{$stopData['filename']}.pdf");
        }

        [$headers, $rows, $filename, $title] = $this->buildData($request, $tab);

        $year  = $request->input('year', now()->year);
        $month = $request->input('month');

        if (in_array($tab, ['overall', 'branch_matrix'])) {
            $pdf = Pdf::loadView('pdf.branch-monthly-matrix', [
                'matrixData' => $rows,
                'year'       => $year,
                'filename'   => $filename,
            ])->setPaper('a4', 'landscape')
              ->setOptions([
                  'isHtml5ParserEnabled' => false,
                  'isPhpEnabled' => true,
                  'enable_font_subsetting' => false,
              ]);

            return $pdf->download("{$filename}.pdf");
        }

        $pdf = Pdf::loadView('pdf.student-export', [
            'title'    => $title,
            'headers'  => $headers,
            'rows'     => $rows,
            'filename' => $filename,
            'year'     => $year,
            'month'    => $month,
            'tab'      => $tab,
        ])->setPaper('a4', 'landscape')
          ->setOptions([
              'isHtml5ParserEnabled' => false,
              'isPhpEnabled' => true,
              'enable_font_subsetting' => false,
          ]);

        return $pdf->download("{$filename}.pdf");
    }

    private function buildData(Request $request, string $tab): array
    {
        return match ($tab) {
            'list'            => $this->studentListExport->build($request),
            'branch_matrix'   => $this->branchMatrixExport->build($request),
            'overall'         => $this->branchMatrixExport->build($request),
            'join_patterns'   => $this->joinPatternsExport->build($request),
            'siswa_stop'      => $this->siswaStopExport->build($request),
            'class_transfers' => $this->classTransfersExport->build($request),
            'grades'          => $this->overallAndGradesExport->buildGrades($request),
            default           => $this->studentListExport->build($request),
        };
    }
}
