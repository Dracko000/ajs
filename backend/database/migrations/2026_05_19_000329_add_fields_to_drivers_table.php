<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->string('status')->default('pending_verification'); // pending_verification, active, suspended, inactive
            $table->string('license_number')->nullable();
            $table->string('nik')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_account_number')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('drivers', function (Blueprint $table) {
            $table->dropColumn(['status', 'license_number', 'nik', 'bank_name', 'bank_account_number']);
        });
    }
};
