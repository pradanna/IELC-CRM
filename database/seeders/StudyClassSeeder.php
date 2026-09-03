<?php

namespace Database\Seeders;

use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Master\Domain\Models\Branch;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class StudyClassSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $soloBranch = Branch::where('code', 'SOLO')->first() ?: Branch::first();
        $semarangBranch = Branch::where('code', 'SMG')->first();

        if (!$soloBranch) {
            $this->command->warn('No branch found. Please run BranchSeeder first.');
            return;
        }

        // Load all price masters indexed by name
        $priceMasters = PriceMaster::all()->keyBy('name');

        $this->seedSoloClasses($soloBranch, $priceMasters);
        if ($semarangBranch) {
            $this->seedSemarangClasses($semarangBranch, $priceMasters);
        }
    }

    private function seedSoloClasses(Branch $soloBranch, $priceMasters): void
    {
        $possiblePaths = [
            base_path('docs/initiate data/solo/kelas .csv'),
            base_path('docs/initiate data/solo/kelas.csv'),
            base_path('docs/initiate data/kelas .csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            $this->command->warn('File CSV kelas Solo tidak ditemukan di folder docs/initiate data/solo/');
            return;
        }

        $this->command->info("Membaca data kelas Solo dari: {$filePath}");

        $file = fopen($filePath, 'r');
        $importedCount = 0;
        $seenClasses = [];

        while (($row = fgetcsv($file)) !== false) {
            $rawName = isset($row[0]) ? trim($row[0]) : '';
            
            // Clean invisible BOM and multi-spaces
            $rawName = preg_replace('/[\x{FEFF}\x{200B}]/u', '', $rawName);
            $rawName = preg_replace('/\s+/', ' ', $rawName);

            if (empty($rawName) || in_array(strtolower($rawName), ['', 'nama grup', 'buku', 'schedule', 'day i', 'day ii'])) {
                continue;
            }

            if (isset($seenClasses[$rawName])) {
                continue;
            }
            $seenClasses[$rawName] = true;

            $day1 = isset($row[2]) ? trim($row[2]) : '';
            $day2 = isset($row[3]) ? trim($row[3]) : '';
            $scheduleDays = $this->parseScheduleDays($day1, $day2);

            $nameLower = strtolower($rawName);

            // 1. Kategori: Jika ada "& co" / "&co" -> Group, selain itu -> Private
            $category = (str_contains($nameLower, '& co') || str_contains($nameLower, '&co') || str_contains($nameLower, 'group')) 
                ? 'group' 
                : 'private';

            // 2. Type: Jika ada (Online) atau ON -> online, selain itu -> offline
            $type = ((str_contains($nameLower, 'online') || preg_match('/\b(on)\b/i', $rawName)) && !str_contains($nameLower, 'off')) ? 'online' : 'offline';

            // 3. Clean Class Name: hilangkan akhiran (Offline), (Online), (On Campus) agar nama kelas murni & tidak duplikat
            $cleanName = trim(preg_replace('/\s*\((offline|online|on campus|off line|on line)\)/i', '', $rawName));
            $cleanName = preg_replace('/\s+/', ' ', $cleanName);

            if (empty($cleanName)) {
                continue;
            }

            if (isset($seenClasses[$cleanName])) {
                continue;
            }
            $seenClasses[$cleanName] = true;

            // 4. Total Pertemuan
            $totalMeetings = 24; // default untuk kelas group 3 bulan
            if (preg_match('/(\d+)\s*(session|sesi|hours)/i', $rawName, $m)) {
                $totalMeetings = (int) $m[1];
            } elseif (preg_match('/privat\s*(\d+)/i', $rawName, $m)) {
                $totalMeetings = (int) $m[1];
            }

            // 5. Penentuan Master Harga (price_master_id)
            $priceMaster = $this->resolvePriceMaster($rawName, $category, $totalMeetings, $priceMasters);

            StudyClass::updateOrCreate(
                [
                    'name' => $cleanName,
                    'branch_id' => $soloBranch->id,
                ],
                [
                    'price_master_id' => $priceMaster?->id,
                    'category' => $category,
                    'type' => $type,
                    'status' => 'active',
                    'total_meetings' => $totalMeetings,
                    'meetings_per_week' => count($scheduleDays) ?: 2,
                    'current_session_number' => 1,
                    'schedule_days' => $scheduleDays,
                    'start_session_date' => Carbon::now()->startOfMonth(),
                    'end_session_date' => Carbon::now()->startOfMonth()->addMonths(3),
                ]
            );

            $importedCount++;
        }

        fclose($file);
        $this->command->info("Berhasil men-seed {$importedCount} kelas Solo ke database.");
    }

    private function seedSemarangClasses(Branch $semarangBranch, $priceMasters): void
    {
        $possiblePaths = [
            base_path('docs/initiate data/semarang/kelas-semarang.csv'),
            base_path('docs/initiate data/semarang/kelas.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            $this->command->warn('File CSV kelas Semarang tidak ditemukan di folder docs/initiate data/semarang/');
            return;
        }

        $this->command->info("Membaca data kelas Semarang dari: {$filePath}");

        $file = fopen($filePath, 'r');
        $importedCount = 0;
        $seenClasses = [];

        while (($row = fgetcsv($file)) !== false) {
            $rawName = isset($row[0]) ? trim($row[0]) : '';
            
            // Clean invisible BOM and multi-spaces
            $rawName = preg_replace('/[\x{FEFF}\x{200B}]/u', '', $rawName);
            $rawName = preg_replace('/\s+/', ' ', $rawName);

            if (empty($rawName) || in_array(strtolower($rawName), ['', 'nama grup', 'buku', 'schedule', 'day i', 'day ii'])) {
                continue;
            }

            $day1 = isset($row[2]) ? trim($row[2]) : '';
            $day2 = isset($row[3]) ? trim($row[3]) : '';
            $scheduleDays = $this->parseScheduleDays($day1, $day2);

            $nameLower = strtolower($rawName);

            // 1. Kategori: Jika ada "& co" / "&co" -> Group, selain itu -> Private
            $category = (str_contains($nameLower, '& co') || str_contains($nameLower, '&co') || str_contains($nameLower, 'group')) 
                ? 'group' 
                : 'private';

            // 2. Type: Jika ada (Online) atau ON -> online, selain itu -> offline
            $type = ((str_contains($nameLower, 'online') || preg_match('/\b(on)\b/i', $rawName)) && !str_contains($nameLower, 'off')) ? 'online' : 'offline';

            // 3. Clean Class Name: hilangkan akhiran (Offline), (Online), (On Campus) agar nama kelas murni & tidak duplikat
            $cleanName = trim(preg_replace('/\s*\((offline|online|on campus|off line|on line)\)/i', '', $rawName));
            $cleanName = preg_replace('/\s+/', ' ', $cleanName);

            if (empty($cleanName)) {
                continue;
            }

            if (isset($seenClasses[$cleanName])) {
                continue;
            }
            $seenClasses[$cleanName] = true;

            // 4. Total Pertemuan
            $totalMeetings = 24; // default untuk kelas group 3 bulan
            if (preg_match('/(\d+)\s*(session|sesi|hours)/i', $rawName, $m)) {
                $totalMeetings = (int) $m[1];
            } elseif (preg_match('/privat\s*(\d+)/i', $rawName, $m)) {
                $totalMeetings = (int) $m[1];
            }

            // 5. Penentuan Master Harga (price_master_id)
            $priceMaster = $this->resolvePriceMaster($rawName, $category, $totalMeetings, $priceMasters);

            StudyClass::updateOrCreate(
                [
                    'name' => $cleanName,
                    'branch_id' => $semarangBranch->id,
                ],
                [
                    'price_master_id' => $priceMaster?->id,
                    'category' => $category,
                    'type' => $type,
                    'status' => 'active',
                    'total_meetings' => $totalMeetings,
                    'meetings_per_week' => count($scheduleDays) ?: 2,
                    'current_session_number' => 1,
                    'schedule_days' => $scheduleDays,
                    'start_session_date' => Carbon::now()->startOfMonth(),
                    'end_session_date' => Carbon::now()->startOfMonth()->addMonths(3),
                ]
            );

            $importedCount++;
        }

        fclose($file);
        $this->command->info("Berhasil men-seed {$importedCount} kelas Semarang ke database.");
    }

    private function resolvePriceMaster(string $rawName, string $category, int $totalMeetings, $priceMasters)
    {
        $nameLower = strtolower($rawName);
        $priceMasterName = null;

        if ($category === 'group') {
            $priceMasterName = 'Group';
        } elseif (str_contains($nameLower, 'ielts')) {
            if ($totalMeetings >= 40) {
                $priceMasterName = 'IELTS Prep - Master / Ultimate (40 Sesi)';
            } elseif ($totalMeetings >= 20) {
                $priceMasterName = 'IELTS Prep - Intensive / Advanced (20 Sesi)';
            } elseif ($totalMeetings >= 10) {
                $priceMasterName = 'IELTS Prep - Intermediate (10 Sesi)';
            } else {
                $priceMasterName = 'IELTS Prep - Express / Starter (5 Sesi)';
            }
        } elseif (str_contains($nameLower, 'toefl')) {
            if ($totalMeetings >= 40) {
                $priceMasterName = 'TOEFL Prep - Master / Ultimate (40 Sesi iBT)';
            } elseif ($totalMeetings >= 30) {
                $priceMasterName = 'TOEFL Prep - Master (30 Sesi)';
            } elseif ($totalMeetings >= 20) {
                $priceMasterName = 'TOEFL Prep - Advanced (20 Sesi)';
            } elseif ($totalMeetings >= 10) {
                $priceMasterName = 'TOEFL Prep - Basic (10 Sesi)';
            } else {
                $priceMasterName = 'TOEFL Prep - Express / Basic (5 Sesi)';
            }
        } else {
            $priceMasterName = 'Private';
        }

        return $priceMasters->get($priceMasterName);
    }

    /**
     * Helper parser hari jadwal dari CSV
     */
    private function parseScheduleDays(?string ...$scheduleStrings): array
    {
        $dayMap = [
            'mon' => 'Monday',
            'tue' => 'Tuesday',
            'tues' => 'Tuesday',
            'wed' => 'Wednesday',
            'thu' => 'Thursday',
            'thur' => 'Thursday',
            'thurs' => 'Thursday',
            'fri' => 'Friday',
            'sat' => 'Saturday',
            'sun' => 'Sunday',
        ];

        $found = [];
        foreach ($scheduleStrings as $str) {
            if (!$str) continue;
            foreach ($dayMap as $key => $dayName) {
                if (preg_match('/\b' . $key . '\b/i', $str) || str_starts_with(strtolower(trim($str)), $key)) {
                    $found[$dayName] = true;
                    break;
                }
            }
        }

        return array_keys($found);
    }
}
