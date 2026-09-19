<?php

namespace App\Providers;

use App\Domains\CRM\Domain\Models\Lead;
use App\Observers\LeadObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        if (config('app.env') !== 'local') {
            URL::forceScheme('https');
        }

        // WhatsApp Rate Limiter (Anti-spam / Anti-ban): Max 20 messages per minute per user/IP
        RateLimiter::for('whatsapp-send', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();
            return Limit::perMinute(20)->by($key)->response(function () {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Terlalu banyak pesan dikirim dalam waktu singkat. Mohon tunggu beberapa detik untuk menghindari blokir WhatsApp.'
                ], 429);
            });
        });

        Lead::observe(LeadObserver::class);

        // Finance Domain Events
        \Illuminate\Support\Facades\Event::listen(
            \App\Domains\Finance\Domain\Events\InvoiceGenerated::class,
            \App\Domains\CRM\Application\Listeners\UpdateLeadPhaseOnInvoiceGenerated::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Domains\Finance\Domain\Events\InvoiceGenerated::class,
            \App\Domains\Finance\Application\Listeners\SendInvoiceNotification::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Domains\Finance\Domain\Events\InvoiceGenerated::class,
            \App\Domains\Shared\Application\Listeners\RefreshDashboardCache::class
        );

        // Invoice Paid Events
        \Illuminate\Support\Facades\Event::listen(
            \App\Domains\Finance\Domain\Events\InvoicePaid::class,
            \App\Domains\CRM\Application\Listeners\PromoteLeadOnInvoicePaid::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Domains\Finance\Domain\Events\InvoicePaid::class,
            \App\Domains\CRM\Application\Listeners\CreateLeadEnrollmentOnInvoicePaid::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Domains\Finance\Domain\Events\InvoicePaid::class,
            \App\Domains\Finance\Application\Listeners\SendInvoicePaidNotification::class
        );
    }
}
