<?php

namespace Tests\Feature;

use App\Models\JournalEntry;
use App\Models\Mood;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TagTest extends TestCase
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

    private function createEntry(string $date): JournalEntry
    {
        return JournalEntry::factory()->create([
            'user_id'    => $this->user->id,
            'mood_id'    => $this->mood->id,
            'entry_date' => $date,
            'content'    => 'A test entry.',
        ]);
    }

    /** User can create a new tag. */
    public function test_user_can_create_a_tag()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/tags', ['name' => 'Fitness']);

        $response->assertStatus(201)
                 ->assertJsonPath('name', 'fitness')    // normalized to lowercase
                 ->assertJsonPath('slug', 'fitness');

        $this->assertDatabaseHas('tags', ['user_id' => $this->user->id, 'slug' => 'fitness']);
    }

    /** Creating a tag with the same slug returns the existing tag (not an error). */
    public function test_duplicate_tag_returns_existing()
    {
        $this->actingAs($this->user, 'sanctum')->postJson('/api/v1/tags', ['name' => 'coding']);
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/v1/tags', ['name' => 'Coding']);

        $response->assertStatus(200); // not 201 — already existed
        $this->assertDatabaseCount('tags', 1);
    }

    /** User can list all their tags. */
    public function test_user_can_list_tags()
    {
        Tag::create(['user_id' => $this->user->id, 'name' => 'work', 'slug' => 'work']);
        Tag::create(['user_id' => $this->user->id, 'name' => 'health', 'slug' => 'health']);

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/tags');

        $response->assertStatus(200)->assertJsonCount(2);
    }

    /** User can rename a tag. */
    public function test_user_can_rename_a_tag()
    {
        $tag = Tag::create(['user_id' => $this->user->id, 'name' => 'work', 'slug' => 'work']);

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/tags/{$tag->id}", ['name' => 'career']);

        $response->assertStatus(200)->assertJsonPath('slug', 'career');
        $this->assertDatabaseHas('tags', ['id' => $tag->id, 'slug' => 'career']);
    }

    /** User can delete a tag. */
    public function test_user_can_delete_a_tag()
    {
        $tag = Tag::create(['user_id' => $this->user->id, 'name' => 'work', 'slug' => 'work']);

        $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/tags/{$tag->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('tags', ['id' => $tag->id]);
    }

    /** Tags can be attached to an entry on creation. */
    public function test_user_can_create_entry_with_tags()
    {
        $tag = Tag::create(['user_id' => $this->user->id, 'name' => 'fitness', 'slug' => 'fitness']);

        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/v1/entries', [
            'mood_id'    => $this->mood->id,
            'entry_date' => Carbon::today()->toDateString(),
            'content'    => 'I went for a run.',
            'tag_ids'    => [$tag->id],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('entry_tags', [
            'journal_entry_id' => $response->json('id'),
            'tag_id'           => $tag->id,
        ]);
    }

    /** Tags update correctly via patch. */
    public function test_user_can_update_entry_tags()
    {
        $date  = Carbon::today()->toDateString();
        $entry = $this->createEntry($date);
        $tag1  = Tag::create(['user_id' => $this->user->id, 'name' => 'old', 'slug' => 'old']);
        $tag2  = Tag::create(['user_id' => $this->user->id, 'name' => 'new', 'slug' => 'new']);
        $entry->tags()->attach($tag1->id);

        $this->actingAs($this->user, 'sanctum')->patchJson("/api/v1/entries/{$date}", [
            'tag_ids' => [$tag2->id],
        ]);

        // Old tag removed, new tag present
        $this->assertDatabaseMissing('entry_tags', ['journal_entry_id' => $entry->id, 'tag_id' => $tag1->id]);
        $this->assertDatabaseHas('entry_tags', ['journal_entry_id' => $entry->id, 'tag_id' => $tag2->id]);
    }

    /** Filtering entries by tag returns only matching entries. */
    public function test_user_can_filter_entries_by_tag()
    {
        $tag     = Tag::create(['user_id' => $this->user->id, 'name' => 'dev', 'slug' => 'dev']);
        $tagged  = $this->createEntry(Carbon::today()->toDateString());
        $untagged = $this->createEntry(Carbon::yesterday()->toDateString());
        $tagged->tags()->attach($tag->id);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/entries?tags[]={$tag->id}");

        $response->assertStatus(200);
        $ids = collect($response->json('data') ?? $response->json())->pluck('id');
        $this->assertContains($tagged->id, $ids);
        $this->assertNotContains($untagged->id, $ids);
    }

    /** A user cannot delete another user's tag. */
    public function test_user_cannot_delete_another_users_tag()
    {
        $other = User::factory()->create();
        $tag   = Tag::create(['user_id' => $other->id, 'name' => 'private', 'slug' => 'private']);

        $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/tags/{$tag->id}")
            ->assertStatus(404);
    }

    /** Deleting a tag detaches it from all entries. */
    public function test_deleting_tag_removes_entry_associations()
    {
        $tag   = Tag::create(['user_id' => $this->user->id, 'name' => 'temp', 'slug' => 'temp']);
        $entry = $this->createEntry(Carbon::today()->toDateString());
        $entry->tags()->attach($tag->id);

        $this->actingAs($this->user, 'sanctum')->deleteJson("/api/v1/tags/{$tag->id}");

        // The entry_tags pivot row should be gone
        $this->assertDatabaseMissing('entry_tags', ['tag_id' => $tag->id]);
        // But the entry itself must still exist
        $this->assertDatabaseHas('journal_entries', ['id' => $entry->id]);
    }
}
