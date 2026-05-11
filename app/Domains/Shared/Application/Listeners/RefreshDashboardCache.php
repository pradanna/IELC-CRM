<?php

namespace App\Domains\Shared\Application\Listeners;

use App\Domains\Finance\Domain\Events\InvoiceGenerated;
use Illuminate\Support\Facades\Cache;

class RefreshDashboardCache
{
    public function handle(InvoiceGenerated $event): void
    {
        Cache::increment('crm_dashboard_version');
    }
}
