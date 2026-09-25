<?php

namespace Tests\Feature;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\CRM\Domain\Models\LeadGuardian;
use App\Domains\CRM\Domain\Models\LeadRelationship;
use App\Domains\Master\Domain\Models\Branch;
use Database\Seeders\BranchSeeder;
use Database\Seeders\DataSiswaSemarangSeeder;
use Database\Seeders\LeadPhaseSeeder;
use Database\Seeders\LeadSourceSeeder;
use Database\Seeders\LeadTypeSeeder;
use Database\Seeders\LoyaltySettingSeeder;
use Database\Seeders\PriceMasterSeeder;
use Database\Seeders\RoleAndPermissionSeeder;
use Database\Seeders\StudyClassSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DataSiswaSemarangSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_data_siswa_semarang_seeder_imports_all_students_and_assigns_classes(): void
    {
        $this->seed([
            BranchSeeder::class,
            RoleAndPermissionSeeder::class,
            LoyaltySettingSeeder::class,
            LeadTypeSeeder::class,
            LeadPhaseSeeder::class,
            LeadSourceSeeder::class,
            UserSeeder::class,
            PriceMasterSeeder::class,
            StudyClassSeeder::class,
            DataSiswaSemarangSeeder::class,
        ]);

        $smgBranch = Branch::where('code', 'SMG')->first();
        $this->assertNotNull($smgBranch);

        // 1. Total unique Leads: 207 leads (211 rows - 4 duplicate student rows)
        $smgLeadsCount = Lead::where('branch_id', $smgBranch->id)->count();
        $this->assertEquals(207, $smgLeadsCount);

        // 2. Total active Students: 207 students
        $smgStudentsCount = Student::whereHas('lead', fn($q) => $q->where('branch_id', $smgBranch->id))->count();
        $this->assertEquals(207, $smgStudentsCount);

        // 3. Total LeadEnrollments: 210 enrollments
        $enrollments = LeadEnrollment::whereHas('studyClass', fn($q) => $q->where('branch_id', $smgBranch->id))->get();
        $this->assertEquals(210, $enrollments->count());

        // 4. Enrollments breakdown: 157 Group + 53 Private
        $groupEnrollments = LeadEnrollment::whereHas('studyClass', fn($q) => $q->where('branch_id', $smgBranch->id)->where('category', '!=', 'private'))->count();
        $privateEnrollments = LeadEnrollment::whereHas('studyClass', fn($q) => $q->where('branch_id', $smgBranch->id)->where('category', 'private'))->count();

        $this->assertEquals(157, $groupEnrollments);
        $this->assertEquals(53, $privateEnrollments);

        // 5. Verify sample group class student: Hikari Shakayla Liquisa in Hikari & Co
        $hikariLead = Lead::where('branch_id', $smgBranch->id)->where('name', 'Hikari Shakayla Liquisa')->first();
        $this->assertNotNull($hikariLead);
        $this->assertEquals('Semarang', $hikariLead->city);
        $this->assertNotNull($hikariLead->student);

        $hikariClass = $hikariLead->student->studyClasses->first();
        $this->assertNotNull($hikariClass);
        $this->assertEquals('Hikari & Co', $hikariClass->name);

        $this->assertEquals('studioyuar@gmail.com', $hikariLead->email);
        $this->assertEquals('3374075006190003', $hikariLead->nik);
        $this->assertEquals('Jl. Mangga V/15 peterongan', $hikariLead->address);
        $this->assertEquals('Khalifa IMS 3 Semarang', $hikariLead->school);
        $this->assertEquals('SD 2', $hikariLead->grade);

        // 6. Verify sample private class student: Bawa Adiwinarno in Privat 30 - Bawa Adiwinarno
        $bawaLead = Lead::where('branch_id', $smgBranch->id)->where('name', 'Bawa Adiwinarno')->first();
        $this->assertNotNull($bawaLead);
        $this->assertNotNull($bawaLead->student);
        $bawaClass = $bawaLead->student->studyClasses->first();
        $this->assertNotNull($bawaClass);
        $this->assertStringContainsString('Bawa Adiwinarno', $bawaClass->name);
        $this->assertEquals('private', $bawaClass->category);

        // 7. Verify typo-tolerant matching: Afifah Khairunnisa matches Privat 30 - Afifah Khairnnisa
        $afifahLead = Lead::where('branch_id', $smgBranch->id)->where('name', 'Afifah Khairunnisa')->first();
        $this->assertNotNull($afifahLead);
        $this->assertNotNull($afifahLead->student);
        $afifahClass = $afifahLead->student->studyClasses->first();
        $this->assertNotNull($afifahClass);
        $this->assertStringContainsString('Afifah', $afifahClass->name);

        // 8. Verify multi-class students (3 students taking Group + Semi Private)
        $multiClassStudents = [
            'Elnath Tirta Alvaronizam' => ['Bradley & Co', 'Semi Private - Elnath Tirta Alvaronizam'],
            'Louisa Lavinia Liong' => ['Zayyan & Co', 'Semi Private - Louisa Laviana Liong'],
            'Keisha Aretha Azalea' => ['Arraya & Co', 'Semi Private - Keisha Aretha Azalea'],
        ];

        foreach ($multiClassStudents as $stuName => $expectedClasses) {
            $lead = Lead::where('branch_id', $smgBranch->id)->where('name', $stuName)->first();
            $this->assertNotNull($lead, "Lead {$stuName} should exist");
            $this->assertNotNull($lead->student, "Student {$stuName} should exist");
            $this->assertEquals(2, $lead->student->studyClasses()->count(), "Student {$stuName} should have 2 class enrollments");

            $enrolledNames = $lead->student->studyClasses->pluck('name')->toArray();
            foreach ($expectedClasses as $expectedClass) {
                $this->assertContains($expectedClass, $enrolledNames);
            }
        }

        // 9. Verify duplicate row student: Junhyuk An has exactly 1 enrollment in Zia & Co
        $junhyukLead = Lead::where('branch_id', $smgBranch->id)->where('name', 'Junhyuk An')->first();
        $this->assertNotNull($junhyukLead);
        $this->assertEquals(1, $junhyukLead->student->studyClasses()->count());
        $this->assertEquals('Zia & Co', $junhyukLead->student->studyClasses->first()->name);

        // 10. Verify package counts & loyalty tier sync
        $hikariStudent = $hikariLead->student;
        $this->assertEquals(8, $hikariStudent->rejoin_count);
        $this->assertNotNull($hikariStudent->loyalty_tier);

        // 11. Verify bidirectional sibling relationships
        $elnathLead = Lead::where('branch_id', $smgBranch->id)->where('name', 'Elnath Tirta Alvaronizam')->first();
        $keishaLead = Lead::where('branch_id', $smgBranch->id)->where('name', 'Keisha Aretha Azalea')->first();
        $this->assertNotNull($elnathLead);
        $this->assertNotNull($keishaLead);

        $hasElnathToKeisha = LeadRelationship::where('lead_id', $elnathLead->id)
            ->where('related_lead_id', $keishaLead->id)
            ->where('type', 'sibling')
            ->exists();
        $hasKeishaToElnath = LeadRelationship::where('lead_id', $keishaLead->id)
            ->where('related_lead_id', $elnathLead->id)
            ->where('type', 'sibling')
            ->exists();

        $this->assertTrue($hasElnathToKeisha, "Elnath should have Keisha as sibling");
        $this->assertTrue($hasKeishaToElnath, "Keisha should have Elnath as sibling");
    }
}
