import type { Process, Interval, SimulationResult } from './types';
import { tieBreak, computeMetrics } from './utils';

/**
 * Shortest Job First (SJF) CPU scheduling algorithm.
 * Non-preemptive.
 * When the CPU becomes free, selects the ready process with the shortest CPU burst.
 * Ties broken by earlier arrival time, then earlier position in the input list.
 */
export function runSJF(processes: Process[]): SimulationResult {
  if (processes.length === 0) {
    return {
      timeline: [],
      metrics: [],
      avgTurnaround: 0,
      avgWaiting: 0,
      avgResponse: 0,
    };
  }

  const remaining = [...processes];
  const timeline: Interval[] = [];
  let currentTime = 0;

  while (remaining.length > 0) {
    // Find ready processes at current time
    const ready = remaining.filter((p) => p.arrivalTime <= currentTime);

    if (ready.length === 0) {
      // CPU idle until next arrival
      const nextArrival = Math.min(...remaining.map((p) => p.arrivalTime));
      timeline.push({
        pid: null,
        start: currentTime,
        end: nextArrival,
      });
      currentTime = nextArrival;
      continue;
    }

    // Select process with shortest burstTime, breaking ties with tieBreak
    ready.sort((a, b) => {
      if (a.burstTime !== b.burstTime) {
        return a.burstTime - b.burstTime;
      }
      return tieBreak(a, b);
    });

    const chosen = ready[0];

    timeline.push({
      pid: chosen.id,
      start: currentTime,
      end: currentTime + chosen.burstTime,
    });
    currentTime += chosen.burstTime;

    // Remove chosen process from remaining
    const index = remaining.findIndex((p) => p.id === chosen.id);
    remaining.splice(index, 1);
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
