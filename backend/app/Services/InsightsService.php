<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;

class InsightsService
{
    /**
     * Compute comprehensive mood and journaling insights for a given user.
     */
    public function getInsightsForUser(User $user, string $period = '7_days'): array
    {
        $entries = $user->journalEntries()->with('mood')->orderBy('entry_date', 'asc')->get();

        if ($entries->isEmpty()) {
            return [
                'total_entries' => 0,
                'streak' => 0,
                'max_streak' => 0,
                'mood_distribution' => [],
                'mood_trend' => [],
            ];
        }

        // 1. Calculate Streaks
        $streak = 0;
        $maxStreak = 0;
        $currentStreak = 0;
        $yesterday = Carbon::yesterday()->toDateString();
        $today = Carbon::today()->toDateString();

        $dateMap = $entries->pluck('entry_date')->map->toDateString()->unique()->values()->toArray();
        rsort($dateMap); // Sort newest to oldest for streak calculation

        // Calculate current streak
        if (in_array($today, $dateMap)) {
            $currentStreak = 1;
            $checkDate = Carbon::yesterday();
        } elseif (in_array($yesterday, $dateMap)) {
            $currentStreak = 1;
            $checkDate = Carbon::yesterday()->subDay();
        } else {
            $currentStreak = 0;
            $checkDate = null;
        }

        if ($currentStreak > 0 && $checkDate) {
            while (in_array($checkDate->toDateString(), $dateMap)) {
                $currentStreak++;
                $checkDate->subDay();
            }
        }
        
        $streak = $currentStreak;

        // Calculate max streak (forward iteration)
        $runningStreak = 0;
        $previousDate = null;
        $sortedDates = $entries->pluck('entry_date')->map->toDateString()->unique()->values()->toArray();
        sort($sortedDates); // Oldest to newest

        foreach ($sortedDates as $dateString) {
            $date = Carbon::parse($dateString);
            if ($previousDate === null) {
                $runningStreak = 1;
            } else {
                // If this date is exactly 1 day after the previous date
                if ($date->toDateString() === $previousDate->copy()->addDay()->toDateString()) {
                    $runningStreak++;
                } else {
                    $runningStreak = 1;
                }
            }
            if ($runningStreak > $maxStreak) {
                $maxStreak = $runningStreak;
            }
            $previousDate = clone $date;
        }

        // 2. Mood Distribution
        $distribution = $entries->groupBy('mood.label')->map(function ($group) {
            return $group->count();
        })->toArray();

        // 3. Mood Trend
        $trend = [];
        
        if ($period === 'all_time') {
            // For all time, we just return the actual entries without zero-filling
            // to prevent massive arrays of mostly nulls spanning years.
            foreach ($entries as $entry) {
                $trend[] = [
                    'date' => $entry->entry_date->toDateString(),
                    'value' => $entry->mood->value,
                    'emoji' => $entry->mood->emoji,
                    'label' => $entry->mood->label,
                ];
            }
        } else {
            $days = 7;
            if ($period === '30_days') {
                $days = 30;
            } elseif ($period === '1_year') {
                $days = 365;
            }
            
            $lastDaysStart = Carbon::today()->subDays($days - 1)->toDateString();
            $trendEntries = $entries->where('entry_date', '>=', $lastDaysStart);
            
            for ($i = $days - 1; $i >= 0; $i--) {
                $date = Carbon::today()->subDays($i)->toDateString();
                $entry = $trendEntries->firstWhere(function($e) use ($date) {
                    return $e->entry_date->toDateString() === $date;
                });
                
                $trend[] = [
                    'date' => $date,
                    'value' => $entry ? $entry->mood->value : null,
                    'emoji' => $entry ? $entry->mood->emoji : null,
                    'label' => $entry ? $entry->mood->label : null,
                ];
            }
        }

        return [
            'total_entries' => $entries->count(),
            'streak' => $streak,
            'max_streak' => $maxStreak,
            'mood_distribution' => $distribution,
            'mood_trend' => $trend,
        ];
    }
}
