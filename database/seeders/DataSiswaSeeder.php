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
use Illuminate\Support\Str;

class DataSiswaSeeder extends Seeder
{
    private array $generatedLeadCounters = [];
    private array $generatedStudentCounters = [];

    public function run(): void
    {
        $possiblePaths = [
            base_path('docs/initiate data/Data siswa.csv'),
            base_path('docs/initiate data/datasiswa.csv'),
            base_path('docs/initiate data/datasiswa & kelas.csv'),
        ];

        $filePath = null;
        foreach ($possiblePaths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            $this->command->error('File CSV Data siswa tidak ditemukan di docs/initiate data/');
            return;
        }

        $this->command->info("Membaca data siswa dari: {$filePath}");

        // Load master data defaults
        $soloBranch = Branch::where('code', 'SOLO')->first() ?: Branch::first();
        $semarangBranch = Branch::where('code', 'SMG')->first();
        $branchId = $soloBranch?->id;

        $enrollmentPhase = LeadPhase::where('code', 'enrollment')->first() ?: LeadPhase::first();
        $leadPhaseId = $enrollmentPhase?->id;

        $leadType = LeadType::where('code', 'regular')->first() ?: LeadType::first();
        $leadTypeId = $leadType?->id;

        $leadSource = LeadSource::first();
        $leadSourceId = $leadSource?->id;

        $adminUser = \App\Domains\Shared\Domain\Models\User::first();
        $adminId = $adminUser?->id;

        // Load all StudyClasses into memory indexed by normalized name
        $studyClasses = StudyClass::all();
        $studyClassMap = [];
        foreach ($studyClasses as $sc) {
            $normalized = $this->normalizeName($sc->name);
            $studyClassMap[$normalized] = $sc;
        }

        $file = fopen($filePath, 'r');
        $importedCount = 0;
        $skippedCount = 0;

        while (($row = fgetcsv($file)) !== false) {
            $groupTypeRaw = isset($row[2]) ? trim($row[2]) : '';
            $className = isset($row[3]) ? trim($row[3]) : '';
            $studentName = isset($row[4]) ? trim($row[4]) : '';
            $joinDateStr = isset($row[5]) ? trim($row[5]) : '';

            // Skip empty rows or header row
            if (empty($studentName) || strtolower($studentName) === 'name') {
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

            $joinDate = $this->parseDate($joinDateStr) ?: Carbon::now();
            $birthDate = isset($row[6]) ? $this->parseDate(trim($row[6])) : null;

            $nik = isset($row[7]) ? trim($row[7]) : '';
            $email = isset($row[8]) ? trim($row[8]) : '';
            $address = isset($row[9]) ? trim($row[9]) : '';
            $city = isset($row[10]) ? trim($row[10]) : '';
            $school = isset($row[11]) ? trim($row[11]) : '';
            $grade = isset($row[12]) ? trim($row[12]) : '';
            $studentWa = isset($row[13]) ? $this->cleanPhoneNumber(trim($row[13])) : '';

            $momName = isset($row[14]) ? trim($row[14]) : '';
            $momPhone = isset($row[15]) ? $this->cleanPhoneNumber(trim($row[15])) : '';

            $dadName = isset($row[16]) ? trim($row[16]) : '';
            $dadPhone = isset($row[17]) ? $this->cleanPhoneNumber(trim($row[17])) : '';

            $isSemarang = (strcasecmp($city, 'Semarang') === 0 || str_contains(strtolower($address), 'semarang') || str_contains($groupTypeLower, 'smg') || str_contains($classNameLower, 'smg'));
            $studentBranchId = ($isSemarang && $semarangBranch) ? $semarangBranch->id : $soloBranch?->id;

            // Determine primary phone number for lead
            $phone = !empty($studentWa) ? $studentWa : (!empty($momPhone) ? $momPhone : $dadPhone);
            if (empty($phone)) {
                $phone = '628' . sprintf('%09d', rand(100000000, 999999999));
            }

            // Generate Lead Number
            $leadNumber = $this->generateLeadNumber($joinDate);

            // 1. Create or Update Lead
            $lead = Lead::where('name', $studentName)
                ->where(function ($q) use ($email, $phone) {
                    if (!empty($email)) {
                        $q->where('email', $email);
                    }
                    if (!empty($phone)) {
                        $q->orWhere('phone', $phone);
                    }
                })->first();

            if (!$lead) {
                $lead = Lead::create([
                    'lead_number' => $leadNumber,
                    'name' => $studentName,
                    'phone' => $phone ?: null,
                    'email' => $email ?: null,
                    'birth_date' => $birthDate?->toDateString(),
                    'school' => $school ?: null,
                    'grade' => $grade ?: null,
                    'city' => $city ?: null,
                    'address' => $address ?: null,
                    'branch_id' => $studentBranchId,
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
                    'school' => $school ?: $lead->school,
                    'grade' => $grade ?: $lead->grade,
                    'city' => $city ?: $lead->city,
                    'address' => $address ?: $lead->address,
                    'branch_id' => $studentBranchId,
                    'is_online' => $isOnline,
                    'enrolled_at' => $joinDate->toDateString(),
                ]);
            }

            // 2. Create Lead Guardians
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

            // 3. Create or Update Student
            $studentNumber = $this->generateStudentNumber($joinDate);
            $student = Student::where('lead_id', $lead->id)->first();

            if (!$student) {
                $student = Student::create([
                    'lead_id' => $lead->id,
                    'student_number' => $studentNumber,
                    'start_join' => $joinDate->toDateString(),
                    'status' => 'active',
                    'notes' => !empty($nik) ? "NIK: {$nik}" : null,
                ]);
            } else {
                $student->update([
                    'start_join' => $joinDate->toDateString(),
                    'status' => 'active',
                    'notes' => !empty($nik) ? "NIK: {$nik}" : $student->notes,
                ]);
            }

            // 4. Match StudyClass and create LeadEnrollment
            $matchedClass = null;
            if (!empty($className)) {
                $normalizedClass = $this->normalizeName($className);
                $matchedClass = $studyClassMap[$normalizedClass] ?? null;

                // Try partial match if exact normalized match failed
                if (!$matchedClass) {
                    foreach ($studyClassMap as $key => $sc) {
                        if (str_contains($key, $normalizedClass) || str_contains($normalizedClass, $key)) {
                            $matchedClass = $sc;
                            break;
                        }
                    }
                }
            }

            if (!$matchedClass && !empty($className)) {
                $matchedClass = StudyClass::firstOrCreate(
                    ['name' => $className],
                    [
                        'branch_id' => $studentBranchId,
                        'type' => $isOnline ? 'online' : 'offline',
                        'status' => 'active',
                    ]
                );
                $studyClassMap[$normalizedClass] = $matchedClass;
            }

            $targetClass = $matchedClass ?: StudyClass::first();

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

        $this->command->info("Berhasil mengimpor {$importedCount} data siswa, lead, dan lead enrollment!");
    }

    private function generateLeadNumber(Carbon $date): string
    {
        $ym = $date->format('ym');
        if (!isset($this->generatedLeadCounters[$ym])) {
            $this->generatedLeadCounters[$ym] = Lead::where('lead_number', 'like', "LD-{$ym}-%")->count();
        }
        $this->generatedLeadCounters[$ym]++;
        $seq = str_pad($this->generatedLeadCounters[$ym], 4, '0', STR_PAD_LEFT);
        return "LD-{$ym}-{$seq}";
    }

    private function generateStudentNumber(Carbon $date): string
    {
        $ym = $date->format('ym');
        if (!isset($this->generatedStudentCounters[$ym])) {
            $this->generatedStudentCounters[$ym] = Student::where('student_number', 'like', "STU-{$ym}-%")->count();
        }
        $this->generatedStudentCounters[$ym]++;
        $seq = str_pad($this->generatedStudentCounters[$ym], 4, '0', STR_PAD_LEFT);
        return "STU-{$ym}-{$seq}";
    }

    private function parseDate(?string $dateStr): ?Carbon
    {
        if (empty($dateStr)) {
            return null;
        }

        $dateStr = trim($dateStr);
        // Replace Indonesian month names with English
        $replacements = [
            'mei' => 'May',
            'juni' => 'June',
            'juli' => 'July',
            'agu' => 'August',
            'agus' => 'August',
            'okt' => 'October',
            'des' => 'December',
            'tgs' => 'August',
        ];

        $lower = strtolower($dateStr);
        foreach ($replacements as $ind => $eng) {
            $lower = str_replace($ind, $eng, $lower);
        }

        try {
            return Carbon::parse($lower);
        } catch (\Exception $e) {
            return null;
        }
    }

    private function cleanPhoneNumber(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        if (empty($phone)) {
            return '';
        }

        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (str_starts_with($phone, '8')) {
            $phone = '62' . $phone;
        }

        return $phone;
    }

    private function normalizeName(string $name): string
    {
        return strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $name));
    }
}
