<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\InsightsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InsightsController extends Controller
{
    public function index(Request $request, InsightsService $insightsService): JsonResponse
    {
        $period = $request->query('period', '7_days');
        $insights = $insightsService->getInsightsForUser($request->user(), $period);
        return response()->json($insights);
    }
}
