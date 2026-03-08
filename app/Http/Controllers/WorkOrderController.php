<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Str;

class WorkOrderController extends Controller
{
    /**
     * ================= WEB (Dashboard Page) =================
     */
    public function index(Request $request)
    {
        $request->validate([
            'date_request' => 'nullable|date',
            'status' => 'nullable'
        ]);

        $date = $request->has('date_request')
            ? $request->date_request
            : now()->toDateString();

        $statusFilter = $request->status ?? null;

        try {

            $rawData = $this->fetchWorkOrders($date);

            $workorders = collect($rawData)
                ->map(fn ($wo) => $this->transformWorkOrder($wo))
                ->sortByDesc('date_request')
                ->values();

            $workorders = $this->applyStatusFilter($workorders, $statusFilter);

            // ================= STATISTIK =================

            $totalWO = $workorders->count();

            $totalPending = $workorders->whereIn('status', [0,1])->count();

            $totalProgress = $workorders->whereIn('status', [2,3])->count();

            $totalDone = $workorders->whereIn('status', [4,5])->count();

            $completionRate = $totalWO > 0
                ? round(($totalDone / $totalWO) * 100, 2)
                : 0;

            $averageDuration = $this->calculateAverageDuration($workorders);

            return Inertia::render('dashboard', [
                'workorders' => $workorders,
                'selectedDate' => $date,
                'selectedStatus' => $statusFilter,
                'totalWO' => $totalWO,
                'totalPending' => $totalPending,
                'totalProgress' => $totalProgress,
                'totalDone' => $totalDone,
                'completionRate' => $completionRate,
                'averageDuration' => $averageDuration,
            ]);

        } catch (\Exception $e) {

            return Inertia::render('dashboard', [
                'workorders' => [],
                'selectedDate' => $date,
                'selectedStatus' => $statusFilter,
                'totalWO' => 0,
                'totalPending' => 0,
                'totalProgress' => 0,
                'totalDone' => 0,
                'completionRate' => 0,
                'averageDuration' => '0 menit',
                'error' => 'Terjadi kesalahan server'
            ]);
        }
    }

    /**
     * ================= API ENDPOINT =================
     */
    public function api(Request $request)
    {
        $request->validate([
            'date_request' => 'nullable|date',
            'status' => 'nullable'
        ]);

        $date = $request->date_request ?? null;
        $statusFilter = $request->status ?? null;

        try {

            $rawData = $this->fetchWorkOrders($date);

            $workorders = collect($rawData)
                ->map(fn ($wo) => $this->transformWorkOrder($wo));

            $workorders = $this->applyStatusFilter($workorders, $statusFilter);

            return response()->json([
                'status' => 'success',
                'date' => $date,
                'data' => $workorders->values()
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'status' => 'error',
                'message' => 'Terjadi kesalahan server'
            ], 500);
        }
    }

    /**
     * ================= FETCH DATA FROM API =================
     */
    private function fetchWorkOrders($date = null)
    {
        $params = [
            'id_dept' => 'DP011',
        ];

        if (!empty($date)) {
            $params['date_request'] = $date;
        }

        $response = Http::timeout(10)->get(
            'https://stagingservicewo.salokapark.app/api/get_wo_request',
            $params
        );

        if (!$response->successful()) {
            throw new \Exception('Gagal mengambil data dari API');
        }

        return $response->json()['data'] ?? [];
    }

