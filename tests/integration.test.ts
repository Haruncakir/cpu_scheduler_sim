import { describe, it, expect } from 'vitest';
import { runFCFS } from '../src/scheduler/fcfs';
import { runSJF } from '../src/scheduler/sjf';
import { runSRTF } from '../src/scheduler/srtf';
import { runRR } from '../src/scheduler/rr';
import type { Process, SimulationResult } from '../src/scheduler/types';

describe('Integration & Invariant Tests', () => {
  const workloadA: Process[] = [
    { id: 'P1', arrivalTime: 0, burstTime: 8, inputIndex: 0 },
    { id: 'P2', arrivalTime: 1, burstTime: 4, inputIndex: 1 },
    { id: 'P3', arrivalTime: 2, burstTime: 2, inputIndex: 2 },
    { id: 'P4', arrivalTime: 4, burstTime: 1, inputIndex: 3 },
  ];

  const workloadB: Process[] = [
    { id: 'P1', arrivalTime: 2, burstTime: 3, inputIndex: 0 },
    { id: 'P2', arrivalTime: 2, burstTime: 1, inputIndex: 1 },
    { id: 'P3', arrivalTime: 8, burstTime: 2, inputIndex: 2 },
    { id: 'P4', arrivalTime: 9, burstTime: 1, inputIndex: 3 },
  ];

  // Custom Workload 1: Has CPU idle time at start and in between
  const workloadIdle: Process[] = [
    { id: 'P1', arrivalTime: 3, burstTime: 2, inputIndex: 0 },
    { id: 'P2', arrivalTime: 8, burstTime: 4, inputIndex: 1 },
    { id: 'P3', arrivalTime: 16, burstTime: 1, inputIndex: 2 },
  ];

  // Custom Workload 2: Simultaneous arrivals and scheduling tie
  const workloadTies: Process[] = [
    { id: 'P1', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
    { id: 'P2', arrivalTime: 0, burstTime: 3, inputIndex: 1 },
    { id: 'P3', arrivalTime: 0, burstTime: 2, inputIndex: 2 },
    { id: 'P4', arrivalTime: 0, burstTime: 2, inputIndex: 3 },
  ];

  // Custom Workload 3: SRTF preemption chain
  const workloadPreempt: Process[] = [
    { id: 'P1', arrivalTime: 0, burstTime: 10, inputIndex: 0 },
    { id: 'P2', arrivalTime: 2, burstTime: 5, inputIndex: 1 },
    { id: 'P3', arrivalTime: 4, burstTime: 1, inputIndex: 2 },
  ];

  const allWorkloads = [
    { name: 'Workload A', procs: workloadA },
    { name: 'Workload B', procs: workloadB },
    { name: 'Workload with Idle Time', procs: workloadIdle },
    { name: 'Workload with Simultaneous Ties', procs: workloadTies },
    { name: 'Workload with SRTF Preemption', procs: workloadPreempt },
  ];

  const algorithms: { name: string; run: (p: Process[]) => SimulationResult }[] = [
    { name: 'FCFS', run: (p) => runFCFS(p) },
    { name: 'SJF', run: (p) => runSJF(p) },
    { name: 'SRTF', run: (p) => runSRTF(p) },
    { name: 'RR (q=2)', run: (p) => runRR(p, 2) },
    { name: 'RR (q=1)', run: (p) => runRR(p, 1) },
    { name: 'RR (q=4)', run: (p) => runRR(p, 4) },
  ];

  function verifyInvariants(procs: Process[], result: SimulationResult, label: string) {
    const { timeline, metrics } = result;

    // Invariant 1: Continuous non-overlapping timeline starting at 0
    if (timeline.length > 0) {
      expect(timeline[0].start, `${label}: first interval should start at 0`).toBe(0);
      for (let i = 1; i < timeline.length; i++) {
        expect(
          timeline[i].start,
          `${label}: interval ${i} must seamlessly follow interval ${i - 1} without gaps or overlaps`
        ).toBe(timeline[i - 1].end);
        expect(
          timeline[i].end,
          `${label}: interval duration must be positive`
        ).toBeGreaterThan(timeline[i].start);
      }
    }

    // Invariant 2: Every process receives exactly its specified burst time
    for (const p of procs) {
      const runIntervals = timeline.filter((it) => it.pid === p.id);
      const totalRunTime = runIntervals.reduce((sum, it) => sum + (it.end - it.start), 0);
      expect(totalRunTime, `${label}: process ${p.id} total run time must match burst time`).toBe(p.burstTime);
    }

    // Invariant 3: No process runs before its arrival time
    for (const interval of timeline) {
      if (interval.pid !== null) {
        const proc = procs.find((p) => p.id === interval.pid)!;
        expect(
          interval.start,
          `${label}: process ${proc.id} interval start (${interval.start}) cannot precede arrival (${proc.arrivalTime})`
        ).toBeGreaterThanOrEqual(proc.arrivalTime);
      }
    }

    // Invariant 4: Waiting and response times are nonnegative, turnaround >= burst
    for (const m of metrics) {
      expect(m.waitingTime, `${label}: waiting time for ${m.process.id} must be >= 0`).toBeGreaterThanOrEqual(0);
      expect(m.responseTime, `${label}: response time for ${m.process.id} must be >= 0`).toBeGreaterThanOrEqual(0);
      expect(m.turnaroundTime, `${label}: turnaround for ${m.process.id} must be >= burst`).toBeGreaterThanOrEqual(m.process.burstTime);
      expect(m.completionTime, `${label}: completion must equal arrival + turnaround`).toBe(m.process.arrivalTime + m.turnaroundTime);
    }

    // Invariant 5: CPU is never idle while any process is ready
    for (const interval of timeline) {
      if (interval.pid === null) {
        // CPU was idle from interval.start to interval.end
        // Check that during this time, NO process was ready with remaining work
        for (const p of procs) {
          // If p arrived before or at interval.start, did it finish before interval.start?
          if (p.arrivalTime <= interval.start) {
            // Find all work done by p before or at interval.start
            const priorWork = timeline
              .filter((it) => it.pid === p.id && it.end <= interval.start)
              .reduce((sum, it) => sum + (it.end - it.start), 0);
            expect(
              priorWork,
              `${label}: process ${p.id} should have finished before idle period [${interval.start}, ${interval.end}]`
            ).toBe(p.burstTime);
          }
        }
      }
    }
  }

  for (const algo of algorithms) {
    describe(`Algorithm: ${algo.name}`, () => {
      for (const wl of allWorkloads) {
        it(`satisfies all scheduling invariants on ${wl.name}`, () => {
          const result = algo.run(wl.procs);
          verifyInvariants(wl.procs, result, `${algo.name} on ${wl.name}`);
        });
      }
    });
  }
});
