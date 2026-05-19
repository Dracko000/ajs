<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('driver_manifests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['pickup', 'dropoff']); // Berangkat / Pulang
            $table->time('scheduled_at');
            $table->integer('day_of_week'); // 1 = Senin, 5 = Jumat
            $table->enum('status', ['scheduled', 'picked_up', 'arrived', 'absent'])->default('scheduled');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('driver_manifests');
    }
};
