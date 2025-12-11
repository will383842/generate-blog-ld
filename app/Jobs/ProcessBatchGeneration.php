<?php

namespace App\Jobs;

use App\Models\GenerationRequest;
use App\Services\Content\BatchGenerationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessBatchGeneration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1; // Pas de retry pour génération batch
    public $timeout = 7200; // 2 heures max

    protected GenerationRequest $request;

    public function __construct(GenerationRequest $request)
    {
        $this->request = $request;
    }

    public function handle(BatchGenerationService $batchService): void
    {
        Log::info('Début génération batch', [
            'request_id' => $this->request->id,
            'strategy' => $this->request->strategy
        ]);

        $batchService->generate($this->request);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Job ProcessBatchGeneration failed', [
            'request_id' => $this->request->id,
            'error' => $exception->getMessage()
        ]);
    }
}
