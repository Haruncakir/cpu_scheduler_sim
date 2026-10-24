import type { Process, Interval, ProcessMetrics } from './types';

/**
 * Returns negative if a wins, positive if b wins.
 * Rule: smaller arrivalTime first, then smaller inputIndex.
 */
export function tieBreak(a: Process, b: Process): number {
  if (a.arrivalTime !== b.arrivalTime) {
    return a.arrivalTime - b.arrivalTime;
  }
  return a.inputIndex - b.inputIndex;
}

/**
 * Derives all process metrics and averages from the simulation timeline.
 * This is the single source of metric calculation truth.
 */
export function computeMetrics(
  processes: Process[],
  timeline: Interval[]
): {
  metrics: ProcessMetrics[];
  avgTurnaround: number;
  avgWaiting: number;
  avgResponse: number;
} {
  if (processes.length === 0) {
    return {
      metrics: [],
      avgTurnaround: 0,
      avgWaiting: 0,
      avgResponse: 0,
    };
  }

  // Pre-collect intervals by process id
  const processIntervalsMap = new Map<string, Interval[]>();
  for (const interval of timeline) {
    if (interval.pid !== null) {
      const list = processIntervalsMap.get(interval.pid) || [];
      list.push(interval);
      processIntervalsMap.set(interval.pid, list);
    }
  }

  let totalTurnaround = 0;
  let totalWaiting = 0;
  let totalResponse = 0;

  const metrics: ProcessMetrics[] = processes.map((proc) => {
    const intervals = processIntervalsMap.get(proc.id) || [];
    const firstStartTime = intervals.length > 0 ? intervals[0].start : proc.arrivalTime;
    const completionTime = intervals.length > 0 ? intervals[intervals.length - 1].end : proc.arrivalTime;
    const turnaroundTime = completionTime - proc.arrivalTime;
    const waitingTime = turnaroundTime - proc.burstTime;
    const responseTime = firstStartTime - proc.arrivalTime;

    totalTurnaround += turnaroundTime;
    totalWaiting += waitingTime;
    totalResponse += responseTime;

    return {
      process: proc,
      firstStartTime,
      completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    };
  });

  const count = processes.length;

  return {
    metrics,
    avgTurnaround: totalTurnaround / count,
    avgWaiting: totalWaiting / count,
    avgResponse: totalResponse / count,
  };
}
