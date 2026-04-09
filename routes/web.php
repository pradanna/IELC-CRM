<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Webhooks\WhatsappWebhookController;
use App\Http\Controllers\Admin\CRM\PtExamController;
use App\Http\Controllers\Admin\CRM\PtQuestionController;
use App\Http\Controllers\Admin\CRM\PtQuestionGroupController;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Webhook WhatsApp (Public)
Route::post('/webhook/whatsapp/inbound', [WhatsappWebhookController::class, 'handleIncomingMessage'])->name('webhooks.whatsapp.inbound');

// Public Placement Test
Route::get('/placement-test/{token}', [\App\Http\Controllers\Crm\PtExam\PublicPlacementTestController::class, 'show'])->name('public.placement-test.show');
Route::post('/placement-test/{token}/start', [\App\Http\Controllers\Crm\PtExam\PublicPlacementTestController::class, 'start'])->name('public.placement-test.start');
Route::get('/placement-test/{token}/exam', [\App\Http\Controllers\Crm\PtExam\PublicPlacementTestController::class, 'exam'])->name('public.placement-test.exam');
Route::post('/placement-test/{token}/submit', [\App\Http\Controllers\Crm\PtExam\PublicPlacementTestController::class, 'submit'])->name('public.placement-test.submit');
Route::get('/placement-test/{token}/result', [\App\Http\Controllers\Crm\PtExam\PublicPlacementTestController::class, 'result'])->name('public.placement-test.result');

// Public Lead Registration
Route::get('/join/{branch}', [\App\Http\Controllers\Public\PublicLeadController::class, 'welcome'])->name('public.join.welcome');
Route::get('/join/{branch}/form', [\App\Http\Controllers\Public\PublicLeadController::class, 'form'])->name('public.join.form');
Route::get('/join/api/cities', [\App\Http\Controllers\Public\PublicLeadController::class, 'getCities'])->name('public.join.cities');
Route::post('/join', [\App\Http\Controllers\Public\PublicLeadController::class, 'store'])->name('public.join.store');

// Self-filling for Existing Leads
Route::get('/fill-data/{token}', [\App\Http\Controllers\Public\PublicLeadController::class, 'fillingForm'])->name('public.join.filling');
Route::post('/fill-data/{token}', [\App\Http\Controllers\Public\PublicLeadController::class, 'submitFilling'])->name('public.join.filling.submit');

