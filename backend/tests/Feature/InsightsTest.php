<?php

namespace Tests\Feature;

use App\Models\JournalEntry;
use App\Models\Mood;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class InsightsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Mood $moodGood;
    private Mood $moodBad;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->user = User::factory()->create();
        
        $this->moodGood = Mood::firstOrCreate(
            ['value' => 4],
            ['label' => 'good', 'emoji' => '🙂']
        );

        $this->moodBad = Mood::firstOrCreate(
            ['value' => 2],
            ['label' => 'bad', 'emoji' => '🙁']
        );
    }

    public function test_user_can_get_insights()
    {
        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();
        $twoDaysAgo = Carbon::today()->subDays(2)->toDateString();

        // Create a 3-day streak
        JournalEntry::factory()->create([
            'user_id' => $this->user->id,
            'mood_id' => $this->moodGood->id,
            'entry_date' => $twoDaysAgo,
        ]);
        JournalEntry::factory()->create([
            'user_id' => $this->user->id,
            'mood_id' => $this->moodBad->id,
            'entry_date' => $yesterday,
        ]);
        JournalEntry::factory()->create([
            'user_id' => $this->user->id,
            'mood_id' => $this->moodGood->id,
            'entry_date' => $today,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/v1/insights');

        $response->assertStatus(200)
                 ->assertJson([
                     'total_entries' => 3,
                     'streak' => 3,
                     'max_streak' => 3,
                     'mood_distribution' => [
                         'good' => 2,
                         'bad' => 1,
                     ]
                 ])
                 ->assertJsonPath('mood_trend.6.value', 4)  // Today is at the end of the 7-day chronologically sorted window
                 ->assertJsonCount(7, 'mood_trend'); // 7 days of trend data
    }

    public function test_empty_insights_for_new_user()
    {
        $newUser = User::factory()->create();

        $response = $this->actingAs($newUser, 'sanctum')->getJson('/api/v1/insights');

        $response->assertStatus(200)
                 ->assertJson([
                     'total_entries' => 0,
                     'streak' => 0,
                     'max_streak' => 0,
                     'mood_distribution' => [],
                     'mood_trend' => [],
                 ]);
    }
}
