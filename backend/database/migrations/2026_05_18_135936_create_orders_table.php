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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('driver_id')->nullable()->constrained()->nullOnDelete();
            $table->geography('pickup_location', 'point', 4326);
            $table->geography('dropoff_location', 'point', 4326);
            $table->string('pickup_address');
            $table->string('dropoff_address');
            $table->enum('status', ['pending', 'searching', 'accepted', 'arriving', 'in-transit', 'completed', 'cancelled'])->default('pending');
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
