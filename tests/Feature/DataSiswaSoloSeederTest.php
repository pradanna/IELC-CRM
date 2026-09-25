<?php

namespace Tests\Feature;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\CRM\Domain\Models\LeadEnrollment;
use App\Domains\CRM\Domain\Models\LeadGuardian;
use App\Domains\Master\Domain\Models\Branch;
use Database\Seeders\BranchSeeder;
use Database\Seeders\DataSiswaSoloSeeder;
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

class DataSiswaSoloSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_data_siswa_solo_seeder_imports_all_students_and_assigns_classes(): void
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
            DataSiswaSoloSeeder::class,
        ]);

        $soloBranch = Branch::where('code', 'SOLO')->first();
        $this->assertNotNull($soloBranch);

        // 1. Total unique Leads: 706 leads (707 entries - 1 multi-class student Victoria Darseno)
        $soloLeadsCount = Lead::where('branch_id', $soloBranch->id)->count();
        $this->assertEquals(706, $soloLeadsCount);

        // 2. Total active Students: 706 students
        $soloStudentsCount = Student::whereHas('lead', fn($q) => $q->where('branch_id', $soloBranch->id))->count();
        $this->assertEquals(706, $soloStudentsCount);

        // 3. Total LeadEnrollments: 707 enrollments
        $enrollments = LeadEnrollment::whereHas('studyClass', fn($q) => $q->where('branch_id', $soloBranch->id))->get();
        $this->assertEquals(707, $enrollments->count());

        // 4. Enrollments breakdown: 586 Group + 121 Private
        $groupEnrollments = LeadEnrollment::whereHas('studyClass', fn($q) => $q->where('branch_id', $soloBranch->id)->where('category', '!=', 'private'))->count();
        $privateEnrollments = LeadEnrollment::whereHas('studyClass', fn($q) => $q->where('branch_id', $soloBranch->id)->where('category', 'private'))->count();

        $this->assertEquals(586, $groupEnrollments);
        $this->assertEquals(121, $privateEnrollments);

        // 5. Verify sample group class: Jovie & Co (9 students)
        $jovieClass = StudyClass::where('branch_id', $soloBranch->id)->where('name', 'Jovie & Co')->first();
        $this->assertNotNull($jovieClass);
        $this->assertEquals(9, $jovieClass->students()->count());

        // 6. Verify sample student: Jovie Graciella Aryanto
        $jovieLead = Lead::where('name', 'Jovie Graciella Aryanto')->first();
        $this->assertNotNull($jovieLead);
        $this->assertEquals('danni.winda@gmail.com', $jovieLead->email);
        $this->assertEquals('2021-06-25', $jovieLead->birth_date?->format('Y-m-d'));
        $this->assertEquals('FIS', $jovieLead->school);
        $this->assertEquals('SD 1', $jovieLead->grade);
        $this->assertEquals('Surakarta', $jovieLead->city);
        $this->assertEquals('Sutowijoyo', $jovieLead->address);

        // Verify Guardians for Jovie
        $jovieMom = LeadGuardian::where('lead_id', $jovieLead->id)->where('role', 'mother')->first();
        $this->assertNotNull($jovieMom);
        $this->assertEquals('Winda', $jovieMom->name);
        $this->assertEquals('628151891984', $jovieMom->phone);

        $jovieDad = LeadGuardian::where('lead_id', $jovieLead->id)->where('role', 'father')->first();
        $this->assertNotNull($jovieDad);
        $this->assertEquals('Danni', $jovieDad->name);
        $this->assertEquals('6287836164535', $jovieDad->phone);

        // 7. Verify multi-enrolled student: Victoria Darseno (2 classes)
        $victoriaLead = Lead::where('name', 'Victoria Darseno')->first();
        $this->assertNotNull($victoriaLead);
        $victoriaStudent = $victoriaLead->student;
        $this->assertNotNull($victoriaStudent);

        $victoriaClasses = $victoriaStudent->studyClasses;
        $this->assertEquals(2, $victoriaClasses->count());

        $classNames = $victoriaClasses->pluck('name')->toArray();
        $this->assertContains('Ola & Co', $classNames);
        $this->assertContains('Privat 20 - Victoria Darseno', $classNames);

        // 8. Verify sample private offline student: Steve Tjahjo
        $steveLead = Lead::where('name', 'Steve Tjahjo')->first();
        $this->assertNotNull($steveLead);
        $steveEnrollment = LeadEnrollment::where('lead_id', $steveLead->id)->first();
        $this->assertNotNull($steveEnrollment);
        $this->assertEquals('IELTS 40 Sesi - Steve Tjahjo', $steveEnrollment->studyClass->name);
        $this->assertEquals('offline', $steveEnrollment->studyClass->type);

        // 9. Verify sample private online student: Feliza Octavia Shabrina
        $felizaLead = Lead::where('name', 'Feliza Octavia Shabrina')->first();
        $this->assertNotNull($felizaLead);
        $this->assertTrue($felizaLead->is_online);
        $felizaEnrollment = LeadEnrollment::where('lead_id', $felizaLead->id)->first();
        $this->assertNotNull($felizaEnrollment);
        $this->assertEquals('IELTS 40 Sesi - Feliza Octavia Shabrina', $felizaEnrollment->studyClass->name);
        $this->assertEquals('online', $felizaEnrollment->studyClass->type);

        // 10. Verify package count synchronization (rejoin_count & cycle_number)
        $galangLead = Lead::where('name', 'Galang Rahardika Justisia')->first();
        $this->assertNotNull($galangLead);
        $galangStudent = $galangLead->student;
        $this->assertNotNull($galangStudent);
        $this->assertEquals(6, $galangStudent->rejoin_count);

        $galangEnrollment = LeadEnrollment::where('lead_id', $galangLead->id)->first();
        $this->assertNotNull($galangEnrollment);
        $this->assertEquals(6, $galangEnrollment->cycle_number);

        $gafaroLead = Lead::where('name', 'Gafaro Cahya Azkarais')->first();
        $this->assertNotNull($gafaroLead);
        $this->assertEquals(7, $gafaroLead->student->rejoin_count);

        // 11. Verify bidirectional sibling relationships
        $jarrenLead = Lead::where('name', 'Jarren Sutanto')->first();
        $mikaylieLead = Lead::where('name', 'Mikaylie Sutanto')->first();
        $this->assertNotNull($jarrenLead);
        $this->assertNotNull($mikaylieLead);

        // Forward: Jarren -> Mikaylie
        $this->assertDatabaseHas('lead_relationships', [
            'lead_id' => $jarrenLead->id,
            'related_lead_id' => $mikaylieLead->id,
            'type' => 'sibling',
        ]);

        // Inverse: Mikaylie -> Jarren
        $this->assertDatabaseHas('lead_relationships', [
            'lead_id' => $mikaylieLead->id,
            'related_lead_id' => $jarrenLead->id,
            'type' => 'sibling',
        ]);

        // Verify Isyana Tyas Nur Indraswari <-> Mona Hanna
        $isyanaLead = Lead::where('name', 'Isyana Tyas Nur Indraswari')->first();
        $monaLead = Lead::where('name', 'Mona Hanna')->first();
        $this->assertNotNull($isyanaLead);
        $this->assertNotNull($monaLead);

        $this->assertDatabaseHas('lead_relationships', [
            'lead_id' => $isyanaLead->id,
            'related_lead_id' => $monaLead->id,
            'type' => 'sibling',
        ]);

        // Verify Galang Rahardika Justisia <-> Lintang Varesya Djenar
        $lintangLead = Lead::where('name', 'Lintang Varesya Djenar')->first();
        $this->assertNotNull($lintangLead);
        $this->assertDatabaseHas('lead_relationships', [
            'lead_id' => $galangLead->id,
            'related_lead_id' => $lintangLead->id,
            'type' => 'sibling',
        ]);

        // Total sibling links in branch should be greater than 100
        $totalSiblingRelations = \App\Domains\CRM\Domain\Models\LeadRelationship::where('type', 'sibling')->count();
        $this->assertGreaterThan(100, $totalSiblingRelations);
    }
}
