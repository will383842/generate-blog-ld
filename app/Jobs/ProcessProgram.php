<?php

namespace App\Jobs;

use App\Models\Program;
use App\Models\ProgramRun;
use App\Services\Content\ProgramService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessProgram implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 7200; // 2 heures max
    public int $tries = 3;
    public int $maxExceptions = 3;

    /**
     * Délais entre les tentatives (30s, 2min, 5min)
     */
    public function backoff(): array
    {
        return [30, 120, 300];
    }

    public function __construct(
        public Program $program,
        public ProgramRun $run
    ) {}

    public function handle(ProgramService $programService): void
    {
        Log::info("ProcessProgram: Starting", [
            'program_id' => $this->program->id,
            'run_id' => $this->run->id,
        ]);

        try {
            $programService->execute($this->program, $this->run);
            
            Log::info("ProcessProgram: Completed", [
                'program_id' => $this->program->id,
                'run_id' => $this->run->id,
                'articles_generated' => $this->run->fresh()->articles_generated,
            ]);
            
        } catch (\Exception $e) {
            Log::error("ProcessProgram: Failed", [
                'program_id' => $this->program->id,
                'run_id' => $this->run->id,
                'error' => $e->getMessage(),
            ]);

            $this->run->markFailed($e->getMessage());
            $this->program->markError($e->getMessage());
            
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error("ProcessProgram: Job failed", [
            'program_id' => $this->program->id,
            'run_id' => $this->run->id,
            'error' => $exception->getMessage(),
        ]);

        $this->run->markFailed($exception->getMessage());
        $this->program->markError($exception->getMessage());
    }

    public function tags(): array
    {
        return [
            'program:' . $this->program->id,
            'run:' . $this->run->id,
            'platform:' . $this->program->platform_id,
        ];
    }
}