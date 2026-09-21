<?php

namespace Database\Seeders;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\CRM\Domain\Models\LeadGuardian;
use App\Domains\CRM\Domain\Models\LeadRelationship;
use App\Domains\Finance\Domain\Models\LoyaltySetting;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\LeadType;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DataSiswaSemarangSeeder extends Seeder
{
    private array $generatedLeadCounters = [];
    private array $generatedStudentCounters = [];

    public function run(): void
    {
        $semarangBranch = Branch::where('code', 'SMG')->first();
        if (!$semarangBranch) {
            $this->command->error('Branch Semarang (SMG) tidak ditemukan. Jalankan BranchSeeder terlebih dahulu.');
            return;
        }

        $branchId = $semarangBranch->id;
        $enrollmentPhase = LeadPhase::where('code', 'enrollment')->first() ?: LeadPhase::first();
        $leadPhaseId = $enrollmentPhase?->id;

        $leadType = LeadType::where('code', 'regular')->first() ?: LeadType::first();
        $leadTypeId = $leadType?->id;

        $leadSource = LeadSource::first();
        $leadSourceId = $leadSource?->id;

        $adminUser = \App\Domains\Shared\Domain\Models\User::first();
        $adminId = $adminUser?->id;

        // Load all StudyClasses for Semarang branch and index them
        $studyClasses = StudyClass::where('branch_id', $branchId)->get();
        $groupClassMap = [];
        $privateClassMapByStudent = [];

        foreach ($studyClasses as $sc) {
            if ($sc->category === 'private') {
                // Format: "[Package] - [Student Name]"
                $parts = explode(' - ', $sc->name, 2);
                if (count($parts) === 2) {
                    $stuKey = strtolower(trim(preg_replace('/\s+/', ' ', $parts[1])));
                    $privateClassMapByStudent[$stuKey] = $sc;
                }
            } else {
                $normGroup = $this->normalizeGroupName($sc->name);
                $groupClassMap[$normGroup] = $sc;
            }
        }

        // 1. Seed Active Students & Class Enrollments
        $this->seedActiveStudents($branchId, $leadPhaseId, $leadTypeId, $leadSourceId, $adminId, $groupClassMap, $privateClassMapByStudent);

        // 2. Sync Package Counts & Sibling Relationships
        $this->syncPackagesAndSiblings($branchId);

        // 3. Seed Stopped Students (if file exists)
        $this->seedStoppedStudents($branchId, $leadPhaseId, $leadTypeId, $leadSourceId, $adminId, $groupClassMap, $privateClassMapByStudent);

        // 4. Sync Package History (if file exists)
        $this->seedPackageHistory($branchId, $adminId, $groupClassMap, $privateClassMapByStudent);
    }

    private function seedActiveStudents(
        string $branchId,
        ?string $leadPhaseId,
        ?string $leadTypeId,
        ?string $leadSourceId,
        ?string $adminId,
        array $groupClassMap,
        array $privateClassMapByStudent
    ): void {
        $possiblePaths = [
            database_path('seeders/data/semarang/data siswa semarang.csv'),
            base_path('docs/initiate data/semarang/data siswa semarang.csv'),
            base_path('docs/initiate data/semarang/datasiswa semarang.csv'),
            base_path('docs/initiate data/semarang/data-siswa-semarang.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            $this->command->warn('File CSV Data Siswa Semarang tidak ditemukan.');
            return;
        }

        $this->command->info("Membaca data siswa aktif Semarang dari: {$filePath}");

        $file = fopen($filePath, 'r');
        $header = fgetcsv($file); // Read header row

        $importedCount = 0;
        $groupEnrollmentCount = 0;
        $privateEnrollmentCount = 0;
        $uniqueStudentsCreated = 0;

        while (($row = fgetcsv($file)) !== false) {
            if (empty($row) || !array_filter($row)) {
                continue;
            }

            $col0 = trim(preg_replace('/[\x{FEFF}\x{200B}]/u', '', $row[0] ?? ''));
            $studentName = trim(preg_replace('/[\x{FEFF}\x{200B}]/u', '', $row[1] ?? ''));

            // Clean multiple whitespace
            $studentName = trim(preg_replace('/\s+/', ' ', $studentName));

            // Skip empty rows or header duplicate
            if (empty($studentName) || in_array(strtolower($studentName), ['name', 'nama', 'group name', "group's name", 'student name', 'student'])) {
                continue;
            }

            $joinDateStr1 = isset($row[2]) ? trim($row[2]) : '';
            $joinDateStr2 = isset($row[3]) ? trim($row[3]) : '';
            $joinDateStr = !empty($joinDateStr2) ? $joinDateStr2 : $joinDateStr1;

            $joinDate = $this->parseDate($joinDateStr) ?: Carbon::today();
            $birthDate = isset($row[4]) ? $this->parseDate(trim($row[4])) : null;

            $nik = isset($row[5]) ? trim($row[5]) : '';
            $email1 = isset($row[6]) ? trim(str_replace(["\n", "\r"], '', $row[6])) : '';
            $email2 = isset($row[7]) ? trim(str_replace(["\n", "\r"], '', $row[7])) : '';
            $email = !empty($email1) ? $email1 : $email2;

            $address = isset($row[8]) ? trim($row[8]) : '';
            $city = isset($row[9]) ? trim($row[9]) : 'Semarang';
            if (empty($city)) {
                $city = 'Semarang';
            }

            $school = isset($row[10]) ? trim($row[10]) : '';
            $grade = isset($row[11]) ? trim($row[11]) : '';
            $studentWa = isset($row[12]) ? $this->cleanPhoneNumber(trim($row[12])) : '';

            $momName = isset($row[13]) ? trim($row[13]) : '';
            $momPhone = isset($row[14]) ? $this->cleanPhoneNumber(trim($row[14])) : '';

            $dadName = isset($row[15]) ? trim($row[15]) : '';
            $dadPhone = isset($row[16]) ? $this->cleanPhoneNumber(trim($row[16])) : '';

            $phone = !empty($studentWa) ? $studentWa : (!empty($momPhone) ? $momPhone : $dadPhone);
            if (empty($phone)) {
                $phone = '628' . sprintf('%09d', rand(100000000, 999999999));
            }

            // Find or Create Lead
            $lead = Lead::where('branch_id', $branchId)
                ->where('name', $studentName)
                ->first();

            if (!$lead) {
                $leadNumber = $this->generateLeadNumber($joinDate);
                $lead = Lead::create([
                    'lead_number' => $leadNumber,
                    'name' => $studentName,
                    'phone' => $phone ?: null,
                    'email' => !empty($email) ? $email : null,
                    'birth_date' => $birthDate?->toDateString(),
                    'nik' => !empty($nik) && $nik !== '-' ? $nik : null,
                    'school' => !empty($school) && $school !== '-' ? $school : null,
                    'grade' => !empty($grade) && $grade !== '-' ? $grade : null,
                    'city' => $city,
                    'address' => !empty($address) && $address !== '-' ? $address : null,
                    'branch_id' => $branchId,
                    'owner_id' => $adminId,
                    'created_by' => $adminId,
                    'lead_phase_id' => $leadPhaseId,
                    'lead_type_id' => $leadTypeId,
                    'lead_source_id' => $leadSourceId,
                    'is_online' => false,
                    'enrolled_at' => $joinDate->toDateString(),
                    'self_registration_token' => (string) Str::uuid(),
                ]);
                $uniqueStudentsCreated++;
            } else {
                $leadUpdates = [
                    'phone' => $phone ?: $lead->phone,
                    'email' => !empty($email) ? $email : $lead->email,
                    'birth_date' => $birthDate?->toDateString() ?: $lead->birth_date,
                    'nik' => (!empty($nik) && $nik !== '-') ? $nik : $lead->nik,
                    'school' => (!empty($school) && $school !== '-') ? $school : $lead->school,
                    'grade' => (!empty($grade) && $grade !== '-') ? $grade : $lead->grade,
                    'city' => $city ?: $lead->city,
                    'address' => (!empty($address) && $address !== '-') ? $address : $lead->address,
                    'enrolled_at' => $lead->enrolled_at ?: $joinDate->toDateString(),
                ];
                if (empty($lead->self_registration_token)) {
                    $leadUpdates['self_registration_token'] = (string) Str::uuid();
                }
                $lead->update($leadUpdates);
            }

            // Match Target StudyClass with lead awareness
            $targetClass = $this->matchClass($col0, $studentName, $lead->id, $groupClassMap, $privateClassMapByStudent);
            $isOnline = $targetClass?->type === 'online';
            if ($isOnline && !$lead->is_online) {
                $lead->update(['is_online' => true]);
            }

            // Guardians
            if (!empty($momName) && $momName !== '-') {
                LeadGuardian::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'role' => 'mother',
                    ],
                    [
                        'name' => $momName,
                        'phone' => !empty($momPhone) ? $momPhone : ($phone ?: '-'),
                        'is_main_contact' => true,
                    ]
                );
            }

            if (!empty($dadName) && $dadName !== '-') {
                LeadGuardian::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'role' => 'father',
                    ],
                    [
                        'name' => $dadName,
                        'phone' => !empty($dadPhone) ? $dadPhone : ($phone ?: '-'),
                        'is_main_contact' => empty($momName) || $momName === '-',
                    ]
                );
            }

            // Find or Create Student Record
            $student = Student::where('lead_id', $lead->id)->first();
            if (!$student) {
                $studentNumber = $this->generateStudentNumber($joinDate);
                $student = Student::create([
                    'lead_id' => $lead->id,
                    'student_number' => $studentNumber,
                    'start_join' => $joinDate->toDateString(),
                    'status' => 'active',
                    'notes' => null,
                ]);
            } else {
                $student->update([
                    'start_join' => $student->start_join ?: $joinDate->toDateString(),
                    'status' => 'active',
                ]);
            }

            // Class Enrollment
            if ($targetClass) {
                LeadEnrollment::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'student_id' => $student->id,
                        'study_class_id' => $targetClass->id,
                    ],
                    [
                        'joined_at' => $joinDate->toDateString(),
                        'end_date' => $targetClass->end_session_date?->format('Y-m-d'),
                        'status' => 'active',
                        'cycle_number' => $targetClass->current_session_number ?? 1,
                    ]
                );

                if ($targetClass->category === 'private') {
                    $privateEnrollmentCount++;
                } else {
                    $groupEnrollmentCount++;
                }
            } else {
                $this->command->warn("Kelas tidak ditemukan untuk siswa: {$studentName} (Col0: '{$col0}')");
            }

            $importedCount++;
        }

        fclose($file);

        $this->command->info(" Berhasil mengimpor {$importedCount} baris data siswa aktif Semarang.");
        $this->command->line("   - Siswa Unik Terdaftar (Lead/Student): {$uniqueStudentsCreated} siswa");
        $this->command->line("   - Penempatan Kelas Group (Enrollment):  {$groupEnrollmentCount} siswa");
        $this->command->line("   - Penempatan Kelas Private (Enrollment):{$privateEnrollmentCount} siswa");
    }

    private function matchClass(
        string $col0,
        string $studentName,
        ?string $leadId,
        array $groupClassMap,
        array $privateClassMapByStudent
    ): ?StudyClass {
        $col0Clean = trim(preg_replace('/[\x{FEFF}\x{200B}]/u', '', $col0));
        $privateKeywords = ['private off', 'priv off', 'ielts', 'pre -ielts', 'pre-ielts', 'toefl', 'private', 'priv'];

        if (in_array(strtolower($col0Clean), $privateKeywords)) {
            return $this->findPrivateClass($studentName, $privateClassMapByStudent);
        }

        // Group lookup
        $normGroup = $this->normalizeGroupName($col0Clean);
        $candidateGroup = $groupClassMap[$normGroup] ?? null;
        if (!$candidateGroup) {
            foreach ($groupClassMap as $gKey => $sc) {
                if (stripos($gKey, $normGroup) !== false || stripos($normGroup, $gKey) !== false) {
                    $candidateGroup = $sc;
                    break;
                }
            }
        }

        // If no group class exists with this name (e.g. 'Raeesa & co'), check private classes
        if (!$candidateGroup) {
            $privCandidate = $this->findPrivateClass($studentName, $privateClassMapByStudent);
            if ($privCandidate) {
                return $privCandidate;
            }
            return null;
        }

        // If group class exists, check if student already enrolled in it
        // If already enrolled in this group class AND student has a private class (like Elnath or Louisa with Semi Private),
        // assign their private class instead of duplicating the group class
        if ($leadId) {
            $alreadyEnrolledInGroup = LeadEnrollment::where('lead_id', $leadId)
                ->where('study_class_id', $candidateGroup->id)
                ->exists();

            if ($alreadyEnrolledInGroup) {
                $privCandidate = $this->findPrivateClass($studentName, $privateClassMapByStudent);
                if ($privCandidate) {
                    return $privCandidate;
                }
            }
        }

        return $candidateGroup;
    }

    private function findPrivateClass(string $studentName, array $privateClassMapByStudent): ?StudyClass
    {
        $normStudent = strtolower(trim(preg_replace('/\s+/', ' ', $studentName)));
        $cleanStudent = trim(preg_replace('/\s*\(.*?\)/', '', $normStudent));

        if (isset($privateClassMapByStudent[$normStudent])) {
            return $privateClassMapByStudent[$normStudent];
        }
        if (isset($privateClassMapByStudent[$cleanStudent])) {
            return $privateClassMapByStudent[$cleanStudent];
        }

        foreach ($privateClassMapByStudent as $stuKey => $sc) {
            if (str_starts_with($normStudent, $stuKey) || str_starts_with($stuKey, $normStudent) ||
                str_starts_with($cleanStudent, $stuKey) || str_starts_with($stuKey, $cleanStudent)) {
                return $sc;
            }
            if (levenshtein($normStudent, $stuKey) <= 2 || levenshtein($cleanStudent, $stuKey) <= 2) {
                return $sc;
            }
        }

        return null;
    }

    private function normalizeGroupName(string $name): string
    {
        // Remove (Online)/(Offline) with optional closing paren
        $clean = preg_replace('/\s*\((?:online|offline)\)?\s*/i', '', $name);
        // Insert space around & if missing e.g. "Hikari&Co" -> "Hikari & Co"
        $clean = str_replace('&', ' & ', $clean);
        // Remove & co or &co
        $clean = preg_replace('/\s*&\s*co\b/i', '', $clean);
        // Remove non-alphanumeric and extra spaces
        $clean = preg_replace('/[^a-zA-Z0-9]/', '', $clean);
        return strtolower(trim($clean));
    }

    private function generateLeadNumber(Carbon $date): string
    {
        $ym = $date->format('ym');
        if (!isset($this->generatedLeadCounters[$ym])) {
            $lastLead = Lead::where('lead_number', 'like', "LD-{$ym}-%")
                ->orderBy('lead_number', 'desc')
                ->first();
            if ($lastLead && preg_match("/LD-{$ym}-(\d+)/", $lastLead->lead_number, $m)) {
                $this->generatedLeadCounters[$ym] = (int) $m[1];
            } else {
                $this->generatedLeadCounters[$ym] = 0;
            }
        }

        do {
            $this->generatedLeadCounters[$ym]++;
            $seq = str_pad($this->generatedLeadCounters[$ym], 4, '0', STR_PAD_LEFT);
            $leadNumber = "LD-{$ym}-{$seq}";
        } while (Lead::where('lead_number', $leadNumber)->exists());

        return $leadNumber;
    }

    private function generateStudentNumber(Carbon $date): string
    {
        $ym = $date->format('ym');
        if (!isset($this->generatedStudentCounters[$ym])) {
            $lastStudent = Student::where('student_number', 'like', "STU-{$ym}-%")
                ->orderBy('student_number', 'desc')
                ->first();
            if ($lastStudent && preg_match("/STU-{$ym}-(\d+)/", $lastStudent->student_number, $m)) {
                $this->generatedStudentCounters[$ym] = (int) $m[1];
            } else {
                $this->generatedStudentCounters[$ym] = 0;
            }
        }

        do {
            $this->generatedStudentCounters[$ym]++;
            $seq = str_pad($this->generatedStudentCounters[$ym], 4, '0', STR_PAD_LEFT);
            $studentNumber = "STU-{$ym}-{$seq}";
        } while (Student::where('student_number', $studentNumber)->exists());

        return $studentNumber;
    }

    private function cleanPhoneNumber(?string $phone): string
    {
        if (empty($phone)) {
            return '';
        }

        $phone = trim($phone);

        // Handle scientific notation from Excel (e.g. 2.85843E+11, 6.28223E+12)
        if (stripos($phone, 'E+') !== false || stripos($phone, 'E') !== false) {
            $num = str_replace(',', '.', $phone);
            if (is_numeric($num)) {
                $phone = sprintf('%.0f', (float) $num);
            }
        }

        // Keep only digits
        $digits = preg_replace('/[^\d]/', '', $phone);

        if (empty($digits) || strlen($digits) < 7) {
            return '';
        }

        // Standardize Indonesian mobile phone prefixes
        if (str_starts_with($digits, '08')) {
            $digits = '628' . substr($digits, 2);
        } elseif (str_starts_with($digits, '8')) {
            $digits = '628' . substr($digits, 1);
        } elseif (str_starts_with($digits, '28') && strlen($digits) >= 10) {
            $digits = '628' . substr($digits, 2);
        }

        return $digits;
    }

    private function parseDate(?string $dateStr): ?Carbon
    {
        if (empty($dateStr)) {
            return null;
        }

        $dateStr = trim(trim($dateStr, "`'\" \t\n\r\0\x0B"));
        if (empty($dateStr) || $dateStr === '-') {
            return null;
        }

        $monthMap = [
            'januari' => 'Jan', 'jan' => 'Jan',
            'februari' => 'Feb', 'feb' => 'Feb',
            'maret' => 'Mar', 'mar' => 'Mar',
            'april' => 'Apr', 'apr' => 'Apr',
            'mei' => 'May', 'may' => 'May',
            'juni' => 'Jun', 'jun' => 'Jun',
            'juli' => 'Jul', 'jul' => 'Jul',
            'agustus' => 'Aug', 'agust' => 'Aug', 'agt' => 'Aug', 'aug' => 'Aug',
            'september' => 'Sep', 'sep' => 'Sep',
            'oktober' => 'Oct', 'okt' => 'Oct', 'oct' => 'Oct',
            'november' => 'Nov', 'nov' => 'Nov',
            'desember' => 'Dec', 'des' => 'Dec', 'dec' => 'Dec',
        ];

        foreach ($monthMap as $id => $en) {
            $dateStr = preg_replace('/\b' . $id . '\b/i', $en, $dateStr);
        }

        $dateStr = str_replace('/', '-', $dateStr);

        $formats = [
            'd-M-y',
            'd-M-Y',
            'd-m-Y',
            'd-m-y',
            'Y-m-d',
            'd M Y',
            'd M y',
            'd F Y',
        ];

        $res = null;
        foreach ($formats as $fmt) {
            try {
                $res = Carbon::createFromFormat($fmt, $dateStr);
                break;
            } catch (\Exception $e) {
                // Continue to next format
            }
        }

        if (!$res) {
            try {
                $res = Carbon::parse($dateStr);
            } catch (\Exception $e) {
                return null;
            }
        }

        if ($res) {
            if ($res->year < 100) {
                $res = $res->copy()->addYears(2000);
            } elseif ($res->year >= 100 && $res->year < 1000) {
                $res = Carbon::today();
            }
            if ($res->year < 1950 || $res->year > 2050) {
                $res = Carbon::today();
            }
        }

        return $res;
    }

    private function seedStoppedStudents(
        string $branchId,
        ?string $leadPhaseId,
        ?string $leadTypeId,
        ?string $leadSourceId,
        ?string $adminId,
        array $groupClassMap,
        array $privateClassMapByStudent
    ): void {
        $possiblePaths = [
            database_path('seeders/data/semarang/sisw-stop-semarang.csv'),
            base_path('docs/initiate data/semarang/sisw-stop-semarang.csv'),
            base_path('docs/initiate data/semarang/siswa-stop-semarang.csv'),
            base_path('docs/initiate data/semarang/siswastop.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            return;
        }

        $this->command->info("Membaca data siswa stop Semarang dari: {$filePath}");
    }

    private function seedPackageHistory(
        string $branchId,
        ?string $adminId,
        array $groupClassMap,
        array $privateClassMapByStudent
    ): void {
        $possiblePaths = [
            database_path('seeders/data/semarang/data-prospectove-paket.csv'),
            base_path('docs/initiate data/semarang/data-prospectove-paket.csv'),
            base_path('docs/initiate data/semarang/data-prospective-paket.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            return;
        }

        $this->command->info("Membaca data paket siswa Semarang dari: {$filePath}");
    }

    /**
     * Sinkronkan jumlah paket yang diambil dan relasi sibling dari CSV Semarang
     */
    private function syncPackagesAndSiblings(string $branchId): void
    {
        $possiblePaths = [
            database_path('seeders/data/semarang/jumlah paket dan sibling.csv'),
            base_path('docs/initiate data/semarang/jumlah paket dan sibling.csv'),
            database_path('seeders/data/semarang/jumlahpaket yang diambil dan sibling.csv'),
            base_path('docs/initiate data/semarang/jumlahpaket yang diambil dan sibling.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            return;
        }

        $this->command->info("Membaca data paket dan sibling Semarang dari: {$filePath}");

        // Pre-load all leads for this branch
        $allLeads = Lead::where('branch_id', $branchId)->with('student')->get();
        $leadMap = [];
        $cleanLeadsList = [];

        foreach ($allLeads as $lead) {
            $normalizedName = $this->normalizeName($lead->name);
            $leadMap[$normalizedName] = $lead;
            $cleanLeadsList[$lead->id] = [
                'lead' => $lead,
                'name' => $lead->name,
                'norm' => $normalizedName,
                'words' => explode(' ', $normalizedName),
            ];
        }

        // Pre-load loyalty settings
        $loyaltySettings = LoyaltySetting::orderBy('min_rejoin_count', 'desc')->get();

        $file = fopen($filePath, 'r');
        fgetcsv($file); // Header: Jumlah Paket, Full Name, Sibling

        $pkgUpdatedCount = 0;
        $siblingLinksCount = 0;

        while (($row = fgetcsv($file)) !== false) {
            if (empty($row) || !array_filter($row)) {
                continue;
            }

            $rawPkg = isset($row[0]) ? trim($row[0]) : '';
            $rawStudent = isset($row[1]) ? trim($row[1]) : '';
            $rawSibling = isset($row[2]) ? trim($row[2]) : '';

            $studentName = preg_replace('/[\x{FEFF}\x{200B}]/u', '', $rawStudent);
            $studentName = trim(preg_replace('/\s+/', ' ', $studentName));

            if (empty($studentName) || in_array(strtolower($studentName), ['full name', 'name', 'nama'])) {
                continue;
            }

            // Find current student's lead
            $normStu = $this->normalizeName($studentName);
            $currentLead = $leadMap[$normStu] ?? null;

            if (!$currentLead) {
                $currentLead = $this->findBestLeadMatch($studentName, $cleanLeadsList, null);
            }

            if (!$currentLead) {
                continue;
            }

            // 1. Update Jumlah Paket
            $packageCount = 0;
            if (preg_match('/^(\d+)$/', $rawPkg, $m)) {
                $packageCount = (int) $m[1];
            }

            if ($packageCount > 0 && $currentLead->student) {
                $student = $currentLead->student;
                $matchingSetting = $loyaltySettings->first(fn($s) => $s->min_rejoin_count <= $packageCount);

                $student->update([
                    'rejoin_count' => $packageCount,
                    'loyalty_tier' => $matchingSetting?->tier_name,
                ]);

                // Update active enrollments cycle_number
                LeadEnrollment::where('lead_id', $currentLead->id)
                    ->where('status', 'active')
                    ->update([
                        'cycle_number' => max(1, $packageCount),
                    ]);

                $pkgUpdatedCount++;
            }

            // 2. Parse and link Siblings
            if (!empty($rawSibling)) {
                $rawTokens = preg_split('#[,/&]|\bdan\b|\s*-\s*#i', $rawSibling);

                foreach ($rawTokens as $tok) {
                    $tok = trim($tok);
                    if (empty($tok) || strlen($tok) < 3) {
                        continue;
                    }

                    $cleanTok = trim(preg_replace('/\s*\(.*?\)/', '', $tok));
                    if (empty($cleanTok) || strlen($cleanTok) < 3) {
                        continue;
                    }

                    if (preg_match('/(?:disc|wa fd|khusus)/i', $cleanTok)) {
                        continue;
                    }

                    $siblingLead = $this->findBestLeadMatch($cleanTok, $cleanLeadsList, $currentLead->name);

                    if ($siblingLead && $siblingLead->id !== $currentLead->id) {
                        LeadRelationship::updateOrCreate(
                            [
                                'lead_id' => $currentLead->id,
                                'related_lead_id' => $siblingLead->id,
                            ],
                            [
                                'type' => 'sibling',
                                'is_main_contact' => false,
                            ]
                        );

                        LeadRelationship::updateOrCreate(
                            [
                                'lead_id' => $siblingLead->id,
                                'related_lead_id' => $currentLead->id,
                            ],
                            [
                                'type' => 'sibling',
                                'is_main_contact' => false,
                            ]
                        );

                        $siblingLinksCount++;
                    }
                }
            }
        }

        fclose($file);

        $this->command->info(" Berhasil menyinkronkan data paket dan relasi sibling Semarang:");
        $this->command->line("   - Siswa diperbarui Jumlah Paket / Loyalty: {$pkgUpdatedCount} siswa");
        $this->command->line("   - Relasi Sibling (Dua Arah) Terbentuk:     {$siblingLinksCount} relasi");
    }

    private function findBestLeadMatch(string $queryName, array $cleanLeadsList, ?string $referenceStudentName): ?Lead
    {
        $normQuery = $this->normalizeName($queryName);
        if (empty($normQuery)) {
            return null;
        }

        // 1. Exact normalized match
        foreach ($cleanLeadsList as $item) {
            if ($item['norm'] === $normQuery) {
                return $item['lead'];
            }
        }

        $queryWords = explode(' ', $normQuery);
        $firstQueryWord = $queryWords[0];

        $refLastName = '';
        if ($referenceStudentName) {
            $refWords = explode(' ', $this->normalizeName($referenceStudentName));
            $refLastName = end($refWords);
        }

        // 2. Prefix match
        $prefixMatches = [];
        foreach ($cleanLeadsList as $item) {
            if (str_starts_with($item['norm'], $normQuery . ' ') || $item['norm'] === $normQuery) {
                $prefixMatches[] = $item['lead'];
            }
        }

        if (count($prefixMatches) === 1) {
            return $prefixMatches[0];
        } elseif (count($prefixMatches) > 1) {
            if (!empty($refLastName)) {
                foreach ($prefixMatches as $lead) {
                    if (str_contains(strtolower($lead->name), $refLastName)) {
                        return $lead;
                    }
                }
            }
            return $prefixMatches[0];
        }

        // 3. Word-level match if query has >= 4 characters
        if (strlen($firstQueryWord) >= 4) {
            $wordMatches = [];
            foreach ($cleanLeadsList as $item) {
                if (in_array($firstQueryWord, $item['words'])) {
                    $wordMatches[] = $item['lead'];
                }
            }

            if (count($wordMatches) === 1) {
                return $wordMatches[0];
            } elseif (count($wordMatches) > 1) {
                if (!empty($refLastName)) {
                    foreach ($wordMatches as $lead) {
                        if (str_contains(strtolower($lead->name), $refLastName)) {
                            return $lead;
                        }
                    }
                }
                return $wordMatches[0];
            }
        }

        // 4. Typo-tolerant similarity
        $bestScore = 0;
        $bestLead = null;

        foreach ($cleanLeadsList as $item) {
            similar_text($normQuery, $item['norm'], $percent);
            $lev = levenshtein($normQuery, $item['norm']);

            if (($percent >= 80 && strlen($normQuery) >= 6) || ($lev <= 2 && strlen($normQuery) >= 8)) {
                if ($percent > $bestScore) {
                    $bestScore = $percent;
                    $bestLead = $item['lead'];
                }
            }
        }

        return $bestLead;
    }

    private function normalizeName(string $name): string
    {
        $clean = preg_replace('/[^a-zA-Z0-9\s]/', '', $name);
        $clean = preg_replace('/\s+/', ' ', $clean);
        return strtolower(trim($clean));
    }
}
