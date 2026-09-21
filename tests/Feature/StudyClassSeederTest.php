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

        // 1. Total imported classes: 61 group + 121 private = 182 classes
        $this->assertEquals(182, StudyClass::count());

        // 2. Offline classes: 54 group + 82 private = 136
        $this->assertEquals(136, StudyClass::where('type', 'offline')->count());

        // 3. Online classes: 7 group + 39 private = 46
        $this->assertEquals(46, StudyClass::where('type', 'online')->count());

        // 4. Categories: Kids: 26, Teens: 22, Adult: 13, Private: 121
        $this->assertEquals(26, StudyClass::where('category', 'Kids')->count());
        $this->assertEquals(22, StudyClass::where('category', 'Teens')->count());
        $this->assertEquals(13, StudyClass::where('category', 'Adult')->count());
        $this->assertEquals(121, StudyClass::where('category', 'private')->count());

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
    }
}
