<?php

namespace Database\Factories;

use App\Models\Mood;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\JournalEntry>
 */
class JournalEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'mood_id' => Mood::factory(),
            'entry_date' => $this->faker->date(),
            'content' => $this->faker->paragraphs(3, true),
        ];
    }
}
