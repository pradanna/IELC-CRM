<?php

namespace App\Domains\Academic\Application\Exports;

class ExportFormatter
{
    public static function normalizeGradeCategory(?string $rawGrade): string
    {
        if (empty($rawGrade) || in_array(trim($rawGrade), ['-', '–', '—', 'none', 'null', 'Tidak Terdefinisi'])) {
            return 'Tidak Terdefinisi';
        }

        $upper = strtoupper(trim($rawGrade));

        if (str_contains($upper, 'TK') || str_contains($upper, 'PAUD') || str_contains($upper, 'PG') || str_contains($upper, 'PLAYGROUP') || str_contains($upper, 'KB') || str_contains($upper, 'KINDERGARTEN')) {
            return 'TK / PAUD';
        }

        if (str_contains($upper, 'SMA') || str_contains($upper, 'SMK') || str_contains($upper, 'SLTA') || str_contains($upper, 'SENIOR') || str_contains($upper, 'ALIYAH') || str_contains($upper, 'XI') || str_contains($upper, 'XII') || str_contains($upper, '10TH') || preg_match('/\b(SMA|SMK)\s*[1-3]/i', $upper)) {
            return 'SMA / SMK';
        }

        if (str_contains($upper, 'SMP') || str_contains($upper, 'JUNIOR') || str_contains($upper, 'MTS') || preg_match('/\bSMP\s*[1-3]/i', $upper)) {
            return 'SMP';
        }

        if (str_contains($upper, 'SD') || preg_match('/^(SD|D)\s*[1-6]/i', $upper) || str_contains($upper, 'PRIMARY') || str_contains($upper, 'ELEMENTARY')) {
            return 'SD';
        }

        if (str_contains($upper, 'MAHASISWA') || str_contains($upper, 'KULIAH') || str_contains($upper, 'UNIV') || str_contains($upper, 'KAMPUS') || str_contains($upper, 'COLLEGE')) {
            return 'Mahasiswa';
        }

        if (str_contains($upper, 'UMUM') || str_contains($upper, 'DEWASA') || str_contains($upper, 'KERJA') || str_contains($upper, 'KARYAWAN') || str_contains($upper, 'PROFESIONAL')) {
            return 'Umum';
        }

        return 'Umum';
    }

    public static function applyDateFilter($query, string $col, int $year, ?int $month, bool $isSqlite): void
    {
        if ($isSqlite) {
            $query->whereRaw("cast(strftime('%Y', {$col}) as integer) = ?", [$year]);
            if ($month) {
                $query->whereRaw("cast(strftime('%m', {$col}) as integer) = ?", [$month]);
            }
        } else {
            $query->whereYear($col, $year);
            if ($month) {
                $query->whereMonth($col, $month);
            }
        }
    }

    public static function buildCsv(array $headers, array $rows): string
    {
        $handle = fopen('php://temp', 'r+');
        fputs($handle, "\xEF\xBB\xBF"); // BOM for Excel UTF-8
        fputcsv($handle, $headers);
        foreach ($rows as $row) {
            fputcsv($handle, $row);
        }
        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);
        return $csv;
    }
}
