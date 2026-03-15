<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->unsignedSmallInteger('mood_id');
            $table->foreign('mood_id')->references('id')->on('moods');
            $table->date('entry_date');
            $table->text('content');
            $table->timestamps();

            // One entry per user per day — enforced at DB level
            $table->unique(['user_id', 'entry_date']);
        });

        // Fast lookups for calendar and insights queries
        DB::statement('CREATE INDEX idx_journal_entries_user_date ON journal_entries (user_id, entry_date DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
