import type { Process, Interval, SimulationResult } from './types';
import { tieBreak, computeMetrics } from './utils';

/**
 * First-Come, First-Served (FCFS) CPU scheduling algorithm.
 * Non-preemptive. Selects earliest arriving process, breaking ties by inputIndex.
 */
export function runFCFS(processes: Process[]): SimulationResult {
  if (processes.length === 0) {
    return {
      timeline: [],
      metrics: [],
      avgTurnaround: 0,
      avgWaiting: 0,
      avgResponse: 0,
    };
  }

  const sorted = [...processes].sort(tieBreak);
  const timeline: Interval[] = [];
  let currentTime = 0;

  for (const proc of sorted) {
    if (proc.arrivalTime > currentTime) {
      timeline.push({
        pid: null,
        start: currentTime,
        end: proc.arrivalTime,
      });
      currentTime = proc.arrivalTime;
    }

    timeline.push({
      pid: proc.id,
      start: currentTime,
      end: currentTime + proc.burstTime,
    });
    currentTime += proc.burstTime;
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
