# Test Run Queue System

## Overview

The Test Run Queue system provides intelligent batch test execution with automatic retry logic and concurrency control. It enables you to queue multiple test runs, manage resource allocation, and handle failures gracefully.

## Key Features

- **Persistent Queue Storage**: All queue jobs are stored in Supabase and survive application restarts
- **Concurrency Control**: Configurable limit on simultaneous test executions (default: 3)
- **Automatic Retry**: Failed tests are automatically retried up to a configurable limit (default: 2 retries)
- **Priority-Based Execution**: Higher priority jobs execute first
- **Real-Time Updates**: Live queue status updates via Supabase subscriptions
- **Job Management**: Cancel, retry, and monitor queued jobs
- **Statistics Dashboard**: Real-time queue metrics and job counts

## Architecture

### Database Schema

**test_run_queue** table:
- Stores queued test runs with configuration, priority, and status
- Tracks retry attempts and error messages
- Links to actual test runs when executing

**queue_metadata** table:
- Stores queue configuration (concurrency limits, etc.)
- Allows runtime configuration changes

### Core Services

**queueManager.ts** (`src/lib/queue/queueManager.ts`):
- Queue CRUD operations
- Status management
- Retry logic
- Concurrency control
- Real-time subscriptions

**queueProcessor.ts** (`src/lib/queue/queueProcessor.ts`):
- Processes queued jobs
- Respects concurrency limits
- Implements auto-retry logic
- Integrates with test execution pipeline

### React Components

**useRunQueue** hook (`src/hooks/useRunQueue.ts`):
- Manages queue state in React components
- Provides jobs list, statistics, and operations
- Auto-refreshes and subscribes to real-time updates

**QueueBadge** (`src/components/ui/QueueBadge.tsx`):
- Compact badge showing queue statistics
- Color-coded status indicators
- Click to expand queue panel

**QueuePanel** (`src/app/features/runner/components/QueuePanel.tsx`):
- Full queue management interface
- Job list with status and controls
- Concurrency limit configuration
- Cancel and retry operations

## Usage

### Adding Jobs to Queue

From the Runner UI:

1. Select a test suite
2. Configure viewports
3. Click "Add to Queue" button

Programmatically:

```typescript
import { useRunQueue } from '@/hooks/useRunQueue';

const { addJob } = useRunQueue();

await addJob(
  suiteId,
  {
    mobile: { width: 375, height: 667 },
    desktop: { width: 1920, height: 1080 }
  },
  priority // Optional, default: 0
);
```

### Monitoring Queue

Using the hook:

```typescript
const { jobs, stats, isLoading, error } = useRunQueue({
  suiteId: 'optional-filter',
  autoRefresh: true,
  refreshInterval: 5000
});

// jobs: Array of QueuedTestRun objects
// stats: { queued, running, completed, failed, retrying, total }
```

### Managing Jobs

```typescript
const { cancelJob, retryJob, updateJobStatus } = useRunQueue();

// Cancel a job
await cancelJob(jobId);

// Manually retry a failed job
await retryJob(jobId);

// Update job status (typically done by processor)
await updateJobStatus(jobId, 'completed', runId);
```

### Configuring Concurrency

```typescript
const { concurrencyLimit, setConcurrency } = useRunQueue();

// Set new limit
await setConcurrency(5); // Allow 5 simultaneous tests
```

## Job Lifecycle

1. **Queued**: Job is added to queue with priority
2. **Running**: Job is picked up by processor and executing
3. **Completed**: Job finished successfully
4. **Failed**: Job failed (if under max retries, will auto-retry)
5. **Retrying**: Job is being retried after failure
6. **Cancelled**: Job was manually cancelled

## Queue Processing

The queue processor runs periodically (default: every 5 seconds) and:

1. Checks current running job count vs. concurrency limit
2. If under limit, gets next queued job (highest priority, oldest first)
3. Starts job execution via `/api/playwright/execute`
4. Updates job status based on results
5. Auto-retries failed jobs if retry count < max retries

### Starting the Processor

The processor can be started manually or integrated into your application:

```typescript
import { startQueueProcessor } from '@/lib/queue/queueProcessor';

// Start processor with 5-second interval
const stopProcessor = startQueueProcessor(5000, {
  onJobStart: (jobId, runId) => {
    console.log(`Job ${jobId} started, run ID: ${runId}`);
  },
  onJobComplete: (jobId, runId, success) => {
    console.log(`Job ${jobId} completed, success: ${success}`);
  },
  onJobError: (jobId, error) => {
    console.error(`Job ${jobId} error:`, error);
  }
});

// Later, stop the processor
stopProcessor();
```

## Database Setup

Run the schema migration:

```sql
-- Execute supabase/schema-run-queue.sql in Supabase SQL Editor
```

This creates:
- `test_run_queue` table
- `queue_metadata` table
- Indexes for performance
- RLS policies
- Default concurrency limit (3)

## API Reference

### Queue Manager Functions

```typescript
// Add job to queue
addToQueue(suiteId: string, config: ViewportConfig, priority?: number, maxRetries?: number): Promise<string>

// Get next queued job
getNextQueuedJob(): Promise<QueuedTestRun | null>

// Get running jobs count
getRunningJobsCount(): Promise<number>

// Get concurrency limit
getConcurrencyLimit(): Promise<number>

// Set concurrency limit
setConcurrencyLimit(limit: number): Promise<void>

// Update job status
updateQueueJobStatus(jobId: string, status: string, runId?: string, errorMessage?: string): Promise<void>

// Retry failed job
retryQueueJob(jobId: string): Promise<void>

// Auto-retry if possible
autoRetryIfPossible(jobId: string): Promise<boolean>

// Cancel job
cancelQueueJob(jobId: string): Promise<void>

// Get queue jobs with filtering
getQueueJobs(suiteId?: string, status?: string, limit?: number): Promise<QueuedTestRun[]>

// Get queue statistics
getQueueStats(suiteId?: string): Promise<QueueStats>

// Subscribe to queue changes
subscribeToQueue(callback: Function, suiteId?: string): RealtimeChannel
```

## Best Practices

1. **Set Appropriate Concurrency**: Adjust based on system resources
2. **Use Priorities**: Prioritize critical tests for faster execution
3. **Monitor Failed Jobs**: Review failed jobs and adjust max retries
4. **Clean Old Jobs**: Periodically run cleanup to remove old completed/failed jobs
5. **Handle Errors**: Implement error callbacks in queue processor

## Troubleshooting

**Queue not processing:**
- Check if queue processor is running
- Verify concurrency limit is not 0
- Check database connection

**Jobs failing repeatedly:**
- Check test suite configuration
- Review error messages in queue panel
- Verify Playwright execution endpoint

**Database errors:**
- Ensure schema migration has been run
- Check RLS policies are enabled
- Verify Supabase connection

## Future Enhancements

- Scheduled test runs (cron-like scheduling)
- Queue analytics and retry pattern analysis
- Batch operations (cancel all, retry all failed)
- Queue priority preemption
- Resource-aware concurrency (CPU/memory-based limits)
