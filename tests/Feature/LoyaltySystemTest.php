<?php

namespace Tests\Feature;

use App\Domains\Academic\Domain\Models\Student;
use App\Domains\Academic\Domain\Models\StudyClass;
use App\Domains\CRM\Domain\Models\Lead;
use App\Domains\Finance\Domain\Models\Invoice;
use App\Domains\Finance\Domain\Models\LoyaltySetting;
use App\Domains\Finance\Domain\Models\PriceMaster;
use App\Domains\Finance\Domain\Models\StudentLoyaltyReward;
use App\Domains\Master\Domain\Models\Branch;
use App\Domains\Shared\Domain\Models\User;
use App\Domains\Finance\Application\Actions\ProcessInvoicePayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LoyaltySystemTest extends TestCase
{
    use RefreshDatabase, WithoutMiddleware;

    protected User $user;
    protected Branch $branch;
    protected PriceMaster $priceMaster;
    protected StudyClass $studyClass;
    protected Student $student;
    protected Lead $lead;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup role and user
        Role::create(['name' => 'superadmin']);
        Role::create(['name' => 'finance']);
        $this->user = User::factory()->create();
        $this->user->assignRole('finance');

        // Setup base settings
        $this->branch = Branch::create(['name' => 'Sudirman Branch', 'code' => 'SDR']);
        $this->priceMaster = PriceMaster::create(['name' => 'General Package', 'price_per_session' => 1500000]);

        $this->studyClass = StudyClass::create([
            'branch_id' => $this->branch->id,
            'price_master_id' => $this->priceMaster->id,
            'name' => 'General English Class',
            'start_session_date' => now()->subDays(10),
            'end_session_date' => now()->addDays(10),
            'total_meetings' => 24,
            'meetings_per_week' => 2,
            'current_session_number' => 1,
            'schedule_days' => ['Monday', 'Wednesday'],
        ]);

        $this->lead = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Alex Smith',
            'phone' => '081234567890',
            'email' => 'alex@example.com',
            'branch_id' => $this->branch->id,
            'owner_id' => $this->user->id,
        ]);

        $this->student = Student::create([
            'lead_id' => $this->lead->id,
            'student_number' => 'STU-9999',
            'start_join' => now()->subMonths(2),
            'status' => 'stop',
            'rejoin_count' => 1,
        ]);

        // Seed loyalty settings
        LoyaltySetting::create([
            'tier_name' => 'Silver',
            'voucher_name' => 'Ruby',
            'discount_amount' => 50000,
            'cafe_points' => 50,
            'min_rejoin_count' => 2,
        ]);
        LoyaltySetting::create([
            'tier_name' => 'Gold',
            'voucher_name' => 'Emerald',
            'discount_amount' => 100000,
            'cafe_points' => 100,
            'min_rejoin_count' => 5,
        ]);
    }

    public function test_admin_can_create_loyalty_setting(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('admin.finance.loyalty-settings.store'), [
                'tier_name' => 'Diamond Ultra',
                'voucher_name' => 'Supreme Ruby',
                'discount_amount' => 300000,
                'cafe_points' => 150000,
                'min_rejoin_count' => 15,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('loyalty_settings', [
            'tier_name' => 'Diamond Ultra',
            'voucher_name' => 'Supreme Ruby',
            'discount_amount' => 300000,
            'cafe_points' => 150000,
            'min_rejoin_count' => 15,
        ]);
    }

    public function test_admin_can_update_loyalty_setting(): void
    {
        $setting = LoyaltySetting::first();

        $response = $this->actingAs($this->user)
            ->put(route('admin.finance.loyalty-settings.update', $setting->id), [
                'tier_name' => 'Silver Super',
                'voucher_name' => 'Ruby Plus',
                'discount_amount' => 75000,
                'cafe_points' => 75000,
                'min_rejoin_count' => 3,
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('loyalty_settings', [
            'id' => $setting->id,
            'tier_name' => 'Silver Super',
            'voucher_name' => 'Ruby Plus',
            'discount_amount' => 75000,
            'cafe_points' => 75000,
            'min_rejoin_count' => 3,
        ]);
    }

    public function test_admin_can_delete_loyalty_setting(): void
    {
        $setting = LoyaltySetting::first();

        $response = $this->actingAs($this->user)
            ->delete(route('admin.finance.loyalty-settings.destroy', $setting->id));

        $response->assertRedirect();
        $this->assertDatabaseMissing('loyalty_settings', [
            'id' => $setting->id,
        ]);
    }

    public function test_paying_rejoin_invoice_increments_rejoin_count_and_awards_tier(): void
    {
        // 1. Create a rejoin invoice
        $invoice = Invoice::create([
            'invoice_number' => 'INV-TEST-001',
            'student_id' => $this->student->id,
            'lead_id' => $this->lead->id,
            'study_class_id' => $this->studyClass->id,
            'total_amount' => 1500000,
            'session_count' => 24,
            'status' => 'pending',
            'due_date' => now()->addDays(7),
        ]);

        // Mock payment action execution
        $action = resolve(ProcessInvoicePayment::class);
        $action->handle($invoice);

        // Assert Student rejoin count incremented
        $this->student->refresh();
        $this->assertEquals(2, $this->student->rejoin_count);
        $this->assertEquals('Silver', $this->student->loyalty_tier);

        // Assert StudentLoyaltyReward was issued
        $this->assertDatabaseHas('student_loyalty_rewards', [
            'student_id' => $this->student->id,
            'tier_name' => 'Silver',
            'voucher_name' => 'Ruby',
            'discount_amount' => 50000,
            'cafe_points' => 50,
            'is_used' => false,
        ]);
    }

    public function test_generating_invoice_automatically_applies_loyalty_setting_discount(): void
    {
        // Set student's rejoin count to 2, which matches the Silver tier min_rejoin_count (2)
        $this->student->update(['rejoin_count' => 2]);

        // Generate invoice without specifying discount or loyalty reward
        $response = $this->actingAs($this->user)
            ->post(route('admin.finance.invoices.generate'), [
                'student_id' => $this->student->id,
                'lead_id' => $this->lead->id,
                'study_class_id' => $this->studyClass->id,
                'price_master_id' => $this->priceMaster->id,
                'join_date' => now()->toDateString(),
                'billing_mode' => 'full',
                'notes' => 'Automatic loyalty discount test',
            ]);

        $response->assertRedirect();
        
        // Assert invoice is created with matching Silver tier discount (which is 50 in our seeder)
        $invoice = Invoice::where('student_id', $this->student->id)->latest()->first();
        $this->assertNotNull($invoice);
        
        // Silver setting has discount_amount = 50000 in our test setup
        $this->assertEquals(50000, $invoice->discount_amount);
    }

    public function test_generating_invoice_with_join_date_limit_rules(): void
    {
        // Delete previous settings to avoid interference
        LoyaltySetting::query()->delete();

        // Create a tier for old students (joined before 2020)
        LoyaltySetting::create([
            'tier_name' => 'Old Student Tier',
            'voucher_name' => 'Legacy Gold',
            'discount_amount' => 200000,
            'cafe_points' => 100,
            'min_rejoin_count' => 1,
            'use_join_date_limit' => true,
            'join_date_limit' => '2020-01-01',
            'join_date_operator' => 'before',
        ]);

        // Create a tier for new students (joined on or after 2020)
        LoyaltySetting::create([
            'tier_name' => 'New Student Tier',
            'voucher_name' => 'Modern Gold',
            'discount_amount' => 100000,
            'cafe_points' => 50,
            'min_rejoin_count' => 1,
            'use_join_date_limit' => true,
            'join_date_limit' => '2020-01-01',
            'join_date_operator' => 'after',
        ]);

        // Manually create leads to avoid factory issues
        $lead1 = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Old Student Lead',
            'phone' => '081234567891',
            'email' => 'old@example.com',
            'branch_id' => $this->branch->id,
            'owner_id' => $this->user->id,
        ]);

        $lead2 = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'New Student Lead',
            'phone' => '081234567892',
            'email' => 'new@example.com',
            'branch_id' => $this->branch->id,
            'owner_id' => $this->user->id,
        ]);

        // Case 1: Student joined in 2018 (Legacy / Before 2020)
        $legacyStudent = Student::create([
            'lead_id' => $lead1->id,
            'student_number' => 'STU-1801',
            'start_join' => '2018-05-15',
            'status' => 'active',
            'rejoin_count' => 1,
        ]);

        $this->actingAs($this->user)
            ->post(route('admin.finance.invoices.generate'), [
                'student_id' => $legacyStudent->id,
                'lead_id' => $legacyStudent->lead_id,
                'study_class_id' => $this->studyClass->id,
                'price_master_id' => $this->priceMaster->id,
                'join_date' => now()->toDateString(),
                'billing_mode' => 'full',
                'notes' => 'Legacy Student Invoice',
            ]);

        $legacyInvoice = Invoice::where('student_id', $legacyStudent->id)->latest()->first();
        $this->assertNotNull($legacyInvoice);
        $this->assertEquals(200000, $legacyInvoice->discount_amount);

        // Case 2: Student joined in 2022 (Modern / After 2020)
        $modernStudent = Student::create([
            'lead_id' => $lead2->id,
            'student_number' => 'STU-2201',
            'start_join' => '2022-08-20',
            'status' => 'active',
            'rejoin_count' => 1,
        ]);

        $this->actingAs($this->user)
            ->post(route('admin.finance.invoices.generate'), [
                'student_id' => $modernStudent->id,
                'lead_id' => $modernStudent->lead_id,
                'study_class_id' => $this->studyClass->id,
                'price_master_id' => $this->priceMaster->id,
                'join_date' => now()->toDateString(),
                'billing_mode' => 'full',
                'notes' => 'Modern Student Invoice',
            ]);

        $modernInvoice = Invoice::where('student_id', $modernStudent->id)->latest()->first();
        $this->assertNotNull($modernInvoice);
        $this->assertEquals(100000, $modernInvoice->discount_amount);
    }

    public function test_admin_can_update_sibling_settings(): void
    {
        $response = $this->actingAs($this->user)
            ->post(route('admin.finance.loyalty-settings.sibling'), [
                'use_sibling_discount' => true,
                'sibling_discount_percent' => 10,
            ]);

        $response->assertRedirect();
        
        $this->assertEquals('1', \App\Domains\Finance\Domain\Models\FinanceSetting::get('use_sibling_discount'));
        $this->assertEquals('10', \App\Domains\Finance\Domain\Models\FinanceSetting::get('sibling_discount_percent'));
    }

    public function test_generating_invoice_with_sibling_discount(): void
    {
        // 1. Enable sibling discount settings
        \App\Domains\Finance\Domain\Models\FinanceSetting::set('use_sibling_discount', '1');
        \App\Domains\Finance\Domain\Models\FinanceSetting::set('sibling_discount_percent', '10');

        // Delete loyalty settings to isolate sibling discount test
        LoyaltySetting::query()->delete();

        // 2. Create another lead (sibling)
        $siblingLead = Lead::create([
            'lead_number' => 'LT' . rand(10000, 99999),
            'name' => 'Jane Smith',
            'phone' => '081234567895',
            'email' => 'jane@example.com',
            'branch_id' => $this->branch->id,
            'owner_id' => $this->user->id,
        ]);

        // Link them as siblings in lead_relationships
        \Illuminate\Support\Facades\DB::table('lead_relationships')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'lead_id' => $this->lead->id,
            'related_lead_id' => $siblingLead->id,
            'type' => 'sibling',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 3. Generate invoice for the student (total amount base is 1,500,000, 10% is 150,000)
        $response = $this->actingAs($this->user)
            ->post(route('admin.finance.invoices.generate'), [
                'student_id' => $this->student->id,
                'lead_id' => $this->lead->id,
                'study_class_id' => $this->studyClass->id,
                'price_master_id' => $this->priceMaster->id,
                'join_date' => now()->toDateString(),
                'billing_mode' => 'full',
                'notes' => 'Sibling discount test',
            ]);

        $response->assertRedirect();

        $invoice = Invoice::where('student_id', $this->student->id)->latest()->first();
        $this->assertNotNull($invoice);
        
        // Assert invoice got Rp 150,000 sibling discount (10% of 1,500,000)
        $this->assertEquals(150000, $invoice->discount_amount);
        $this->assertStringContainsString('Diskon Sibling (10%): Rp 150.000', $invoice->discount_breakdown);
    }

    public function test_admin_can_access_finance_reports(): void
    {
        $response = $this->actingAs($this->user)
            ->get(route('admin.finance.reports.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Finance/Reports/Index')
            ->has('stats.total_revenue')
            ->has('stats.total_pending')
            ->has('stats.total_discount')
            ->has('stats.average_order_value')
            ->has('stats.new_join_revenue')
            ->has('stats.rejoin_revenue')
            ->has('stats.class_revenue')
            ->has('stats.monthly_trend')
        );
    }
}
