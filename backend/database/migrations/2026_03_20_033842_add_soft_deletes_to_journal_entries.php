<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->softDeletes(); // adds nullable `deleted_at` TIMESTAMPTZ column
        });

        // Drop the old unique constraint — it applies to ALL rows including soft-deleted ones
        // and would prevent restoring an entry if another entry was created for the same date
        DB::statement('ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_user_id_entry_date_unique');

        // Add a PARTIAL unique index: only enforce uniqueness on NON-deleted rows
        DB::statement('CREATE UNIQUE INDEX journal_entries_user_date_active_unique ON journal_entries (user_id, entry_date) WHERE deleted_at IS NULL');

        // Index for fast Trash page queries (e.g., filter onlyTrashed efficiently)
        DB::statement('CREATE INDEX idx_journal_entries_deleted_at ON journal_entries (user_id, deleted_at) WHERE deleted_at IS NOT NULL');
    }

    public function down(): void
    {
        // Reverse the partial unique index
        DB::statement('DROP INDEX IF EXISTS journal_entries_user_date_active_unique');
        DB::statement('DROP INDEX IF EXISTS idx_journal_entries_deleted_at');

        // Restore the original simple unique constraint
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->unique(['user_id', 'entry_date']);
            $table->dropSoftDeletes();
        });
    }
};
