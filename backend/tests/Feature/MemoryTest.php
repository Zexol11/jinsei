<?php

namespace Tests\Feature;

use App\Models\JournalEntry;
use App\Models\Mood;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class MemoryTest extends TestCase
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

    private function createEntry(string $date, $userId = null): JournalEntry
    {
        return JournalEntry::factory()->create([
            'user_id'    => $userId ?? $this->user->id,
            'mood_id'    => $this->mood->id,
            'entry_date' => $date,
            'content'    => "Test entry for {$date}",
        ]);
    }

    public function test_on_this_day_returns_past_years_only()
    {
        $today = Carbon::today();
        
        // 1. Entry from exactly 1 year ago (Should be returned)
        $oneYearAgo = $this->createEntry($today->copy()->subYears(1)->toDateString());
        
        // 2. Entry from exactly 3 years ago (Should be returned)
        $threeYearsAgo = $this->createEntry($today->copy()->subYears(3)->toDateString());
        
        // 3. Entry from today (Should NOT be returned)
        $this->createEntry($today->toDateString());
        
        // 4. Entry from yesterday (Should NOT be returned)
        $this->createEntry($today->copy()->subDay()->toDateString());
        
        // 5. Entry from exactly 1 year ago, but DIFFERENT user
        $otherUser = User::factory()->create();
        $this->createEntry($today->copy()->subYears(1)->toDateString(), $otherUser->id);

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/memories/on-this-day');

        $response->assertStatus(200)
                 ->assertJsonCount(2);

        $ids = collect($response->json())->pluck('id');
        $this->assertContains($oneYearAgo->id, $ids);
        $this->assertContains($threeYearsAgo->id, $ids);
    }

    public function test_on_this_day_respects_timezone_header()
    {
        // Let's pretend the server is in UTC.
        // It is currently 2026-03-20 23:00 UTC.
        // In Manila time (UTC+8), it is 2026-03-21 07:00 (the next day!).
        Carbon::setTestNow('2026-03-20 23:00:00');

        // Manila user's "today" is March 21
        // Create an entry exactly 1 year ago according to Manila time (March 21, 2025)
        $manilaMemory = $this->createEntry('2025-03-21');
        
        // Create an entry exactly 1 year ago according to UTC time (March 20, 2025)
        $utcMemory = $this->createEntry('2025-03-20');

        // 1. Test without timezone header (defaults to server UTC)
        $responseUtc = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/memories/on-this-day');
        $responseUtc->assertStatus(200);
        $idsUtc = collect($responseUtc->json())->pluck('id');
        $this->assertContains($utcMemory->id, $idsUtc);     // Match March 20
        $this->assertNotContains($manilaMemory->id, $idsUtc);

        // 2. Test WITH Manila timezone header
        $responseManila = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/memories/on-this-day', ['X-Timezone' => 'Asia/Manila']);
        $responseManila->assertStatus(200);
        $idsManila = collect($responseManila->json())->pluck('id');
        $this->assertContains($manilaMemory->id, $idsManila); // Match March 21
        $this->assertNotContains($utcMemory->id, $idsManila);
    }

    public function test_invalid_timezone_falls_back_gracefully()
    {
        Carbon::setTestNow('2026-03-20 12:00:00');
        $memory = $this->createEntry('2025-03-20');

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/v1/memories/on-this-day', ['X-Timezone' => 'Not/Real']);

        $response->assertStatus(200)
                 ->assertJsonCount(1);
        $this->assertEquals($memory->id, $response->json(0)['id']);
    }

    public function test_soft_deleted_entries_are_excluded()
    {
        $today = Carbon::today();
        $memory = $this->createEntry($today->copy()->subYears(1)->toDateString());
        
        // Soft-delete it
        $memory->delete();

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/memories/on-this-day');

        $response->assertStatus(200)->assertJsonCount(0);
    }
}
