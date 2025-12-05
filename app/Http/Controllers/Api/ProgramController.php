<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\ProgramRun;
use App\Models\ProgramItem;
use App\Services\Content\ProgramService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ProgramController extends Controller
{
    public function __construct(
        protected ProgramService $programService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Program::with(['platform', 'creator'])
            ->withCount(['runs', 'items']);

        if ($request->filled('platform_id')) {
            $query->where('platform_id', $request->platform_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('content_type')) {
            $query->whereJsonContains('content_types', $request->content_type);
        }
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortDir = $request->get('sort_dir', 'desc');
        $query->orderBy($sortBy, $sortDir);

        $perPage = min($request->get('per_page', 20), 100);
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'platform_id' => 'required|exists:platforms,id',
            'content_types' => 'required|array|min:1',
            'content_types.*' => Rule::in(Program::CONTENT_TYPES),
            'countries' => 'nullable|array',
            'regions' => 'nullable|array',
            'languages' => 'nullable|array',
            'themes' => 'nullable|array',
            'provider_types' => 'nullable|array',
            'lawyer_specialties' => 'nullable|array',
            'expat_domains' => 'nullable|array',
            'ulixai_services' => 'nullable|array',
            'quantity_mode' => 'required|in:total,per_country,per_language,per_country_language',
            'quantity_value' => 'required|integer|min:1|max:10000',
            'recurrence_type' => 'required|in:once,daily,weekly,monthly,cron',
            'recurrence_config' => 'nullable|array',
            'cron_expression' => 'nullable|string|max:100',
            'start_at' => 'nullable|date',
            'end_at' => 'nullable|date|after:start_at',
            'options' => 'nullable|array',
            'priority' => 'nullable|integer|min:1|max:10',
            'daily_budget_limit' => 'nullable|numeric|min:0',
            'daily_generation_limit' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['created_by'] = auth()->id();
        $data['status'] = 'draft';

        $program = Program::create($data);

        return response()->json([
            'message' => 'Programme créé',
            'program' => $program->load(['platform', 'creator']),
            'estimated' => $this->programService->estimate($data),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $program = Program::with(['platform', 'creator', 'runs' => fn($q) => $q->latest()->limit(10)])
            ->withCount(['runs', 'items'])
            ->findOrFail($id);

        return response()->json([
            'program' => $program,
            'estimated_items' => $program->estimated_items,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $program = Program::findOrFail($id);

        if ($program->runs()->where('status', 'running')->exists()) {
            return response()->json(['error' => 'Programme en cours d\'exécution'], 409);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'content_types' => 'sometimes|array|min:1',
            'content_types.*' => Rule::in(Program::CONTENT_TYPES),
            'quantity_mode' => 'sometimes|in:total,per_country,per_language,per_country_language',
            'quantity_value' => 'sometimes|integer|min:1|max:10000',
            'options' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $program->update($validator->validated());

        return response()->json([
            'message' => 'Programme mis à jour',
            'program' => $program->fresh(['platform', 'creator']),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $program = Program::findOrFail($id);
        $program->runs()->where('status', 'running')->each(fn($r) => $r->markCancelled());
        $program->delete();

        return response()->json(['message' => 'Programme supprimé']);
    }

    public function activate(int $id): JsonResponse
    {
        $program = Program::findOrFail($id);
        if (!$program->activate()) {
            return response()->json(['error' => 'Impossible d\'activer'], 400);
        }
        return response()->json(['message' => 'Activé', 'program' => $program->fresh()]);
    }

    public function pause(int $id): JsonResponse
    {
        $program = Program::findOrFail($id);
        if (!$program->pause()) {
            return response()->json(['error' => 'Impossible de mettre en pause'], 400);
        }
        return response()->json(['message' => 'Mis en pause', 'program' => $program->fresh()]);
    }

    public function resume(int $id): JsonResponse
    {
        $program = Program::findOrFail($id);
        if (!$program->resume()) {
            return response()->json(['error' => 'Impossible de reprendre'], 400);
        }
        return response()->json(['message' => 'Repris', 'program' => $program->fresh()]);
    }

    public function clone(Request $request, int $id): JsonResponse
    {
        $program = Program::findOrFail($id);
        $clone = $program->replicate();
        $clone->name = $request->get('name', $program->name . ' (copie)');
        $clone->status = 'draft';
        $clone->created_by = auth()->id();
        $clone->total_generated = 0;
        $clone->total_cost = 0;
        $clone->run_count = 0;
        $clone->next_run_at = null;
        $clone->save();

        return response()->json(['message' => 'Dupliqué', 'program' => $clone], 201);
    }

    public function run(int $id): JsonResponse
    {
        $program = Program::findOrFail($id);

        if ($program->runs()->where('status', 'running')->exists()) {
            return response()->json(['error' => 'Run déjà en cours'], 409);
        }
        if (!$program->canRunToday()) {
            return response()->json(['error' => 'Limite journalière atteinte'], 429);
        }

        $run = $this->programService->dispatch($program);
        return response()->json(['message' => 'Lancé', 'run' => $run]);
    }

    public function analytics(int $id, Request $request): JsonResponse
    {
        $program = Program::findOrFail($id);
        $period = $request->get('period', '30d');
        $startDate = match ($period) {
            '7d' => now()->subDays(7),
            '30d' => now()->subDays(30),
            '90d' => now()->subDays(90),
            default => now()->subDays(30),
        };

        $totals = [
            'items_total' => $program->items()->where('created_at', '>=', $startDate)->count(),
            'items_completed' => $program->items()->where('created_at', '>=', $startDate)->where('status', 'completed')->count(),
            'items_failed' => $program->items()->where('created_at', '>=', $startDate)->where('status', 'failed')->count(),
            'total_cost' => $program->items()->where('created_at', '>=', $startDate)->sum('cost'),
        ];

        return response()->json(['period' => $period, 'totals' => $totals]);
    }

    public function calendar(Request $request): JsonResponse
    {
        $startDate = $request->get('start', now()->startOfMonth()->toDateString());
        $endDate = $request->get('end', now()->endOfMonth()->toDateString());

        $scheduled = Program::whereIn('status', ['active', 'scheduled'])
            ->whereNotNull('next_run_at')
            ->whereBetween('next_run_at', [$startDate, $endDate])
            ->select(['id', 'name', 'platform_id', 'next_run_at', 'recurrence_type', 'content_types'])
            ->with('platform:id,name')
            ->get();

        return response()->json(['scheduled' => $scheduled]);
    }

    public function estimate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content_types' => 'required|array|min:1',
            'content_types.*' => Rule::in(Program::CONTENT_TYPES),
            'quantity_mode' => 'required|in:total,per_country,per_language,per_country_language',
            'quantity_value' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return response()->json($this->programService->estimate($validator->validated()));
    }

    public function runs(int $id, Request $request): JsonResponse
    {
        $program = Program::findOrFail($id);
        $perPage = min($request->get('per_page', 20), 100);
        return response()->json($program->runs()->withCount('items')->latest()->paginate($perPage));
    }

    public function cancelRun(int $runId): JsonResponse
    {
        $run = ProgramRun::findOrFail($runId);
        if ($run->status !== 'running') {
            return response()->json(['error' => 'Run non actif'], 400);
        }
        $run->markCancelled();
        return response()->json(['message' => 'Annulé', 'run' => $run->fresh()]);
    }

    public function contentTypes(): JsonResponse
    {
        return response()->json([
            ['value' => 'article', 'label' => 'Article SEO', 'avg_cost' => 0.08],
            ['value' => 'pillar', 'label' => 'Article Pilier', 'avg_cost' => 0.25],
            ['value' => 'comparative', 'label' => 'Comparatif', 'avg_cost' => 0.15],
            ['value' => 'landing', 'label' => 'Landing Page', 'avg_cost' => 0.12],
            ['value' => 'manual', 'label' => 'Titre Manuel', 'avg_cost' => 0.08],
            ['value' => 'press_release', 'label' => 'Communiqué de Presse', 'avg_cost' => 0.10],
            ['value' => 'dossier', 'label' => 'Dossier de Presse', 'avg_cost' => 0.30],
        ]);
    }
}