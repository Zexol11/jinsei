<?php

namespace Tests\Feature;

use App\Models\JournalEntry;
use App\Models\Mood;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class JournalEntryTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Mood $mood;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        
        // Moods are seeded in the migration, but in RefreshDatabase we might need to seed them manually if not seeded.
        // Let's create one just in case tests run in an empty DB.
        $this->mood = Mood::firstOrCreate(
            ['value' => 5],
            ['label' => 'great', 'emoji' => '🤩']
        );
    }

    public function test_user_can_create_an_entry()
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/v1/entries', [
            'mood_id' => $this->mood->id,
            'entry_date' => Carbon::today()->toDateString(),
            'content' => 'This is a test entry.',
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('content', 'This is a test entry.');

        $this->assertDatabaseHas('journal_entries', [
            'user_id' => $this->user->id,
            'entry_date' => Carbon::today()->toDateString(),
        ]);
    }

    public function test_user_cannot_create_two_entries_on_the_same_day()
    {
        $date = Carbon::today()->toDateString();

        JournalEntry::factory()->create([
            'user_id' => $this->user->id,
            'mood_id' => $this->mood->id,
            'entry_date' => $date,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/v1/entries', [
            'mood_id' => $this->mood->id,
            'entry_date' => $date,
            'content' => 'Another entry on the same day.',
        ]);

        $response->assertStatus(422)
                 ->assertJsonPath('message', 'An entry already exists for this date.');
    }

    public function test_user_can_update_an_existing_entry()
    {
        $date = Carbon::today()->toDateString();

        JournalEntry::factory()->create([
            'user_id' => $this->user->id,
            'mood_id' => $this->mood->id,
            'entry_date' => $date,
            'content' => 'Old content',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->patchJson("/api/v1/entries/{$date}", [
            'content' => 'Updated content',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('content', 'Updated content');

        $this->assertDatabaseHas('journal_entries', [
            'user_id' => $this->user->id,
            'content' => 'Updated content',
        ]);
    }

    public function test_user_can_get_entry_by_date()
    {
        $date = Carbon::today()->toDateString();

        JournalEntry::factory()->create([
            'user_id' => $this->user->id,
            'mood_id' => $this->mood->id,
            'entry_date' => $date,
            'content' => 'My secret journal',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson("/api/v1/entries/{$date}");

        $response->assertStatus(200)
                 ->assertJsonPath('content', 'My secret journal');
    }

    public function test_user_can_delete_an_entry()
    {
        $date = Carbon::today()->toDateString();

        JournalEntry::factory()->create([
            'user_id' => $this->user->id,
            'mood_id' => $this->mood->id,
            'entry_date' => $date,
        ]);

        $this->assertDatabaseCount('journal_entries', 1);

        $response = $this->actingAs($this->user, 'sanctum')->deleteJson("/api/v1/entries/{$date}");

        $response->assertStatus(204);
        $this->assertDatabaseCount('journal_entries', 0);
    }
}
