<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::where('email', 'test2@test.com')->first();
if ($user) {
    $user->role = 'driver';
    $user->save();
    $user->driver()->updateOrCreate(
        ['user_id' => $user->id],
        [
            'nik' => '1234567890123456',
            'vehicle_number' => 'B 1234 AJS',
            'vehicle_model' => 'Vario 150',
            'status' => 'active'
        ]
    );
    echo "User test2@test.com is now an ACTIVE DRIVER\n";
}
