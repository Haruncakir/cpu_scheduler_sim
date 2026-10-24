import type { Process, Interval, SimulationResult } from './types';
import { tieBreak, computeMetrics } from './utils';

/**
 * Round Robin (RR) CPU scheduling algorithm.
 * Uses a FIFO ready queue with configurable time quantum.
 * At quantum boundary t:
 * 1. Enqueue all processes arriving at or before t (in arrivalTime, inputIndex order).
 * 2. Re-enqueue the unfinished running process. Completed processes never rejoin.
 * Consecutive RR slices of the same process appear as separate Interval objects.
 */
export function runRR(processes: Process[], quantum: number): SimulationResult {
  if (processes.length === 0) {
    return {
      timeline: [],
      metrics: [],
      avgTurnaround: 0,
      avgWaiting: 0,
      avgResponse: 0,
    };
  }

  const remainingTime = new Map<string, number>();
  for (const p of processes) {
    remainingTime.set(p.id, p.burstTime);
  }

  const enqueued = new Set<string>();
  const queue: Process[] = [];
  const timeline: Interval[] = [];
  let currentTime = 0;

  // Helper to enqueue new arrivals up to a specific time
  const enqueueArrivalsUpTo = (time: number) => {
    const newlyArrived = processes.filter(
      (p) => !enqueued.has(p.id) && p.arrivalTime <= time
    );
    // Sort arrivals by arrivalTime then inputIndex
    newlyArrived.sort(tieBreak);
    for (const p of newlyArrived) {
      enqueued.add(p.id);
      queue.push(p);
    }
  };

  // Enqueue initial arrivals at t = 0
  enqueueArrivalsUpTo(currentTime);

  while (enqueued.size < processes.length || queue.length > 0) {
    if (queue.length === 0) {
      // Find the next arrival time among processes not yet enqueued
      const unarrived = processes.filter((p) => !enqueued.has(p.id));
      if (unarrived.length === 0) {
        break; // All processes enqueued and queue empty -> done
      }
      const nextArrival = Math.min(...unarrived.map((p) => p.arrivalTime));
      timeline.push({
        pid: null,
        start: currentTime,
        end: nextArrival,
      });
      currentTime = nextArrival;
      enqueueArrivalsUpTo(currentTime);
      continue;
    }

    const current = queue.shift()!;
    const rem = remainingTime.get(current.id)!;
    const slice = Math.min(quantum, rem);
    const sliceEnd = currentTime + slice;

    // Record interval for this time slice
    timeline.push({
      pid: current.id,
      start: currentTime,
      end: sliceEnd,
    });

    const newRem = rem - slice;
    remainingTime.set(current.id, newRem);
    currentTime = sliceEnd;

    // Enqueue all processes arriving during the slice up to sliceEnd
    enqueueArrivalsUpTo(currentTime);

    // If current process is not yet finished, re-enqueue it after new arrivals
    if (newRem > 0) {
      queue.push(current);
    }
  }

  const { metrics, avgTurnaround, avgWaiting, avgResponse } = computeMetrics(processes, timeline);

  return {
    timeline,
    metrics,
    avgTurnaround,
    avgWaiting,
    avgResponse,
  };
}
