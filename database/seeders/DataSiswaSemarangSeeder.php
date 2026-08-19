<?php

namespace Database\Seeders;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\CRM\Domain\Models\LeadGuardian;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\Master\Domain\Models\LeadSource;
use App\Domains\Master\Domain\Models\LeadType;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

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

        // Load all StudyClasses for Semarang branch
        $studyClasses = StudyClass::where('branch_id', $branchId)->get();
        $studyClassMap = [];
        foreach ($studyClasses as $sc) {
            $normalized = $this->normalizeClassName($sc->name);
            $studyClassMap[$normalized] = $sc;
        }

        // 1. Seed Active Students
        $this->seedActiveStudents($branchId, $leadPhaseId, $leadTypeId, $leadSourceId, $adminId, $studyClassMap);

        // 2. Seed Stopped Students
        $this->seedStoppedStudents($branchId, $leadPhaseId, $leadTypeId, $leadSourceId, $adminId, $studyClassMap);

        // 3. Sync Package Count & Historical Cycles (Data Prospective Paket Semarang)
        $this->seedPackageHistory($branchId, $adminId, $studyClassMap);
    }

    private function seedActiveStudents($branchId, $leadPhaseId, $leadTypeId, $leadSourceId, $adminId, array &$studyClassMap): void
    {
        $possiblePaths = [
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
        $importedCount = 0;

        while (($row = fgetcsv($file)) !== false) {
            $groupTypeRaw = isset($row[2]) ? trim($row[2]) : '';
            $className = isset($row[3]) ? trim($row[3]) : '';
            $studentName = isset($row[4]) ? trim($row[4]) : '';
            $joinDateStr1 = isset($row[5]) ? trim($row[5]) : '';
            $joinDateStr2 = isset($row[6]) ? trim($row[6]) : '';

            // Skip empty rows or header row
            if (empty($studentName) || in_array(strtolower($studentName), ['name', 'nama', 'group name', "group's name"])) {
                continue;
            }

            $groupTypeLower = strtolower($groupTypeRaw);
            $classNameLower = strtolower($className);

            $isOnline = false;
            if (str_contains($groupTypeLower, 'on') && !str_contains($groupTypeLower, 'off')) {
                $isOnline = true;
            } elseif (str_contains($classNameLower, 'online')) {
                $isOnline = true;
            }

            $joinDateStr = !empty($joinDateStr2) ? $joinDateStr2 : $joinDateStr1;
            $joinDate = $this->parseDate($joinDateStr) ?: Carbon::now();
            $birthDate = isset($row[7]) ? $this->parseDate(trim($row[7])) : null;

            $nik = isset($row[8]) ? trim($row[8]) : '';
            $email1 = isset($row[9]) ? trim($row[9]) : '';
            $email2 = isset($row[10]) ? trim($row[10]) : '';
            $email = !empty($email1) ? $email1 : $email2;

            $address = isset($row[11]) ? trim($row[11]) : '';
            $city = isset($row[12]) ? trim($row[12]) : 'Semarang';
            $school = isset($row[13]) ? trim($row[13]) : '';
            $grade = isset($row[14]) ? trim($row[14]) : '';
            $studentWa = isset($row[15]) ? $this->cleanPhoneNumber(trim($row[15])) : '';

            $momName = isset($row[16]) ? trim($row[16]) : '';
            $momPhone = isset($row[17]) ? $this->cleanPhoneNumber(trim($row[17])) : '';

            $dadName = isset($row[18]) ? trim($row[18]) : '';
            $dadPhone = isset($row[19]) ? $this->cleanPhoneNumber(trim($row[19])) : '';

            $phone = !empty($studentWa) ? $studentWa : (!empty($momPhone) ? $momPhone : $dadPhone);
            if (empty($phone)) {
                $phone = '628' . sprintf('%09d', rand(100000000, 999999999));
            }

            // Create or Update Lead
            $lead = Lead::where('name', $studentName)
                ->where(function ($q) use ($email, $phone) {
                    if (!empty($email)) {
                        $q->where('email', $email);
                    }
                    if (!empty($phone)) {
                        $q->orWhere('phone', $phone);
                    }
                })->first();

            $leadNumber = $this->generateLeadNumber($joinDate);

            if (!$lead) {
                $lead = Lead::create([
                    'lead_number' => $leadNumber,
                    'name' => $studentName,
                    'phone' => $phone ?: null,
                    'email' => $email ?: null,
                    'birth_date' => $birthDate?->toDateString(),
                    'nik' => $nik ?: null,
                    'school' => $school ?: null,
                    'grade' => $grade ?: null,
                    'city' => $city ?: null,
                    'address' => $address ?: null,
                    'branch_id' => $branchId, 
                    'owner_id' => $adminId,
                    'created_by' => $adminId,
                    'lead_phase_id' => $leadPhaseId,
                    'lead_type_id' => $leadTypeId,
                    'lead_source_id' => $leadSourceId,
                    'is_online' => $isOnline,
                    'enrolled_at' => $joinDate->toDateString(),
                ]);
            } else {
                $lead->update([
                    'phone' => $phone ?: $lead->phone,
                    'email' => $email ?: $lead->email,
                    'birth_date' => $birthDate?->toDateString() ?: $lead->birth_date,
                    'nik' => $nik ?: $lead->nik,
                    'school' => $school ?: $lead->school,
                    'grade' => $grade ?: $lead->grade,
                    'city' => $city ?: $lead->city,
                    'address' => $address ?: $lead->address,
                    'branch_id' => $branchId,
                    'is_online' => $isOnline,
                    'enrolled_at' => $joinDate->toDateString(),
                ]);
            }

            // Guardians
            if (!empty($momName)) {
                LeadGuardian::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'role' => 'mother',
                    ],
                    [
                        'name' => $momName,
                        'phone' => $momPhone,
                        'is_main_contact' => true,
                    ]
                );
            }
            if (!empty($dadName)) {
                LeadGuardian::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'role' => 'father',
                    ],
                    [
                        'name' => $dadName,
                        'phone' => $dadPhone,
                        'is_main_contact' => empty($momName),
                    ]
                );
            }

            // Student
            $studentNumber = $this->generateStudentNumber($joinDate);
            $student = Student::where('lead_id', $lead->id)->first();

            if (!$student) {
                $student = Student::create([
                    'lead_id' => $lead->id,
                    'student_number' => $studentNumber,
                    'start_join' => $joinDate->toDateString(),
                    'status' => 'active',
                    'notes' => null,
                ]);
            } else {
                $student->update([
                    'start_join' => $joinDate->toDateString(),
                    'status' => 'active',
                ]);
            }

            // Class matching & Enrollment
            $matchedClass = $this->matchOrCreateClass($className, $isOnline, $branchId, $studyClassMap);
            $targetClass = $matchedClass ?: StudyClass::where('branch_id', $branchId)->first();

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
            }

            $importedCount++;
        }

        fclose($file);
        $this->command->info("Berhasil mengimpor {$importedCount} data siswa aktif Semarang.");
    }

    private function seedStoppedStudents($branchId, $leadPhaseId, $leadTypeId, $leadSourceId, $adminId, array &$studyClassMap): void
    {
        $possiblePaths = [
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
            $this->command->warn('File CSV Siswa Stop Semarang tidak ditemukan.');
            return;
        }

        $this->command->info("Membaca data siswa stop Semarang dari: {$filePath}");

        $file = fopen($filePath, 'r');
        $stopCount = 0;

        while (($row = fgetcsv($file)) !== false) {
            $stopDateStr = isset($row[1]) ? trim($row[1]) : '';
            $groupTypeRaw = isset($row[2]) ? trim($row[2]) : '';
            $className = isset($row[3]) ? trim($row[3]) : '';
            $studentName = isset($row[4]) ? trim($row[4]) : '';
            $joinDateStr1 = isset($row[5]) ? trim($row[5]) : '';
            $joinDateStr2 = isset($row[6]) ? trim($row[6]) : '';

            // Skip empty rows or header row
            if (empty($studentName) || in_array(strtolower($studentName), ['name', 'nama', 'group name', "group's name"])) {
                continue;
            }

            $groupTypeLower = strtolower($groupTypeRaw);
            $classNameLower = strtolower($className);

            $isOnline = (str_contains($groupTypeLower, 'on') && !str_contains($groupTypeLower, 'off')) || str_contains($classNameLower, 'online');

            $joinDateStr = !empty($joinDateStr2) ? $joinDateStr2 : $joinDateStr1;
            $joinDate = $this->parseDate($joinDateStr) ?: Carbon::now()->subMonths(3);
            $stopDate = $this->parseDate($stopDateStr) ?: Carbon::now();
            $birthDate = isset($row[7]) ? $this->parseDate(trim($row[7])) : null;

            $nik = isset($row[8]) ? trim($row[8]) : '';
            $email1 = isset($row[9]) ? trim($row[9]) : '';
            $email2 = isset($row[10]) ? trim($row[10]) : '';
            $email = !empty($email1) ? $email1 : $email2;

            $address = isset($row[11]) ? trim($row[11]) : '';
            $city = isset($row[12]) ? trim($row[12]) : 'Semarang';
            $school = isset($row[13]) ? trim($row[13]) : '';
            $grade = isset($row[14]) ? trim($row[14]) : '';
            $studentWa = isset($row[15]) ? $this->cleanPhoneNumber(trim($row[15])) : '';

            $momName = isset($row[16]) ? trim($row[16]) : '';
            $momPhone = isset($row[17]) ? $this->cleanPhoneNumber(trim($row[17])) : '';

            $dadName = isset($row[18]) ? trim($row[18]) : '';
            $dadPhone = isset($row[19]) ? $this->cleanPhoneNumber(trim($row[19])) : '';

            $phone = !empty($studentWa) ? $studentWa : (!empty($momPhone) ? $momPhone : $dadPhone);
            if (empty($phone)) {
                $phone = '628' . sprintf('%09d', rand(100000000, 999999999));
            }

            // Create or Find Lead
            $lead = Lead::where('name', $studentName)
                ->where(function ($q) use ($email, $phone) {
                    if (!empty($email)) {
                        $q->where('email', $email);
                    }
                    if (!empty($phone)) {
                        $q->orWhere('phone', $phone);
                    }
                })->first();

            $leadNumber = $this->generateLeadNumber($joinDate);

            if (!$lead) {
                $lead = Lead::create([
                    'lead_number' => $leadNumber,
                    'name' => $studentName,
                    'phone' => $phone ?: null,
                    'email' => $email ?: null,
                    'birth_date' => $birthDate?->toDateString(),
                    'nik' => $nik ?: null,
                    'school' => $school ?: null,
                    'grade' => $grade ?: null,
                    'city' => $city ?: null,
                    'address' => $address ?: null,
                    'branch_id' => $branchId,
                    'owner_id' => $adminId,
                    'created_by' => $adminId,
                    'lead_phase_id' => $leadPhaseId,
                    'lead_type_id' => $leadTypeId,
                    'lead_source_id' => $leadSourceId,
                    'is_online' => $isOnline,
                    'enrolled_at' => $joinDate->toDateString(),
                ]);
            }

            // Guardians
            if (!empty($momName)) {
                LeadGuardian::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'role' => 'mother',
                    ],
                    [
                        'name' => $momName,
                        'phone' => $momPhone,
                        'is_main_contact' => true,
                    ]
                );
            }
            if (!empty($dadName)) {
                LeadGuardian::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'role' => 'father',
                    ],
                    [
                        'name' => $dadName,
                        'phone' => $dadPhone,
                        'is_main_contact' => empty($momName),
                    ]
                );
            }

            // Student marked as STOP
            $studentNumber = $this->generateStudentNumber($joinDate);
            $student = Student::where('lead_id', $lead->id)->first();

            if (!$student) {
                $student = Student::create([
                    'lead_id' => $lead->id,
                    'student_number' => $studentNumber,
                    'start_join' => $joinDate->toDateString(),
                    'status' => 'stop',
                    'stopped_at' => $stopDate->toDateString(),
                    'notes' => null,
                ]);
            } else {
                $student->update([
                    'status' => 'stop',
                    'stopped_at' => $stopDate->toDateString(),
                ]);
            }

            // Enrollment marked as stopped
            $matchedClass = $this->matchOrCreateClass($className, $isOnline, $branchId, $studyClassMap);
            $targetClass = $matchedClass ?: StudyClass::where('branch_id', $branchId)->first();

            if ($targetClass) {
                LeadEnrollment::updateOrCreate(
                    [
                        'lead_id' => $lead->id,
                        'student_id' => $student->id,
                        'study_class_id' => $targetClass->id,
                    ],
                    [
                        'joined_at' => $joinDate->toDateString(),
                        'end_date' => $stopDate->toDateString(),
                        'stopped_at' => $stopDate->toDateString(),
                        'status' => 'stopped',
                        'cycle_number' => $targetClass->current_session_number ?? 1,
                    ]
                );
            }

            $stopCount++;
        }

        fclose($file);
        $this->command->info("Berhasil mengimpor/memperbarui {$stopCount} data siswa stop Semarang.");
    }

    private function matchOrCreateClass(?string $className, bool $isOnline, string $branchId, array &$studyClassMap): ?StudyClass
    {
        if (empty($className)) {
            return null;
        }

        $cleanName = $this->cleanClassName($className);
        $normalized = $this->normalizeClassName($cleanName);
        $matchedClass = $studyClassMap[$normalized] ?? null;

        if (!$matchedClass) {
            foreach ($studyClassMap as $key => $sc) {
                if ($key === $normalized || str_contains($key, $normalized) || str_contains($normalized, $key)) {
                    $matchedClass = $sc;
                    break;
                }
            }
        }

        if (!$matchedClass) {
            $matchedClass = StudyClass::firstOrCreate(
                ['name' => $cleanName, 'branch_id' => $branchId],
                [
                    'type' => $isOnline ? 'online' : 'offline',
                    'status' => 'active',
                ]
            );
            $studyClassMap[$normalized] = $matchedClass;
        }

        return $matchedClass;
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

    private function parseDate(?string $dateStr): ?Carbon
    {
        if (empty($dateStr)) {
            return null;
        }

        $dateStr = trim(rtrim(trim($dateStr), '.'));
        $replacements = [
            'mei' => 'May',
            'juni' => 'June',
            'juli' => 'July',
            'agu' => 'August',
            'agus' => 'August',
            'agust' => 'August',
            'okt' => 'October',
            'des' => 'December',
            'tgs' => 'August',
        ];

        $lower = strtolower($dateStr);
        foreach ($replacements as $ind => $eng) {
            $lower = str_replace($ind, $eng, $lower);
        }

        try {
            $date = null;
            // Strip any trailing dots/spaces in individual parts e.g. "10/07/2026. "
            $cleaned = preg_replace('/[^0-9\/\-\.]/', '', $lower);
            if (preg_match('/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/', $cleaned, $m)) {
                $day = (int) $m[1];
                $month = (int) $m[2];
                $year = (int) $m[3];

                if ($year < 100) {
                    $year += 2000;
                } elseif ($year > 100 && $year < 1000) {
                    $year = 2026;
                }

                // In Indonesian school context, format is strictly day/month/year
                if ($month >= 1 && $month <= 12 && $day >= 1 && $day <= 31) {
                    $date = Carbon::createFromDate($year, $month, $day)->startOfDay();
                }
            } else {
                $date = Carbon::parse($lower);
            }

            if ($date && ($date->year < 1950 || $date->year > 2050)) {
                return Carbon::now();
            }

            return $date;
        } catch (\Exception $e) {
            return null;
        }
    }

    private function cleanPhoneNumber(string $phone): string
    {
        if (stripos($phone, 'E+') !== false) {
            $phone = sprintf('%.0f', (float) $phone);
        }

        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (empty($phone)) {
            return '';
        }

        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (str_starts_with($phone, '8')) {
            $phone = '62' . $phone;
        } elseif (str_starts_with($phone, '28')) {
            $phone = '6' . $phone;
        }

        return $phone;
    }

    private function seedPackageHistory(string $branchId, string $adminId, array &$studyClassMap): void
    {
        $possiblePaths = [
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
        $file = fopen($filePath, 'r');
        if (!$file) return;

        // Skip potential top banner headers
        $headerFound = false;
        $syncCount = 0;

        while (($row = fgetcsv($file, 4000, ',')) !== false) {
            if (empty(array_filter($row, fn($v) => trim($v) !== ''))) {
                continue;
            }

            // Check header row (contains Name and Banyak/Paket)
            $rowStr = implode(' ', $row);
            if (stripos($rowStr, 'Name') !== false && stripos($rowStr, 'Paket') !== false) {
                $headerFound = true;
                continue;
            }
            if (!$headerFound && (stripos($rowStr, 'Banyak') !== false || stripos($rowStr, 'NO') !== false)) {
                $headerFound = true;
                continue;
            }

            $studentName = isset($row[1]) ? trim($row[1]) : '';
            if (empty($studentName) || stripos($studentName, 'Name') !== false || is_numeric($studentName)) {
                continue;
            }

            $rawLevel = isset($row[2]) ? trim($row[2]) : '';
            $rawClass = isset($row[3]) ? trim($row[3]) : '';
            $rawSchool = isset($row[4]) ? trim($row[4]) : '';
            $rawPaket = isset($row[5]) ? trim($row[5]) : '';
            $rawJoinDate = isset($row[6]) ? trim($row[6]) : '';
            $rawMomPhone = isset($row[10]) ? $this->cleanPhoneNumber(trim($row[10])) : '';
            $rawDadPhone = isset($row[13]) ? $this->cleanPhoneNumber(trim($row[13])) : '';
            $rawBirthDate = isset($row[15]) ? trim($row[15]) : '';
            $rawAddress = isset($row[16]) ? trim($row[16]) : '';

            // Extract numeric cycle/paket count
            $packageCount = 1;
            if (preg_match('/(\d+)/', $rawPaket, $m)) {
                $packageCount = (int) $m[1];
            } elseif (preg_match('/Paket\s*(\d+)/i', $rawLevel, $m)) {
                $packageCount = (int) $m[1];
            }

            // Clean student name variations like "Name/Nickname", "Name (Nickname)", or trailing initials like "Hilda Abigail P" -> "Hilda Abigail"
            $cleanedName = preg_replace('/\s*[\/\(].*$/', '', $studentName);
            $cleanedName = preg_replace('/\s+[A-Za-z]\.?$/', '', $cleanedName); // remove single letter initial at end
            $cleanedName = trim($cleanedName);

            // Find matching lead strictly by Name (exact or normalized)
            $lead = Lead::where('branch_id', $branchId)
                ->where('name', $studentName)
                ->first();

            if (!$lead && !empty($cleanedName)) {
                $lead = Lead::where('branch_id', $branchId)
                    ->where('name', $cleanedName)
                    ->first();
            }

            if (!$lead) {
                // Try fuzzy/normalized and typo-tolerant matching against all leads in this branch
                $normName = $this->normalizeName($studentName);
                $normCleaned = $this->normalizeName($cleanedName);
                $candidates = Lead::where('branch_id', $branchId)->get();
                $bestScore = 0;
                $bestLead = null;

                foreach ($candidates as $cand) {
                    $candNorm = $this->normalizeName($cand->name);
                    $candNormCleaned = $this->normalizeName(preg_replace('/\s+[A-Za-z]\.?$/', '', $cand->name));

                    // 1. Exact match (full or cleaned name)
                    if ($candNorm === $normName || $candNorm === $normCleaned || $candNormCleaned === $normCleaned) {
                        $bestLead = $cand;
                        break;
                    }

                    // 2. Substring / Prefix match
                    if (strlen($candNorm) >= 5 && strlen($normCleaned) >= 5) {
                        if (str_starts_with($candNorm, $normCleaned) || str_starts_with($normCleaned, $candNorm)) {
                            $bestLead = $cand;
                            break;
                        }
                    }

                    // 3. Typo-tolerant similarity
                    similar_text($normCleaned, $candNorm, $percent);
                    $lev = levenshtein($normCleaned, $candNorm);
                    if (($percent >= 85 && strlen($normCleaned) >= 6) || ($lev <= 2 && strlen($normCleaned) >= 8)) {
                        if ($percent > $bestScore) {
                            $bestScore = $percent;
                            $bestLead = $cand;
                        }
                    }
                }

                if ($bestLead) {
                    $lead = $bestLead;
                }
            }

            if ($lead) {
                $student = $lead->student;
                $joinDate = $this->parseDate($rawJoinDate);

                // Update lead birth date / address if currently empty
                $leadUpdates = [];
                if (empty($lead->birth_date) && !empty($rawBirthDate)) {
                    $parsedBday = $this->parseDate($rawBirthDate);
                    if ($parsedBday) $leadUpdates['birth_date'] = $parsedBday->toDateString();
                }
                if (empty($lead->address) && !empty($rawAddress)) {
                    $leadUpdates['address'] = $rawAddress;
                }
                if (empty($lead->school) && !empty($rawSchool) && $rawSchool !== '-') {
                    $leadUpdates['school'] = $rawSchool;
                }
                if (!empty($leadUpdates)) {
                    $lead->update($leadUpdates);
                }

                // Update Student rejoin_count & loyalty_tier
                if ($student) {
                    $newRejoinCount = max($student->rejoin_count ?? 0, $packageCount);
                    $studentUpdates = ['rejoin_count' => $newRejoinCount];
                    if ($joinDate && (empty($student->start_join) || $joinDate->lessThan($student->start_join))) {
                        $studentUpdates['start_join'] = $joinDate->toDateString();
                    }

                    // Compute matching loyalty tier
                    $matchingSetting = \App\Domains\Finance\Domain\Models\LoyaltySetting::where('min_rejoin_count', '<=', $newRejoinCount)
                        ->orderBy('min_rejoin_count', 'desc')
                        ->first();
                    if ($matchingSetting) {
                        $studentUpdates['loyalty_tier'] = $matchingSetting->tier_name;
                    }

                    $student->update($studentUpdates);
                }

                // Update Lead Enrollment Cycle Number
                $enrollment = LeadEnrollment::where('lead_id', $lead->id)->first();
                if ($enrollment) {
                    $enrollment->update([
                        'cycle_number' => max($enrollment->cycle_number ?? 1, $packageCount),
                        'joined_at' => $joinDate ? $joinDate->toDateString() : $enrollment->joined_at,
                    ]);
                    $syncCount++;
                }
            }
        }

        fclose($file);
        $this->command->info("Berhasil menyinkronkan data siklus paket untuk {$syncCount} siswa Semarang.");
    }

    private function cleanClassName(string $name): string
    {
        $clean = preg_replace('/\s*\((offline|online|on campus|off line|on line)\)/i', '', $name);
        $clean = preg_replace('/\s+/', ' ', $clean);
        return trim($clean);
    }

    private function normalizeClassName(string $name): string
    {
        $clean = $this->cleanClassName($name);
        return strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $clean));
    }

    private function normalizeName(string $name): string
    {
        return strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
    }
}
