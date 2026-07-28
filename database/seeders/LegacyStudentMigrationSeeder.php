<?php

namespace Database\Seeders;

use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Master\Domain\Models\LeadPhase;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadGuardian;
use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Finance\Domain\Models\PriceMaster;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LegacyStudentMigrationSeeder extends Seeder
{
    public function run(): void
    {
        $soloBranch = Branch::where('code', 'SOLO')->first();
        if (!$soloBranch) {
            $soloBranch = Branch::first();
        }
        $branchId = $soloBranch?->id;

        $enrolledPhase = LeadPhase::where('code', 'enrollment')->first();
        $phaseId = $enrolledPhase?->id;

        $admin = User::first();
        $adminId = $admin?->id;

        $priceMaster = PriceMaster::first();
        if (!$priceMaster) {
            $priceMaster = PriceMaster::create([
                'name' => 'Paket Standar',
                'price_per_session' => 150000,
            ]);
        }
        $priceMasterId = $priceMaster->id;

        $studentProfileMap = $this->parseStudentProfiles();
        $this->command->info('Loaded ' . count($studentProfileMap) . ' student profiles from datasiswa.csv.');

        $this->importClassesAndStudents($branchId, $phaseId, $studentProfileMap, $adminId, $priceMasterId);
    }

    private function parseStudentProfiles(): array
    {
        $filePath = base_path('docs/initiate data/datasiswa.csv');
        if (!file_exists($filePath)) {
            $this->command->error("File not found: {$filePath}");
            return [];
        }

        $profiles = [];
        $file = fopen($filePath, 'r');
        
        // Skip potential junk/header lines until we hit the header row
        $headers = [];
        while (($row = fgetcsv($file)) !== false) {
            if (in_array('NAME', $row)) {
                $headers = array_map('trim', $row);
                break;
            }
        }

        if (empty($headers)) {
            $this->command->error("Headers not found in datasiswa.csv");
            fclose($file);
            return [];
        }

        while (($row = fgetcsv($file)) !== false) {
            // Combine headers and rows
            $data = [];
            foreach ($headers as $index => $header) {
                if (isset($row[$index])) {
                    $data[$header] = trim($row[$index]);
                } else {
                    $data[$header] = '';
                }
            }

            $name = $data['NAME'] ?? '';
            if (empty($name)) {
                continue;
            }

            $key = $this->normalizeName($name);
            $profiles[$key] = $data;
        }

        fclose($file);
        return $profiles;
    }

    private function importClassesAndStudents(string $branchId, ?string $phaseId, array $studentProfileMap, ?string $adminId, ?string $priceMasterId): void
    {
        $filePath = base_path('docs/initiate data/datasiswa & kelas.csv');
        if (!file_exists($filePath)) {
            $this->command->error("File not found: {$filePath}");
            return;
        }

        $file = fopen($filePath, 'r');
        
        // Skip header lines
        $headers = [];
        while (($row = fgetcsv($file)) !== false) {
            if (in_array('Full Name', $row)) {
                $headers = array_map('trim', $row);
                break;
            }
        }

        $currentClass = null;
        $importedStudentsCount = 0;
        $importedClassesCount = 0;
        $generatedCounters = [];

        while (($row = fgetcsv($file)) !== false) {
            // Check if this row defines a new group/class
            $className = isset($row[2]) ? trim($row[2]) : '';
            
            if (!empty($className) && str_contains(strtolower($className), '& co')) {
                // Parse schedule days from schedule columns
                $day1 = isset($row[4]) ? trim($row[4]) : '';
                $day2 = isset($row[5]) ? trim($row[5]) : '';
                $scheduleDays = $this->parseScheduleDays($day1, $day2);

                $currentClass = StudyClass::updateOrCreate(
                    [
                        'name' => $className,
                        'branch_id' => $branchId,
                    ],
                    [
                        'price_master_id' => $priceMasterId,
                        'start_session_date' => Carbon::now()->startOfMonth()->subMonths(1),
                        'end_session_date' => Carbon::now()->startOfMonth()->addMonths(3),
                        'total_meetings' => 24,
                        'meetings_per_week' => count($scheduleDays) ?: 2,
                        'current_session_number' => 1,
                        'schedule_days' => $scheduleDays,
                    ]
                );
                $importedClassesCount++;
            }

            // Check if this row defines class cycle dates (e.g. (15 Jun - 2 Sep) under 'Buku' column)
            $bookOrCycle = isset($row[3]) ? trim($row[3]) : '';
            if ($currentClass && !empty($bookOrCycle) && str_starts_with($bookOrCycle, '(') && str_ends_with($bookOrCycle, ')')) {
                [$startDate, $endDate] = $this->parseClassCycleDates($bookOrCycle, 2026);
                if ($startDate && $endDate) {
                    $currentClass->update([
                        'start_session_date' => $startDate,
                        'end_session_date' => $endDate,
                    ]);
                }
            }

            // Check if there is a student name in this row
            $studentName = isset($row[7]) ? trim($row[7]) : '';
            if (empty($studentName) || in_array(strtolower($studentName), ['name', 'full name', 'waiting list'])) {
                continue;
            }

            // Clean up name
            $studentName = preg_replace('/\s+/', ' ', $studentName);

            // Look up student details in datasiswa.csv map
            $lookupKey = $this->normalizeName($studentName);
            $profile = $studentProfileMap[$lookupKey] ?? null;

            // Generate clean phone numbers
            $phone = '';
            $parentPhone = '';
            $parentName = '';

            if ($profile) {
                $phone = $this->cleanPhoneNumber($profile['WA SISWA'] ?? '');
                $parentPhone = $this->cleanPhoneNumber($profile["MOM'S HP"] ?: ($profile["DAD'S HP"] ?: ''));
                $parentName = $profile['MOM'] ?: ($profile['DAD'] ?: '');
            }

            if (empty($phone) && !empty($parentPhone)) {
                $phone = $parentPhone;
            }

            // Generate join date and lead number
            $joinDateStr = $profile['JOIN DATE'] ?? null;
            $joinDate = $joinDateStr ? $this->parseJoinDate($joinDateStr) : Carbon::now();
            $leadNumber = "L-" . $joinDate->format('Ymd') . "-" . str_pad($importedStudentsCount + 1, 4, '0', STR_PAD_LEFT);

            // 1. Create or update Lead record (since Student needs lead_id)
            $gradeVal = ($profile && !empty($profile['CLASS'])) ? $profile['CLASS'] : (isset($row[9]) ? trim($row[9]) : 'UMUM');
            $schoolVal = ($profile && !empty($profile['SCHOOL'])) ? $profile['SCHOOL'] : (isset($row[8]) ? trim($row[8]) : null);

            $lead = Lead::updateOrCreate(
                [
                    'name' => $studentName,
                    'phone' => $phone ?: '081234567890', // fallback if phone is missing
                ],
                [
                    'lead_number' => $leadNumber,
                    'email' => $profile['EMAIL'] ?? null,
                    'branch_id' => $branchId,
                    'lead_phase_id' => $phaseId,
                    'grade' => $gradeVal,
                    'school' => $schoolVal,
                    'address' => $profile['ADDRESS'] ?? null,
                    'city' => $profile['CITY'] ?? null,
                    'owner_id' => $adminId,
                    'created_by' => $adminId,
                ]
            );

            // Create guardians
            if ($profile) {
                if (!empty($profile['MOM'])) {
                    LeadGuardian::updateOrCreate(
                        [
                            'lead_id' => $lead->id,
                            'role' => 'mother',
                        ],
                        [
                            'name' => $profile['MOM'],
                            'phone' => $this->cleanPhoneNumber($profile["MOM'S HP"] ?? ''),
                            'is_main_contact' => true,
                        ]
                    );
                }
                if (!empty($profile['DAD'])) {
                    LeadGuardian::updateOrCreate(
                        [
                            'lead_id' => $lead->id,
                            'role' => 'father',
                        ],
                        [
                            'name' => $profile['DAD'],
                            'phone' => $this->cleanPhoneNumber($profile["DAD'S HP"] ?? ''),
                            'is_main_contact' => empty($profile['MOM']),
                        ]
                    );
                }
            }

            // Generate student number using the joinDate computed earlier
            $yearMonth = $joinDate->format('ym');
            if (!isset($generatedCounters[$yearMonth])) {
                $generatedCounters[$yearMonth] = Student::where('student_number', 'like', "STU-{$yearMonth}-%")->count();
            }
            $generatedCounters[$yearMonth]++;
            $sequence = str_pad($generatedCounters[$yearMonth], 4, '0', STR_PAD_LEFT);
            $studentNumber = "STU-{$yearMonth}-{$sequence}";

            // Generate random rejoin count (0 to 12)
            $rejoinCount = rand(0, 12);
            $loyaltyTier = null;
            
            if ($rejoinCount > 0) {
                $tempStudent = new Student(['rejoin_count' => $rejoinCount, 'start_join' => $joinDate]);
                $matchingSetting = \App\Domains\Finance\Domain\Models\LoyaltySetting::orderBy('min_rejoin_count', 'desc')
                    ->get()
                    ->first(function ($setting) use ($tempStudent) {
                        return $setting->matchesStudent($tempStudent);
                    });
                if ($matchingSetting) {
                    $loyaltyTier = $matchingSetting->tier_name;
                }
            }

            // 2. Create or update Student record
            $student = Student::where('lead_id', $lead->id)->first();
            if (!$student) {
                $student = Student::create([
                    'lead_id' => $lead->id,
                    'student_number' => $studentNumber,
                    'start_join' => $joinDate,
                    'status' => 'active',
                    'rejoin_count' => $rejoinCount,
                    'loyalty_tier' => $loyaltyTier,
                    'notes' => (!empty($profile) && !empty($profile['NIK'])) ? "NIK: {$profile['NIK']}" : null,
                ]);
            } else {
                $student->update([
                    'start_join' => $joinDate,
                    'status' => 'active',
                    'rejoin_count' => $rejoinCount,
                    'loyalty_tier' => $loyaltyTier,
                    'notes' => (!empty($profile) && !empty($profile['NIK'])) ? "NIK: {$profile['NIK']}" : null,
                ]);
            }

            // Seed student loyalty rewards based on their computed tiers
            if ($loyaltyTier) {
                $settingsToAward = \App\Domains\Finance\Domain\Models\LoyaltySetting::orderBy('min_rejoin_count', 'desc')
                    ->get()
                    ->filter(function ($setting) use ($student) {
                        return $setting->matchesStudent($student);
                    });
                foreach ($settingsToAward as $setting) {
                    $student->loyaltyRewards()->updateOrCreate(
                        ['tier_name' => $setting->tier_name],
                        [
                            'voucher_name' => $setting->voucher_name,
                            'discount_amount' => $setting->discount_amount,
                            'cafe_points' => $setting->cafe_points,
                            'is_used' => (bool) rand(0, 1),
                        ]
                    );
                }
            }

            // 3. Enroll Student to current Class if active
            if ($currentClass) {
                $student->studyClasses()->syncWithoutDetaching([
                    $currentClass->id => [
                        'lead_id' => $lead->id,
                        'joined_at' => $joinDate->toDateString(),
                        'end_date' => $currentClass->end_session_date?->format('Y-m-d'),
                        'status' => 'active',
                        'cycle_number' => $currentClass->current_session_number ?? 1,
                    ]
                ]);
            }

            $importedStudentsCount++;
        }

        fclose($file);

        $this->command->info("Successfully migrated {$importedClassesCount} classes and {$importedStudentsCount} students!");
    }

    private function parseScheduleDays(?string $day1, ?string $day2): array
    {
        $days = [];
        foreach ([$day1, $day2] as $dayStr) {
            if (empty($dayStr)) continue;
            
            $dayStr = strtolower(trim($dayStr));
            if (str_starts_with($dayStr, 'mon')) $days[] = 'Monday';
            elseif (str_starts_with($dayStr, 'tue')) $days[] = 'Tuesday';
            elseif (str_starts_with($dayStr, 'wed')) $days[] = 'Wednesday';
            elseif (str_starts_with($dayStr, 'thu')) $days[] = 'Thursday';
            elseif (str_starts_with($dayStr, 'fri')) $days[] = 'Friday';
            elseif (str_starts_with($dayStr, 'sat')) $days[] = 'Saturday';
            elseif (str_starts_with($dayStr, 'sun')) $days[] = 'Sunday';
        }
        return array_unique($days);
    }

    private function parseJoinDate(string $dateStr): Carbon
    {
        try {
            // Try standard formats like '10-Dec-25' or '10-12-2025'
            return Carbon::parse($dateStr);
        } catch (\Exception $e) {
            return Carbon::now();
        }
    }

    private function cleanPhoneNumber(string $phone): string
    {
        // Strip non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (empty($phone)) return '';
        
        // Convert leading 0 to 62
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        }
        // If not starting with 62 or 8, make sure it has country code
        if (str_starts_with($phone, '8')) {
            $phone = '62' . $phone;
        }

        return $phone;
    }

    private function normalizeName(string $name): string
    {
        return strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
    }

    private function parseClassCycleDates(string $dateRangeStr, int $year): array
    {
        // Remove parentheses
        $dateRangeStr = trim(str_replace(['(', ')'], '', $dateRangeStr));
        
        $parts = explode('-', $dateRangeStr);
        if (count($parts) !== 2) {
            return [null, null];
        }

        $startStr = trim($parts[0]);
        $endStr = trim($parts[1]);

        $startDate = $this->parseSingleMonthDate($startStr, $year);
        $endDate = $this->parseSingleMonthDate($endStr, $year);

        // If end date is earlier than start date, it might cross the year boundary (e.g., Dec - Feb)
        if ($startDate && $endDate && $endDate->lt($startDate)) {
            $endDate->addYear();
        }

        return [$startDate, $endDate];
    }

    private function parseSingleMonthDate(string $str, int $year): ?Carbon
    {
        // Replace Indonesian month names with English
        $replacements = [
            'mei' => 'May',
            'juni' => 'June',
            'juli' => 'July',
            'agu' => 'August',
            'des' => 'December',
            'tgs' => 'August', // sometimes typo
        ];

        $lower = strtolower($str);
        foreach ($replacements as $ind => $eng) {
            $lower = str_replace($ind, $eng, $lower);
        }

        try {
            return Carbon::parse("{$lower} {$year}");
        } catch (\Exception $e) {
            return null;
        }
    }
}
