<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$users = ['test@test.com', 'bagassukma999@gmail.com', 'test2@test.com'];

foreach ($users as $email) {
    $user = User::where('email', $email)->first();
    if ($user) {
        $user->password = Hash::make('password123');
        $user->save();
        echo "Password for $email reset to password123\n";
    }
}
