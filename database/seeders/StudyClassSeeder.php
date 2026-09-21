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
        $soloBranch = Branch::where('code', 'SOLO')->first() 
            ?: Branch::where('name', 'like', '%Solo%')->first() 
            ?: Branch::first();

        if (!$soloBranch) {
            $this->command->warn('Cabang Solo tidak ditemukan. Harap jalankan BranchSeeder terlebih dahulu.');
            return;
        }

        // Ambil semua PriceMaster
        $priceMasters = PriceMaster::all()->keyBy('name');
        $groupPriceMaster = $priceMasters->get('Group')
            ?: PriceMaster::where('name', 'like', 'Group%')->first();

        // 1. Seed Kelas Group Solo
        $this->seedSoloGroupClasses($soloBranch, $groupPriceMaster);

        // 2. Seed Kelas Private Solo
        $this->seedSoloPrivateClasses($soloBranch, $priceMasters);
    }

    /**
     * Seed kelas-kelas Group cabang Solo dari CSV
     */
    private function seedSoloGroupClasses(Branch $soloBranch, ?PriceMaster $groupPriceMaster): void
    {
        $possiblePaths = [
            database_path('seeders/data/solo/Daftar kelas Solo (group).csv'),
            base_path('docs/initiate data/solo/Daftar kelas Solo (group).csv'),
            base_path('docs/initiate data/solo/kelas .csv'),
            base_path('docs/initiate data/solo/kelas.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            $this->command->warn('File CSV kelas Group Solo tidak ditemukan di folder docs/initiate data/solo/');
            return;
        }

        $this->command->info("Membaca data kelas Group Solo dari: {$filePath}");

        $file = fopen($filePath, 'r');
        $lines = [];
        while (($row = fgetcsv($file)) !== false) {
            $lines[] = $row;
        }
        fclose($file);

        $importedCount = 0;
        $stats = [
            'online' => 0,
            'offline' => 0,
            'kids' => 0,
            'teens' => 0,
            'adult' => 0,
        ];

        for ($i = 0; $i < count($lines); $i++) {
            $row = $lines[$i];
            $col1 = isset($row[1]) ? trim($row[1]) : '';

            // Clean invisible BOM and double spaces
            $col1 = preg_replace('/[\x{FEFF}\x{200B}]/u', '', $col1);
            $col1 = preg_replace('/\s+/', ' ', $col1);

            // Deteksi baris definisi kelas Group (ada & Co atau Group, dan bukan header 'Nama Grup')
            if ($col1 === '' || stripos($col1, 'Nama Grup') !== false || (!str_contains(strtolower($col1), '& co') && !str_contains(strtolower($col1), '&co') && !str_contains(strtolower($col1), 'group'))) {
                continue;
            }

            $rawName = $col1;
            $book = isset($row[2]) ? trim($row[2]) : '';
            $day1 = isset($row[3]) ? trim($row[3]) : '';
            $day2 = isset($row[4]) ? trim($row[4]) : '';

            // 1. Tipe delivery: online vs offline (dibuat sesuai yang ada di CSV, tidak menduplikasi)
            $type = (stripos($rawName, 'online') !== false) ? 'online' : 'offline';

            // 2. Bersihkan nama kelas dari tag (Offline) / (Online)
            $cleanName = trim(preg_replace('/\s*\((offline|online|on campus|off line|on line)\)?/i', '', $rawName));
            $cleanName = preg_replace('/\s+/', ' ', $cleanName);

            if (empty($cleanName)) {
                continue;
            }

            // 3. Jadwal hari mingguan
            $scheduleDays = $this->parseScheduleDays($day1, $day2);

            // 4. Kategori usia dari Buku (Kids, Teens, Adult)
            $category = $this->categorizeBook($book);

            // 5. Paket (cycle_number) dan Periode Tanggal
            $paket = 1;
            $startDate = null;
            $endDate = null;

            for ($j = 1; $j <= 4; $j++) {
                if (!isset($lines[$i + $j])) break;
                $meta = trim($lines[$i + $j][2] ?? '');

                // Cek nomor paket
                if (preg_match('/(?:paket|pkt)\s*(\d+)/i', $meta, $pm)) {
                    $paket = (int) $pm[1];
                }

                // Cek periode tanggal
                if (preg_match('/[0-9]+\s*[a-zA-Z]+/', $meta)) {
                    [$parsedStart, $parsedEnd] = $this->parsePeriodDateRange($meta);
                    if ($parsedStart) $startDate = $parsedStart;
                    if ($parsedEnd) $endDate = $parsedEnd;
                }
            }

            // Default fallback tanggal jika tidak tertera
            if (!$startDate) {
                $startDate = Carbon::create(2026, 7, 1);
            }
            if (!$endDate) {
                $endDate = (clone $startDate)->addWeeks(12);
            }

            StudyClass::updateOrCreate(
                [
                    'name' => $cleanName,
                    'branch_id' => $soloBranch->id,
                ],
                [
                    'price_master_id' => $groupPriceMaster?->id,
                    'category' => $category,
                    'type' => $type,
                    'status' => 'active',
                    'total_meetings' => 24,
                    'meetings_per_week' => count($scheduleDays) ?: 2,
                    'current_session_number' => $paket,
                    'schedule_days' => $scheduleDays,
                    'start_session_date' => $startDate,
                    'end_session_date' => $endDate,
                ]
            );

            $importedCount++;
            $stats[$type]++;
            $stats[strtolower($category)]++;
        }

        $this->command->info(" Berhasil men-seed {$importedCount} kelas Group Solo ke database.");
        $this->command->line("   - Offline: {$stats['offline']} kelas");
        $this->command->line("   - Online:  {$stats['online']} kelas");
        $this->command->line("   - Kids:    {$stats['kids']} kelas");
        $this->command->line("   - Teens:   {$stats['teens']} kelas");
        $this->command->line("   - Adult:   {$stats['adult']} kelas");
    }

    /**
     * Seed kelas-kelas Private cabang Solo dari CSV
     */
    private function seedSoloPrivateClasses(Branch $soloBranch, $priceMasters): void
    {
        $possiblePaths = [
            database_path('seeders/data/solo/Daftar kelas Solo (private).csv'),
            base_path('docs/initiate data/solo/Daftar kelas Solo (private).csv'),
            base_path('docs/initiate data/solo/kelas-private.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            $this->command->warn('File CSV kelas Private Solo tidak ditemukan di folder docs/initiate data/solo/');
            return;
        }

        $this->command->info("Membaca data kelas Private Solo dari: {$filePath}");

        // Baca peta delivery mode (online vs offline) dari file update
        $deliveryMap = $this->loadPrivateDeliveryMap();

        $file = fopen($filePath, 'r');
        $lines = [];
        while (($row = fgetcsv($file)) !== false) {
            $lines[] = $row;
        }
        fclose($file);

        $importedCount = 0;
        $stats = [
            'ielts' => 0,
            'toefl' => 0,
            'private' => 0,
            'online' => 0,
            'offline' => 0,
        ];

        $today = Carbon::today();
        $defaultEndDate = (clone $today)->addMonths(3);

        for ($i = 0; $i < count($lines); $i++) {
            $row = $lines[$i];
            $rawPkg = isset($row[0]) ? trim($row[0]) : '';
            $student = isset($row[5]) ? trim($row[5]) : '';

            // Bersihkan invisible BOM dan multi-space
            $rawPkg = preg_replace('/[\x{FEFF}\x{200B}]/u', '', $rawPkg);
            $rawPkg = preg_replace('/\s+/', ' ', $rawPkg);
            $student = preg_replace('/[\x{FEFF}\x{200B}]/u', '', $student);
            $student = preg_replace('/\s+/', ' ', $student);

            if ($student === '') {
                continue;
            }

            [$cleanPkg, $totalMeetings, $typeGroup] = $this->resolvePrivatePackageDetails($rawPkg);

            // Nama kelas gabungan nama paket dan nama siswa
            $className = "{$cleanPkg} - {$student}";

            // Tentukan status delivery (online vs offline) berdasarkan pencocokan nama siswa
            $studentKey = strtolower(preg_replace('/\s+/', ' ', $student));
            $type = $deliveryMap[$studentKey] ?? 'offline';

            // Tentukan PriceMaster yang sesuai
            $priceMaster = $this->resolvePrivatePriceMaster($typeGroup, $totalMeetings, $priceMasters);

            StudyClass::updateOrCreate(
                [
                    'name' => $className,
                    'branch_id' => $soloBranch->id,
                ],
                [
                    'price_master_id' => $priceMaster?->id,
                    'category' => 'private',
                    'type' => $type,
                    'status' => 'active',
                    'total_meetings' => $totalMeetings,
                    'meetings_per_week' => 2,
                    'current_session_number' => 1,
                    'schedule_days' => null,
                    'start_session_date' => $today,
                    'end_session_date' => $defaultEndDate,
                ]
            );

            $importedCount++;
            $stats[$typeGroup]++;
            $stats[$type]++;
        }

        $this->command->info(" Berhasil men-seed {$importedCount} kelas Private Solo ke database.");
        $this->command->line("   - Offline: {$stats['offline']} kelas");
        $this->command->line("   - Online:  {$stats['online']} kelas");
        $this->command->line("   - IELTS:   {$stats['ielts']} kelas");
        $this->command->line("   - TOEFL:   {$stats['toefl']} kelas");
        $this->command->line("   - Privat:  {$stats['private']} kelas");
    }

    /**
     * Memuat peta delivery mode (online/offline) untuk kelas private dari file update
     */
    private function loadPrivateDeliveryMap(): array
    {
        $map = [];
        $csvPath = file_exists(database_path('seeders/data/solo/update priv online atau offline.csv'))
            ? database_path('seeders/data/solo/update priv online atau offline.csv')
            : base_path('docs/initiate data/solo/update priv online atau offline.csv');
        $xlsxPath = file_exists(database_path('seeders/data/solo/update priv online atau offline.xlsx'))
            ? database_path('seeders/data/solo/update priv online atau offline.xlsx')
            : base_path('docs/initiate data/solo/update priv online atau offline.xlsx');

        if (file_exists($csvPath)) {
            $handle = fopen($csvPath, 'r');
            if ($handle) {
                // Header: Mode Raw, Student Name, Delivery
                fgetcsv($handle);
                while (($row = fgetcsv($handle)) !== false) {
                    $student = isset($row[1]) ? trim($row[1]) : '';
                    $delivery = isset($row[2]) ? trim($row[2]) : '';
                    if ($student !== '') {
                        $key = strtolower(preg_replace('/\s+/', ' ', $student));
                        $map[$key] = ($delivery === 'online' || stripos($delivery, 'on') !== false) ? 'online' : 'offline';
                    }
                }
                fclose($handle);
            }
        } elseif (file_exists($xlsxPath) && class_exists('\ZipArchive')) {
            $zip = new \ZipArchive();
            if ($zip->open($xlsxPath) === true) {
                $sharedStrings = [];
                if (($xmlContent = $zip->getFromName('xl/sharedStrings.xml')) !== false) {
                    $xml = simplexml_load_string($xmlContent);
                    if ($xml && isset($xml->si)) {
                        foreach ($xml->si as $si) {
                            $textParts = [];
                            foreach ($si->xpath('.//main:t | .//t') as $t) {
                                $textParts[] = (string) $t;
                            }
                            $sharedStrings[] = implode('', $textParts);
                        }
                    }
                }
                if (($sheetContent = $zip->getFromName('xl/worksheets/sheet1.xml')) !== false) {
                    $sheet = simplexml_load_string($sheetContent);
                    if ($sheet && isset($sheet->sheetData->row)) {
                        foreach ($sheet->sheetData->row as $row) {
                            $mode = '';
                            $student = '';
                            foreach ($row->c as $c) {
                                $cellRef = (string) $c['r'];
                                $col = preg_replace('/[^A-Z]/', '', $cellRef);
                                $val = (string) $c->v;
                                if ((string) $c['t'] === 's' && isset($sharedStrings[(int) $val])) {
                                    $val = $sharedStrings[(int) $val];
                                }
                                if ($col === 'B') $mode = trim($val);
                                if ($col === 'C') $student = trim(str_replace("\n", ' ', $val));
                            }
                            if ($student !== '') {
                                $isOnline = stripos($mode, ' ON') !== false || str_ends_with(strtoupper($mode), 'ON');
                                $key = strtolower(preg_replace('/\s+/', ' ', $student));
                                $map[$key] = $isOnline ? 'online' : 'offline';
                            }
                        }
                    }
                }
                $zip->close();
            }
        }

        return $map;
    }

    /**
     * Resolusi nama paket bersih, jumlah pertemuan, dan kelompok program private
     */
    private function resolvePrivatePackageDetails(string $rawPkg): array
    {
        $pkg = trim($rawPkg);

        if (empty($pkg)) {
            return ['Privat', 10, 'private'];
        }

        if (preg_match('/ielts\s*(\d+)/i', $pkg, $m)) {
            $totalMeetings = (int) $m[1];
            return ["IELTS {$totalMeetings} Sesi", $totalMeetings, 'ielts'];
        }

        if (preg_match('/toefl\s*(\d+)/i', $pkg, $m)) {
            $totalMeetings = (int) $m[1];
            return ["TOEFL {$totalMeetings} Sesi", $totalMeetings, 'toefl'];
        }

        if (preg_match('/(?:PR|privat)\s*(\d+)/i', $pkg, $m)) {
            $totalMeetings = (int) $m[1];
            $suffix = (stripos($pkg, 'berdua') !== false) ? ' Berdua' : '';
            return ["Privat {$totalMeetings}{$suffix}", $totalMeetings, 'private'];
        }

        return [$pkg, 10, 'private'];
    }

    /**
     * Resolusi PriceMaster untuk kelas private
     */
    private function resolvePrivatePriceMaster(string $typeGroup, int $totalMeetings, $priceMasters): ?PriceMaster
    {
        $priceMasterName = null;

        if ($typeGroup === 'ielts') {
            $priceMasterName = "IELTS ({$totalMeetings} Sessions)";
        } elseif ($typeGroup === 'toefl') {
            $priceMasterName = "TOEFL ({$totalMeetings} Sessions)";
        } else {
            $priceMasterName = "Private ({$totalMeetings} Sessions)";
        }

        return $priceMasters->get($priceMasterName)
            ?: ($typeGroup === 'ielts' ? $priceMasters->get('IELTS (20 Sessions)') : null)
            ?: ($typeGroup === 'toefl' ? $priceMasters->get('TOEFL (20 Sessions)') : null)
            ?: $priceMasters->get('Private');
    }

    /**
     * Kategorisasi buku ke Kids, Teens, atau Adult
     */
    private function categorizeBook(string $book): string
    {
        $b = strtoupper(trim($book));

        // Kids
        if (
            str_starts_with($b, 'FF') || 
            str_starts_with($b, 'KB') || 
            str_starts_with($b, 'ODI') || 
            str_starts_with($b, 'CK') || 
            str_starts_with($b, 'SC')
        ) {
            return 'Kids';
        }

        // Teens
        if (
            str_starts_with($b, 'NF') || 
            str_starts_with($b, 'NEW FRONTIER') || 
            str_starts_with($b, 'CT') || 
            str_starts_with($b, 'CU') || 
            str_starts_with($b, 'CLOSE UP') || 
            str_starts_with($b, 'GT')
        ) {
            return 'Teens';
        }

        // Adult
        if (
            str_starts_with($b, 'IC') || 
            str_starts_with($b, 'ENGLISH FILE') || 
            str_starts_with($b, 'EF')
        ) {
            return 'Adult';
        }

        return 'Kids';
    }

    /**
     * Parser rentang tanggal periode (contoh: '13 Juli-1 Okt', '(7 Sep - 25 Nov)')
     */
    private function parsePeriodDateRange(string $str, int $defaultYear = 2026): array
    {
        $cleaned = trim($str, " \t\n\r\0\x0B()");
        $months = [
            'januari' => 'Jan', 'jan' => 'Jan',
            'februari' => 'Feb', 'feb' => 'Feb',
            'maret' => 'Mar', 'mar' => 'Mar',
            'april' => 'Apr', 'apr' => 'Apr',
            'mei' => 'May', 'may' => 'May',
            'juni' => 'Jun', 'jun' => 'Jun',
            'juli' => 'Jul', 'july' => 'Jul', 'jul' => 'Jul',
            'agustus' => 'Aug', 'agust' => 'Aug', 'agus' => 'Aug', 'agu' => 'Aug', 'aug' => 'Aug',
            'september' => 'Sep', 'sept' => 'Sep', 'sep' => 'Sep',
            'oktober' => 'Oct', 'okt' => 'Oct', 'oct' => 'Oct',
            'november' => 'Nov', 'nov' => 'Nov',
            'desember' => 'Dec', 'des' => 'Dec', 'dec' => 'Dec',
        ];

        $parts = preg_split('/[-–—]|(\bto\b)/i', $cleaned);
        if (count($parts) !== 2) {
            return [null, null];
        }

        $parsePart = function($part) use ($months, $defaultYear) {
            $part = trim($part);
            if (empty($part)) return null;

            if (preg_match('/^(\d{1,2})\s*([a-zA-Z]+)$/', $part, $m)) {
                $day = (int) $m[1];
                $mStr = strtolower($m[2]);
                $month = $months[$mStr] ?? null;
                if ($month) {
                    try {
                        return Carbon::parse("{$day} {$month} {$defaultYear}");
                    } catch (\Exception $e) {
                        return null;
                    }
                }
            }
            return null;
        };

        $startDate = $parsePart(trim($parts[0]));
        $endDate = $parsePart(trim($parts[1]));

        return [$startDate, $endDate];
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
