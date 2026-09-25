<?php

namespace Tests\Feature;

use App\Domains\Academic\Domain\Models\StudyClass;
use Database\Seeders\BranchSeeder;
use Database\Seeders\PriceMasterSeeder;
use Database\Seeders\StudyClassSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;
use Tests\TestCase;

class StudyClassSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_study_class_seeder_imports_solo_group_and_private_classes(): void
    {
        $this->seed(BranchSeeder::class);
        $this->seed(PriceMasterSeeder::class);
        $this->seed(StudyClassSeeder::class);

        $soloBranch = \App\Domains\Master\Domain\Models\Branch::where('code', 'SOLO')->first();
        $smgBranch = \App\Domains\Master\Domain\Models\Branch::where('code', 'SMG')->first();

        // 1. Total imported classes: Solo (182) + Semarang (72) = 254 classes
        $this->assertEquals(254, StudyClass::count());

        // 2. Solo classes: 61 group + 121 private = 182
        $this->assertEquals(182, StudyClass::where('branch_id', $soloBranch->id)->count());
        $this->assertEquals(61, StudyClass::where('branch_id', $soloBranch->id)->where('category', '!=', 'private')->count());
        $this->assertEquals(121, StudyClass::where('branch_id', $soloBranch->id)->where('category', 'private')->count());

        // 3. Offline classes: Solo (136) + Semarang (72) = 208
        $this->assertEquals(208, StudyClass::where('type', 'offline')->count());

        // 4. Online classes: Solo (46) + Semarang (0) = 46
        $this->assertEquals(46, StudyClass::where('type', 'online')->count());

        // 5. Solo Categories: Kids: 26, Teens: 22, Adult: 13, Private: 121
        $this->assertEquals(26, StudyClass::where('branch_id', $soloBranch->id)->where('category', 'Kids')->count());
        $this->assertEquals(22, StudyClass::where('branch_id', $soloBranch->id)->where('category', 'Teens')->count());
        $this->assertEquals(13, StudyClass::where('branch_id', $soloBranch->id)->where('category', 'Adult')->count());
        $this->assertEquals(121, StudyClass::where('branch_id', $soloBranch->id)->where('category', 'private')->count());

        // 5. Verify sample group classes
        $jovie = StudyClass::where('name', 'Jovie & Co')->first();
        $this->assertNotNull($jovie);
        $this->assertEquals('offline', $jovie->type);
        $this->assertEquals('Kids', $jovie->category);
        $this->assertEquals(1, $jovie->current_session_number);
        $this->assertEquals(['Monday', 'Thursday'], $jovie->schedule_days);
        $this->assertEquals('2026-07-13', $jovie->start_session_date->format('Y-m-d'));
        $this->assertEquals('2026-10-01', $jovie->end_session_date->format('Y-m-d'));

        $caril = StudyClass::where('name', 'Caril & Co')->first();
        $this->assertNotNull($caril);
        $this->assertEquals('online', $caril->type);
        $this->assertEquals('Kids', $caril->category);
        $this->assertEquals(2, $caril->current_session_number);
        $this->assertEquals(['Tuesday', 'Thursday'], $caril->schedule_days);
        $this->assertEquals('2026-07-21', $caril->start_session_date->format('Y-m-d'));
        $this->assertEquals('2026-10-08', $caril->end_session_date->format('Y-m-d'));

        // 6. Verify sample private classes (Offline & Online)
        $todayStr = Carbon::today()->format('Y-m-d');

        // Sample 1: Steve Tjahjo (Offline)
        $steve = StudyClass::where('name', 'IELTS 40 Sesi - Steve Tjahjo')->first();
        $this->assertNotNull($steve);
        $this->assertEquals('offline', $steve->type);
        $this->assertEquals('private', $steve->category);
        $this->assertEquals(40, $steve->total_meetings);
        $this->assertEquals($todayStr, $steve->start_session_date->format('Y-m-d'));
        $this->assertNotNull($steve->price_master_id);

        // Sample 2: Feliza Octavia Shabrina (Online)
        $feliza = StudyClass::where('name', 'IELTS 40 Sesi - Feliza Octavia Shabrina')->first();
        $this->assertNotNull($feliza);
        $this->assertEquals('online', $feliza->type);
        $this->assertEquals('private', $feliza->category);
        $this->assertEquals(40, $feliza->total_meetings);
        $this->assertEquals($todayStr, $feliza->start_session_date->format('Y-m-d'));

        // Sample 3: Livya Fransisca Louis (Online)
        $livya = StudyClass::where('name', 'Privat 30 - Livya Fransisca Louis')->first();
        $this->assertNotNull($livya);
        $this->assertEquals('online', $livya->type);
        $this->assertEquals('private', $livya->category);
        $this->assertEquals(30, $livya->total_meetings);

        // Sample 4: Avicenna Baraka Adyatama Wibowo (Offline)
        $avicenna = StudyClass::where('name', 'TOEFL 20 Sesi - Avicenna Baraka Adyatama Wibowo')->first();
        $this->assertNotNull($avicenna);
        $this->assertEquals('offline', $avicenna->type);
        $this->assertEquals('private', $avicenna->category);
        $this->assertEquals(20, $avicenna->total_meetings);
        $this->assertEquals($todayStr, $avicenna->start_session_date->format('Y-m-d'));

        // Sample 5: Cornelia Gwen Beatrice Christabelle (Offline)
        $cornelia = StudyClass::where('name', 'Privat 10 - Cornelia Gwen Beatrice Christabelle')->first();
        $this->assertNotNull($cornelia);
        $this->assertEquals('offline', $cornelia->type);
        $this->assertEquals('private', $cornelia->category);
        $this->assertEquals(10, $cornelia->total_meetings);
        $this->assertEquals($todayStr, $cornelia->start_session_date->format('Y-m-d'));

        // 7. Verify Semarang branch classes
        $smgBranch = \App\Domains\Master\Domain\Models\Branch::where('code', 'SMG')->first();
        $this->assertNotNull($smgBranch);

        // Total Semarang classes: 19 group + 53 private = 72 classes
        $this->assertEquals(72, StudyClass::where('branch_id', $smgBranch->id)->count());
        $this->assertEquals(19, StudyClass::where('branch_id', $smgBranch->id)->where('category', '!=', 'private')->count());
        $this->assertEquals(53, StudyClass::where('branch_id', $smgBranch->id)->where('category', 'private')->count());

        // Sample Semarang Group: Nayya & Co (Kids)
        $nayya = StudyClass::where('branch_id', $smgBranch->id)->where('name', 'Nayya & Co')->first();
        $this->assertNotNull($nayya);
        $this->assertEquals('offline', $nayya->type);
        $this->assertEquals('Kids', $nayya->category);
        $this->assertEquals(['Wednesday', 'Friday'], $nayya->schedule_days);

        // Sample Semarang Group: Mateo & Co (Teens)
        $mateo = StudyClass::where('branch_id', $smgBranch->id)->where('name', 'Mateo & Co')->first();
        $this->assertNotNull($mateo);
        $this->assertEquals('offline', $mateo->type);
        $this->assertEquals('Teens', $mateo->category);
        $this->assertEquals(3, $mateo->current_session_number);
        $this->assertEquals(['Tuesday', 'Thursday'], $mateo->schedule_days);
        $this->assertEquals('2026-06-23', $mateo->start_session_date->format('Y-m-d'));
        $this->assertEquals('2026-09-10', $mateo->end_session_date->format('Y-m-d'));

        // Sample Semarang Group: Brooklyn & Co (Adult)
        $brooklyn = StudyClass::where('branch_id', $smgBranch->id)->where('name', 'Brooklyn & Co')->first();
        $this->assertNotNull($brooklyn);
        $this->assertEquals('offline', $brooklyn->type);
        $this->assertEquals('Adult', $brooklyn->category);
        $this->assertEquals(['Monday', 'Wednesday'], $brooklyn->schedule_days);

        // Sample Semarang Private: IELTS 40 Sesi - Hizkya Narodo
        $hizkya = StudyClass::where('branch_id', $smgBranch->id)->where('name', 'IELTS 40 Sesi - Hizkya Narodo')->first();
        $this->assertNotNull($hizkya);
        $this->assertEquals('offline', $hizkya->type);
        $this->assertEquals('private', $hizkya->category);
        $this->assertEquals(40, $hizkya->total_meetings);

        // Sample Semarang Private: Privat 30 - Bawa Adiwinarno
        $bawa = StudyClass::where('branch_id', $smgBranch->id)->where('name', 'Privat 30 - Bawa Adiwinarno')->first();
        $this->assertNotNull($bawa);
        $this->assertEquals('offline', $bawa->type);
        $this->assertEquals('private', $bawa->category);
        $this->assertEquals(30, $bawa->total_meetings);

        // Sample Semarang Semi-Private: Semi Private - Keisha Aretha Azalea
        $keisha = StudyClass::where('branch_id', $smgBranch->id)->where('name', 'Semi Private - Keisha Aretha Azalea')->first();
        $this->assertNotNull($keisha);
        $this->assertEquals('offline', $keisha->type);
        $this->assertEquals('private', $keisha->category);
    }
}
