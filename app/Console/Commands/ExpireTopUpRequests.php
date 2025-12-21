<?php

namespace App\Console\Commands;

use App\Models\TopUpRequest;
use Illuminate\Console\Command;

class ExpireTopUpRequests extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'topup:expire';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Expire pending top-up requests older than 24 hours';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired top-up requests...');

        // Find pending requests older than 24 hours
        $expiredRequests = TopUpRequest::where('status', TopUpRequest::STATUS_PENDING)
            ->where('created_at', '<=', now()->subHours(24))
            ->get();

        $count = $expiredRequests->count();

        if ($count === 0) {
            $this->info('No expired top-up requests found.');
            return 0;
        }

        $this->info("Found {$count} expired top-up request(s). Marking as expired...");

        foreach ($expiredRequests as $request) {
            $request->update([
                'status' => TopUpRequest::STATUS_EXPIRED,
            ]);

            $this->line("- Expired: Order #{$request->order_id} (User: {$request->user->name})");
        }

        $this->info("Successfully expired {$count} top-up request(s).");

        // Log to Laravel log
        \Log::info('Top-up expiration job completed', [
            'expired_count' => $count,
            'expired_ids' => $expiredRequests->pluck('id')->toArray(),
        ]);

        return 0;
    }
}
