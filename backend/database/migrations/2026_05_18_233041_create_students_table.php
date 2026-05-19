<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('school_id')->constrained('pois')->cascadeOnDelete();
            $table->string('name');
            $table->string('class_info')->nullable(); // Contoh: Kelas 3-B
            $table->string('pickup_address');
            $table->geography('pickup_location', 'point', 4326);
            $table->time('preferred_pickup_time')->default('06:30:00');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
