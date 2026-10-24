import type { Process, Interval, SimulationResult } from './types';
import { tieBreak, computeMetrics } from './utils';

/**
 * Shortest Remaining Time First (SRTF) CPU scheduling algorithm.
 * Preemptive. Event-driven (no tick-by-tick simulation).
 * Preempts only when a new arrival has a strictly shorter remaining time.
 * On equal remaining time, the current process continues running.
 * Ties among ready processes are broken by arrivalTime, then inputIndex.
 */
export function runSRTF(processes: Process[]): SimulationResult {
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

  const timeline: Interval[] = [];
  let currentTime = 0;

  while (true) {
    // Collect ready processes
    const ready = processes.filter(
      (p) => p.arrivalTime <= currentTime && (remainingTime.get(p.id) ?? 0) > 0
    );

    if (ready.length === 0) {
      // Find unarrived processes
      const unarrived = processes.filter(
        (p) => (remainingTime.get(p.id) ?? 0) > 0 && p.arrivalTime > currentTime
      );

      if (unarrived.length === 0) {
        break; // All processes completed
      }

      const nextArrival = Math.min(...unarrived.map((p) => p.arrivalTime));
      timeline.push({
        pid: null,
        start: currentTime,
        end: nextArrival,
      });
      currentTime = nextArrival;
      continue;
    }

    // Pick process with shortest remaining time, breaking ties with tieBreak
    ready.sort((a, b) => {
      const remA = remainingTime.get(a.id)!;
      const remB = remainingTime.get(b.id)!;
      if (remA !== remB) {
        return remA - remB;
      }
      return tieBreak(a, b);
    });

    const current = ready[0];
    const currRem = remainingTime.get(current.id)!;
    const currentFinish = currentTime + currRem;

    // Check for arrivals between currentTime and currentFinish that might preempt current
    const futureArrivals = processes.filter(
      (p) => p.arrivalTime > currentTime && p.arrivalTime < currentFinish
    );

    const arrivalTimes = Array.from(new Set(futureArrivals.map((p) => p.arrivalTime))).sort(
      (a, b) => a - b
    );

    let preempted = false;

    for (const tArr of arrivalTimes) {
      const dt = tArr - currentTime;
      const remAtArr = currRem - dt;

      // Find processes arriving at tArr
      const arrivingAtT = futureArrivals.filter((p) => p.arrivalTime === tArr);
      const minArrivingBurst = Math.min(...arrivingAtT.map((p) => p.burstTime));

      // Preempt ONLY if strictly shorter
      if (minArrivingBurst < remAtArr) {
        timeline.push({
          pid: current.id,
          start: currentTime,
          end: tArr,
        });
        remainingTime.set(current.id, remAtArr);
        currentTime = tArr;
        preempted = true;
        break;
      }
    }

    if (!preempted) {
      timeline.push({
        pid: current.id,
        start: currentTime,
        end: currentFinish,
      });
      remainingTime.set(current.id, 0);
      currentTime = currentFinish;
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
