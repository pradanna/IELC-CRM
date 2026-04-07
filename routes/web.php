<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('dashboard');
});

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
    Route::patch('/crm/leads/{lead}/record-followup', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'recordFollowUp'])->name('crm.leads.record-followup');
    Route::patch('/crm/leads/{lead}/reset-followup', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'resetFollowUp'])->name('crm.leads.reset-followup');
    Route::delete('/crm/leads/{lead}', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'destroy'])->name('crm.leads.destroy');
    Route::post('/crm/leads', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'store'])->name('crm.leads.store');
    Route::get('/crm/cities', [\App\Http\Controllers\Admin\CRM\LeadController::class, 'getCities'])->name('crm.cities');

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
    Route::get('/placement-tests', fn() => Inertia::render('Dashboard'))->name('placement-tests.index');
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
    Route::get('/study-classes', fn() => Inertia::render('Dashboard'))->name('study-classes.index');
    Route::get('/schedules', fn() => Inertia::render('Dashboard'))->name('schedules.index');
    Route::get('/attendances', fn() => Inertia::render('Dashboard'))->name('attendances.index');
    Route::get('/academic', fn() => Inertia::render('Dashboard'))->name('academic.index');
    Route::get('/teachers', fn() => Inertia::render('Dashboard'))->name('teachers.index');
    Route::get('/students', fn() => Inertia::render('Dashboard'))->name('students.index');
});

require __DIR__.'/auth.php';