// Public Invoice View
Route::get('/invoice/{id}', [\App\Http\Controllers\Public\PublicLeadController::class, 'downloadInvoice'])->name('public.invoice.download');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index'])->name('dashboard');

    // CRM Leads
    Route::get('/crm/leads', [\App\Http\Controllers\Admin\CRM\CrmDashboardController::class, 'index'])->name('crm.leads.index');
    Route::get('/crm/leads/list', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'index'])->name('crm.leads.list');
    Route::get('/crm/leads/kanban', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'kanban'])->name('crm.leads.kanban');
    Route::get('/crm/leads/quick-search', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'quickSearch'])->name('crm.leads.quick-search');
    Route::get('/crm/leads/relatables', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'getRelatables'])->name('crm.leads.relatables');
    Route::get('/crm/leads/{lead}', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'show'])->name('crm.leads.show');
    Route::get('/crm/leads/{lead}/activities', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'activities'])->name('crm.leads.activities');
    Route::put('/crm/leads/{lead}', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'update'])->name('crm.leads.update');
    Route::patch('/crm/leads/{lead}/phase', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'updatePhase'])->name('crm.leads.update-phase');
    Route::post('/crm/leads/{lead}/plot-class', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'plotClass'])->name('crm.leads.plot-class');
    Route::patch('/crm/leads/{lead}/record-followup', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'recordFollowUp'])->name('crm.leads.record-followup');
    Route::patch('/crm/leads/{lead}/reset-followup', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'resetFollowUp'])->name('crm.leads.reset-followup');
    Route::delete('/crm/leads/{lead}', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'destroy'])->name('crm.leads.destroy');
    Route::post('/crm/leads/{lead}/send-template', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'sendTemplate'])->name('crm.leads.send-template');
    Route::post('/crm/leads/{lead}/send-whatsapp', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'sendMessage'])->name('crm.leads.send-whatsapp');
    Route::post('/crm/leads/{lead}/store-consultation', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'storeConsultation'])->name('crm.leads.store-consultation');
    Route::post('/crm/leads', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'store'])->name('crm.leads.store');
    Route::get('/crm/cities', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'getCities'])->name('crm.cities');
    Route::post('/crm/leads/{lead}/approve-updates', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'approveUpdates'])->name('crm.leads.approve-updates');
    Route::post('/crm/leads/{lead}/reject-updates', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'rejectUpdates'])->name('crm.leads.reject-updates');

    // Registration Inbox (Admin Approval)
    Route::get('/crm/registrations', [\App\Http\Controllers\Admin\CRM\RegistrationApprovalController::class, 'index'])->name('crm.registrations.index');
    Route::post('/crm/registrations/{registration}/approve', [\App\Http\Controllers\Admin\CRM\RegistrationApprovalController::class, 'approve'])->name('crm.registrations.approve');
    Route::post('/crm/registrations/{registration}/reject', [\App\Http\Controllers\Admin\CRM\RegistrationApprovalController::class, 'reject'])->name('crm.registrations.reject');
    
    // Self-filling Updates Approval
    Route::post('/crm/registrations/{lead}/approve-update', [\App\Http\Controllers\Admin\CRM\RegistrationApprovalController::class, 'approveUpdate'])->name('crm.registrations.approve-update');
    Route::post('/crm/registrations/{lead}/reject-update', [\App\Http\Controllers\Admin\CRM\RegistrationApprovalController::class, 'rejectUpdate'])->name('crm.registrations.reject-update');

    // Placement Tests
    Route::get('/crm/pt-sessions', [\App\Http\Controllers\Admin\CRM\PtSessionController::class, 'index'])->name('crm.pt-sessions.index');
    Route::post('/crm/pt-sessions', [\App\Http\Controllers\Admin\CRM\PtSessionController::class, 'store'])->name('crm.pt-sessions.store');
    Route::delete('/crm/pt-sessions/{pt_session}', [\App\Http\Controllers\Admin\CRM\PtSessionController::class, 'destroy'])->name('crm.pt-sessions.destroy');

    // Academic Module
    Route::group(['prefix' => 'academic', 'as' => 'academic.'], function () {
        Route::resource('study-classes', \App\Http\Controllers\Admin\Academic\StudyClassController::class);
        Route::post('study-classes/{study_class}/reset-cycle', [\App\Http\Controllers\Admin\Academic\StudyClassController::class, 'resetCycle'])->name('study-classes.reset-cycle');
        Route::post('study-classes/{study_class}/enroll', [\App\Http\Controllers\Admin\Academic\StudentController::class, 'enroll'])->name('study-classes.enroll');
        Route::delete('study-classes/{study_class}/unenroll/{student}', [\App\Http\Controllers\Admin\Academic\StudentController::class, 'unenroll'])->name('study-classes.unenroll');

        Route::get('students/search', [\App\Http\Controllers\Admin\Academic\StudentController::class, 'search'])->name('students.search');
        Route::resource('students', \App\Http\Controllers\Admin\Academic\StudentController::class);
        Route::post('leads/{lead}/promote', [\App\Http\Controllers\Admin\Academic\StudentController::class, 'promoteFromLead'])->name('students.promote');
    });

    // Finance Module
    Route::group(['prefix' => 'finance', 'as' => 'finance.'], function () {
        Route::get('/dashboard', [\App\Http\Controllers\Admin\Finance\FinanceController::class, 'index'])->name('dashboard');
        Route::post('/invoices/generate', [\App\Http\Controllers\Admin\Finance\FinanceController::class, 'generate'])->name('invoices.generate');
        Route::post('/invoices/{invoice}/pay', [\App\Http\Controllers\Admin\Finance\FinanceController::class, 'pay'])->name('invoices.pay');
        Route::get('/invoices/{invoice}/download', [\App\Http\Controllers\Admin\Finance\FinanceController::class, 'download'])->name('invoices.download');
        
        Route::resource('price-masters', \App\Http\Controllers\Admin\Finance\PriceMasterController::class);
    });

    // Add others as placeholders for now
    // Placement Tests Management
    Route::prefix('placement-tests')->name('placement-tests.')->group(function () {
        Route::get('/', [PtExamController::class, 'index'])->name('index');
        Route::post('/', [PtExamController::class, 'store'])->name('store');
        Route::get('/{pt_exam}', [PtExamController::class, 'show'])->name('show');
        Route::put('/{pt_exam}', [PtExamController::class, 'update'])->name('update');
        Route::delete('/{pt_exam}', [PtExamController::class, 'destroy'])->name('destroy');

        // Questions within Exam
        Route::post('/{pt_exam}/questions', [PtQuestionController::class, 'store'])->name('questions.store');
        Route::post('/{pt_exam}/questions/{pt_question}', [PtQuestionController::class, 'update'])->name('questions.update'); // Using POST for file upload compatibility
        Route::delete('/{pt_exam}/questions/{pt_question}', [PtQuestionController::class, 'destroy'])->name('questions.destroy');

        // Question Groups within Exam
        Route::post('/{pt_exam}/question-groups', [PtQuestionGroupController::class, 'store'])->name('question-groups.store');
        Route::post('/{pt_exam}/question-groups/{pt_question_group}', [PtQuestionGroupController::class, 'update'])->name('question-groups.update'); // Using POST for file upload compatibility
        Route::delete('/{pt_exam}/question-groups/{pt_question_group}', [PtQuestionGroupController::class, 'destroy'])->name('question-groups.destroy');
    });
    // Master Data
    Route::get('/master/users', [\App\Http\Controllers\Admin\Master\UserController::class, 'index'])->name('master.users.index');
    Route::post('/master/users', [\App\Http\Controllers\Admin\Master\UserController::class, 'store'])->name('master.users.store');
    Route::put('/master/users/{user}', [\App\Http\Controllers\Admin\Master\UserController::class, 'update'])->name('master.users.update');
    Route::delete('/master/users/{user}', [\App\Http\Controllers\Admin\Master\UserController::class, 'destroy'])->name('master.users.destroy');

    Route::get('/master', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'index'])->name('master.index');
    Route::post('/master/lead-types', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'storeLeadType'])->name('master.lead-types.store');
    Route::put('/master/lead-types/{leadType}', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'updateLeadType'])->name('master.lead-types.update');
    Route::delete('/master/lead-types/{leadType}', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'destroyLeadType'])->name('master.lead-types.destroy');
    Route::post('/master/lead-phases', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'storeLeadPhase'])->name('master.lead-phases.store');
    Route::put('/master/lead-phases/{leadPhase}', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'updateLeadPhase'])->name('master.lead-phases.update');
    Route::delete('/master/lead-phases/{leadPhase}', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'destroyLeadPhase'])->name('master.lead-phases.destroy');
    Route::post('/master/lead-sources', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'storeLeadSource'])->name('master.lead-sources.store');
    Route::put('/master/lead-sources/{leadSource}', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'updateLeadSource'])->name('master.lead-sources.update');
    Route::delete('/master/lead-sources/{leadSource}', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'destroyLeadSource'])->name('master.lead-sources.destroy');

    Route::post('/master/monthly-targets', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'storeMonthlyTarget'])->name('master.monthly-targets.store');
    Route::put('/master/monthly-targets/{monthlyTarget}', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'updateMonthlyTarget'])->name('master.monthly-targets.update');
    Route::delete('/master/monthly-targets/{monthlyTarget}', [\App\Http\Controllers\Admin\Master\MasterDataController::class, 'destroyMonthlyTarget'])->name('master.monthly-targets.destroy');
    
    // Chat Templates
    Route::post('/master/chat-templates', [\App\Http\Controllers\Admin\Master\ChatTemplateController::class, 'store'])->name('master.chat-templates.store');
    Route::put('/master/chat-templates/{chatTemplate}', [\App\Http\Controllers\Admin\Master\ChatTemplateController::class, 'update'])->name('master.chat-templates.update');
    Route::delete('/master/chat-templates/{chatTemplate}', [\App\Http\Controllers\Admin\Master\ChatTemplateController::class, 'destroy'])->name('master.chat-templates.destroy');

    // Media Assets
    Route::post('/master/media-assets', [\App\Http\Controllers\Admin\Master\MediaAssetController::class, 'store'])->name('master.media-assets.store');
    Route::delete('/master/media-assets/{mediaAsset}', [\App\Http\Controllers\Admin\Master\MediaAssetController::class, 'destroy'])->name('master.media-assets.destroy');
    
    // WhatsApp Proxy
    Route::prefix('whatsapp')->name('whatsapp.')->group(function () {
        Route::get('/status/{branch}', [\App\Http\Controllers\Admin\WhatsAppController::class, 'getStatus'])->name('status');
        Route::get('/history/{branch}/{phone}', [\App\Http\Controllers\Admin\WhatsAppController::class, 'getHistory'])->name('history');
        Route::post('/send', [\App\Http\Controllers\Admin\WhatsAppController::class, 'sendMessage'])->name('send');
    });

    Route::get('/study-classes', fn() => Inertia::render('Dashboard'))->name('study-classes.index');
    Route::get('/schedules', fn() => Inertia::render('Dashboard'))->name('schedules.index');
    Route::get('/attendances', fn() => Inertia::render('Dashboard'))->name('attendances.index');
    Route::get('/academic', fn() => Inertia::render('Dashboard'))->name('academic.index');
    Route::get('/teachers', fn() => Inertia::render('Dashboard'))->name('teachers.index');
    Route::get('/students', fn() => Inertia::render('Dashboard'))->name('students.index');
});

require __DIR__.'/auth.php';
