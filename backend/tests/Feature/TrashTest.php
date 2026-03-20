<?php

namespace Tests\Feature;

use App\Models\JournalEntry;
use App\Models\Mood;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TrashTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Mood $mood;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->mood = Mood::firstOrCreate(
            ['value' => 5],
            ['label' => 'great', 'emoji' => '🤩']
        );
    }

    /**
     * Helper to create an entry for this user.
     */
    private function createEntry(string $date): JournalEntry
    {
        return JournalEntry::factory()->create([
            'user_id'    => $this->user->id,
            'mood_id'    => $this->mood->id,
            'entry_date' => $date,
            'content'    => 'A journal entry.',
        ]);
    }

    /** Deleting an entry soft-deletes it (sets deleted_at, does NOT remove from DB). */
    public function test_deleting_entry_soft_deletes_it()
    {
        $date = Carbon::today()->toDateString();
        $this->createEntry($date);

        $this->actingAs($this->user, 'sanctum')->deleteJson("/api/v1/entries/{$date}")
             ->assertStatus(204);

        // Row still exists in DB but has a deleted_at timestamp
        $this->assertSoftDeleted('journal_entries', [
            'user_id'    => $this->user->id,
            'entry_date' => $date,
        ]);
    }

    /** Soft-deleted entry no longer appears in the normal entries list. */
    public function test_soft_deleted_entry_is_excluded_from_entry_list()
    {
        $date = Carbon::today()->toDateString();
        $entry = $this->createEntry($date);
        $entry->delete(); // soft delete

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/entries');
        $response->assertStatus(200);

        // The trashed entry should not appear in the main list
        $ids = collect($response->json('data') ?? $response->json())->pluck('id');
        $this->assertNotContains($entry->id, $ids);
    }

    /** Trashed entries appear in GET /trash. */
    public function test_user_can_list_trashed_entries()
    {
        $date = Carbon::today()->toDateString();
        $entry = $this->createEntry($date);
        $entry->delete();

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/trash');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonPath('0.id', $entry->id);
    }

    /** Restoring a trashed entry makes it live again. */
    public function test_user_can_restore_a_trashed_entry()
    {
        $date = Carbon::today()->toDateString();
        $entry = $this->createEntry($date);
        $entry->delete();

        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/v1/trash/{$date}/restore");

        $response->assertStatus(200)
                 ->assertJsonPath('id', $entry->id);

        // Confirm it's no longer soft-deleted
        $this->assertDatabaseHas('journal_entries', [
            'id'         => $entry->id,
            'deleted_at' => null,
        ]);
    }

    /** Cannot restore a trashed entry if a live entry already exists for that date. */
    public function test_restore_conflicts_with_existing_live_entry()
    {
        $date = Carbon::today()->toDateString();

        // Create an entry and trash it
        $trashed = $this->createEntry($date);
        $trashed->delete();

        // Now create a new live entry for the same date (using yesterday's for conflict-free creation)
        $yesterday = Carbon::yesterday()->toDateString();
        $trashed2 = $this->createEntry($yesterday);
        $trashed2->delete();

        // Create a fresh live entry for today
        $this->createEntry($date);

        // Try to restore the trashed one → should conflict
        $response = $this->actingAs($this->user, 'sanctum')
                         ->postJson("/api/v1/trash/{$date}/restore");

        $response->assertStatus(409)
                 ->assertJsonPath('message', 'Cannot restore: an entry already exists for this date.');
    }

    /** Force-deleting a trashed entry permanently removes it. */
    public function test_user_can_force_delete_a_trashed_entry()
    {
        $date = Carbon::today()->toDateString();
        $entry = $this->createEntry($date);
        $entry->delete();

        $this->actingAs($this->user, 'sanctum')
             ->deleteJson("/api/v1/trash/{$date}")
             ->assertStatus(204);

        // Confirm it's completely gone (even with trashed check)
        $this->assertDatabaseMissing('journal_entries', ['id' => $entry->id]);
    }

    /** A user cannot force-delete another user's trashed entry. */
    public function test_user_cannot_access_another_users_trash()
    {
        $otherUser = User::factory()->create();
        $date = Carbon::today()->toDateString();

        $entry = JournalEntry::factory()->create([
            'user_id'    => $otherUser->id,
            'mood_id'    => $this->mood->id,
            'entry_date' => $date,
        ]);
        $entry->delete();

        // Our user tries to restore another user's entry
        $this->actingAs($this->user, 'sanctum')
             ->postJson("/api/v1/trash/{$date}/restore")
             ->assertStatus(404);
    }
}