    /**
     * ================= TRANSFORM DATA =================
     */
    private function transformWorkOrder($wo)
    {
        $workStarted = $wo['work_started'] ?? null;
        $workCompleted = $wo['work_completed'] ?? null;

        $durationText = null;

        if (!empty($workStarted) && !empty($workCompleted)) {
            $durationText = Carbon::parse($workStarted)
                ->diff(Carbon::parse($workCompleted))
                ->format('%d hari %h jam %i menit');
        }

        return [

            'id' => $wo['id'] ?? null,
            'id_wo' => $wo['id_wo'] ?? null,

            'job_name' => $wo['job_name'] ?? null,
            'job_description' => strip_tags($wo['job_description'] ?? ''),

            'departemen' => $wo['departemen'] ?? null,
            'sub_departemen' => $wo['sub_departemen'] ?? null,
            'departemen_request' => $wo['departemen_request'] ?? null,

            'requestor' => $wo['name_request'] ?? 'Tidak diketahui',

            'asset' => !empty($wo['asset'])
                ? Str::title($wo['asset'])
                : 'Tidak ada asset',

            'work_location' => $wo['work_location'] ?? null,

            // STATUS
            'status' => $wo['track_status'] ?? null,
            'status_text' => $this->mapStatus($wo['track_status'] ?? null),

            // PRIORITY
            'priority' => $wo['priority'] ?? null,
            'priority_text' => $this->mapPriority($wo['priority'] ?? null),

            'pic_name' => $wo['description_of_pic_name'] ?? 'Belum ada PIC',

            // DATE
            'date_request' => $wo['date_request'] ?? null,

            'date_request_formatted' => !empty($wo['date_request'])
                ? Carbon::parse($wo['date_request'])->translatedFormat('d M Y, H:i')
                : null,

            // UMUR WO
            'umur_wo' => !empty($wo['date_request'])
                ? Carbon::parse($wo['date_request'])->startOfDay()
                    ->diffInDays(now()->startOfDay())
                : null,

            // WORK START
            'work_started' => $workStarted,

            'work_started_formatted' => !empty($workStarted)
                ? Carbon::parse($workStarted)->translatedFormat('d M Y, H:i')
                : null,

            // WORK DONE
            'work_completed' => $workCompleted,

            'work_completed_formatted' => !empty($workCompleted)
                ? Carbon::parse($workCompleted)->translatedFormat('d M Y, H:i')
                : null,

            // DURATION
            'duration_text' => $durationText,
        ];
    }

    /**
     * ================= STATUS FILTER =================
     */
    private function applyStatusFilter($collection, $statusFilter)
    {
        if ($statusFilter !== null && $statusFilter !== '') {

            if (str_contains($statusFilter, ',')) {

                $statuses = explode(',', $statusFilter);

                return $collection
                    ->whereIn('status', $statuses)
                    ->values();
            }

            return $collection
                ->where('status', (int)$statusFilter)
                ->values();
        }

        return $collection;
    }

    /**
     * ================= AVERAGE DURATION =================
     */
    private function calculateAverageDuration($workorders)
    {
        $completed = $workorders->whereIn('status', [4,5]);

        $totalMinutes = $completed->sum(function ($wo) {

            if (!empty($wo['work_started']) && !empty($wo['work_completed'])) {

                return Carbon::parse($wo['work_started'])
                    ->diffInMinutes(Carbon::parse($wo['work_completed']));
            }

            return 0;
        });

        if ($completed->count() === 0) {
            return '0 menit';
        }

        $averageMinutes = round($totalMinutes / $completed->count());

        $hours = floor($averageMinutes / 60);
        $minutes = $averageMinutes % 60;

        return ($hours > 0 ? $hours . ' jam ' : '') .
               ($minutes > 0 ? $minutes . ' menit' : '0 menit');
    }

    /**
     * ================= MAPPING =================
     */
    private function mapStatus($status)
    {
        return match ($status) {
            0 => 'Draft',
            1 => 'Departemen Request',
            2 => 'Departemen Recipient',
            3 => 'Execute Departemen Recipient',
            4 => 'Checked Departemen Recipient',
            5 => 'Checked Departemen Request',
            default => '-'
        };
    }

    private function mapPriority($priority)
    {
        return match ($priority) {
            1 => 'Urgent',
            2 => 'Routine',
            3 => 'Others',
            default => '-'
        };
    }
}