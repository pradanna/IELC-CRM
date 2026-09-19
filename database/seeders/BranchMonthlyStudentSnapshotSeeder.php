<?php

namespace Database\Seeders;

use App\Domains\Academic\Domain\Models\BranchMonthlyStudentSnapshot;
use App\Domains\Master\Domain\Models\Branch;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class BranchMonthlyStudentSnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $soloBranch = Branch::where('code', 'SOLO')->first() ?: Branch::first();
        if (!$soloBranch) {
            $this->command->warn('Branch Solo tidak ditemukan.');
            return;
        }

        $this->seedSoloSnapshots($soloBranch);
        $this->seedOnlineSnapshots($soloBranch);
    }

    private function seedSoloSnapshots(Branch $soloBranch): void
    {
        $possiblePaths = [
            base_path('docs/initiate data/solo/jumlah-siswa-solo2026.csv'),
            base_path('docs/initiate data/solo/jumlah-siswa-solo.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            $this->command->warn('File CSV jumlah-siswa-solo2026.csv tidak ditemukan.');
            return;
        }

        $this->command->info("Membaca laporan jumlah siswa Solo dari: {$filePath}");

        $file = fopen($filePath, 'r');
        $importedCount = 0;

        while (($row = fgetcsv($file)) !== false) {
            $period = isset($row[0]) ? trim($row[0]) : '';
            if (empty($period) || in_array(strtolower($period), ['month', 'bulan', 'periode'])) {
                continue;
            }

            $date = $this->parsePeriod($period);
            if (!$date) {
                continue;
            }

            $year = $date->year;
            $month = $date->month;

            // Columns mapping:
            // 0: Month-Year (Jan-26)
            // 1: Group
            // 2: Private
            // 3: IELTS
            // 4: TOEFL
            // 5: Total Active
            // 6: In Active / Stop
            // 7: Total Students
            // 8: Notes / extra total
            $groupCount       = isset($row[1]) ? (int) $row[1] : 0;
            $privateCount     = isset($row[2]) ? (int) $row[2] : 0;
            $ieltsCount       = isset($row[3]) ? (int) $row[3] : 0;
            $toeflCount       = isset($row[4]) ? (int) $row[4] : 0;
            $totalActiveCount = isset($row[5]) ? (int) $row[5] : ($groupCount + $privateCount + $ieltsCount + $toeflCount);
            $inactiveCount    = isset($row[6]) ? (int) $row[6] : 0;
            $totalStudents    = isset($row[7]) ? (int) $row[7] : ($totalActiveCount + $inactiveCount);

            // If column 8 is present and looks like the grand total (e.g. 577), adjust if column 7 is smaller
            if (isset($row[8]) && is_numeric(trim($row[8])) && (int)$row[8] > $totalStudents) {
                // In some CSV structures: 1=Group, 2=Private, 3=IELTS, 4=TOEFL, 5=Extra, 6=Active, 7=Inactive, 8=Total
                // Let's store total_students_count accurately:
                $totalStudents = (int) $row[8];
            }

            BranchMonthlyStudentSnapshot::updateOrCreate(
                [
                    'branch_id' => $soloBranch->id,
                    'year'      => $year,
                    'month'     => $month,
                ],
                [
                    'group_count'          => $groupCount,
                    'private_count'        => $privateCount,
                    'ielts_count'          => $ieltsCount,
                    'toefl_count'          => $toeflCount,
                    'total_active_count'   => $totalActiveCount,
                    'inactive_count'       => $inactiveCount,
                    'total_students_count' => $totalStudents,
                ]
            );

            $importedCount++;
        }

        fclose($file);
        $this->command->info("Berhasil mengimpor {$importedCount} snapshot bulanan Solo.");
    }

    private function seedOnlineSnapshots(Branch $soloBranch): void
    {
        $possiblePaths = [
            base_path('docs/initiate data/solo/jumlah-siswa-online2026.csv'),
            base_path('docs/initiate data/solo/jumlah-siswa-online.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            $this->command->warn('File CSV jumlah-siswa-online2026.csv tidak ditemukan.');
            return;
        }

        $this->command->info("Membaca laporan jumlah siswa Online dari: {$filePath}");

        $file = fopen($filePath, 'r');
        $importedCount = 0;

        while (($row = fgetcsv($file)) !== false) {
            $period = isset($row[0]) ? trim($row[0]) : '';
            if (empty($period) || in_array(strtolower($period), ['month', 'bulan', 'periode'])) {
                continue;
            }

            $date = $this->parsePeriod($period);
            if (!$date) {
                continue;
            }

            $year = $date->year;
            $month = $date->month;

            $groupCount       = isset($row[1]) ? (int) $row[1] : 0;
            $privateCount     = isset($row[2]) ? (int) $row[2] : 0;
            $ieltsCount       = isset($row[3]) ? (int) $row[3] : 0;
            $toeflCount       = isset($row[4]) ? (int) $row[4] : 0;
            $totalActiveCount = isset($row[5]) ? (int) $row[5] : ($groupCount + $privateCount + $ieltsCount + $toeflCount);
            $inactiveCount    = isset($row[6]) ? (int) $row[6] : 0;
            $totalStudents    = isset($row[7]) ? (int) $row[7] : ($totalActiveCount + $inactiveCount);

            if (isset($row[8]) && is_numeric(trim($row[8])) && (int)$row[8] > $totalStudents) {
                $totalStudents = (int) $row[8];
            }

            // We can also ensure the snapshot stores the totals
            $importedCount++;
        }

        fclose($file);
        $this->command->info("Berhasil membaca {$importedCount} baris data snapshot Online.");
    }

    private function parsePeriod(string $period): ?Carbon
    {
        $period = trim($period);
        $replacements = [
            'jan' => 'January',
            'feb' => 'February',
            'mar' => 'March',
            'apr' => 'April',
            'may' => 'May',
            'mei' => 'May',
            'jun' => 'June',
            'jul' => 'July',
            'aug' => 'August',
            'agu' => 'August',
            'sep' => 'September',
            'oct' => 'October',
            'okt' => 'October',
            'nov' => 'November',
            'dec' => 'December',
            'des' => 'December',
        ];

        $lower = strtolower($period);
        foreach ($replacements as $short => $full) {
            if (str_starts_with($lower, $short)) {
                $lower = str_replace($short, $full, $lower);
                break;
            }
        }

        try {
            return Carbon::parse($lower);
        } catch (\Exception $e) {
            return null;
        }
    }
}
