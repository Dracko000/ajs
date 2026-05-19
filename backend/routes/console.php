<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Jadwalkan pemotongan biaya SaaS setiap hari Senin jam 00:00
Schedule::command('ajs:deduct-saas-fee')->mondays()->at('00:00');
