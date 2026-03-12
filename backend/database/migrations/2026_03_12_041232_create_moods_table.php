<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('moods', function (Blueprint $table) {
            $table->smallIncrements('id');
            $table->string('label', 20)->notNull();
            $table->string('emoji', 10)->notNull();
            $table->smallInteger('value')->notNull();
        });

        // Seed the moods reference data
        DB::table('moods')->insert([
            ['label' => 'terrible', 'emoji' => '😔', 'value' => 1],
            ['label' => 'bad',      'emoji' => '😐', 'value' => 2],
            ['label' => 'okay',     'emoji' => '🙂', 'value' => 3],
            ['label' => 'good',     'emoji' => '😄', 'value' => 4],
            ['label' => 'great',    'emoji' => '🤩', 'value' => 5],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('moods');
    }
};
