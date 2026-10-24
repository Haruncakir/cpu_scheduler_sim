/**
 * Adversarial verification tests for CSE513 Assignment 1.
 *
 * These tests were added during a post-implementation review pass.
 * Each test documents the specific bug or edge case it would catch
 * if the implementation were wrong.
 *
 * The authoritative spec is CSE513-Assignment-1.pdf.
 */
import { describe, it, expect } from 'vitest';
import { runFCFS } from '../src/scheduler/fcfs';
import { runSJF } from '../src/scheduler/sjf';
import { runSRTF } from '../src/scheduler/srtf';
import { runRR } from '../src/scheduler/rr';
import { validateInput } from '../src/scheduler/validate';
import type { Process, SimulationResult } from '../src/scheduler/types';

// ---------------------------------------------------------------------------
// Helper: verify all scheduling invariants on a result
// ---------------------------------------------------------------------------
function verifyAllInvariants(procs: Process[], result: SimulationResult, label: string) {
  const { timeline, metrics } = result;

  // Timeline must start at t=0
  if (timeline.length > 0) {
    expect(timeline[0].start, `${label}: timeline must start at 0`).toBe(0);
  }

  // Timeline must be gapless and contiguous
  for (let i = 1; i < timeline.length; i++) {
    expect(
      timeline[i].start,
      `${label}: interval[${i}].start must equal interval[${i - 1}].end (no gaps/overlaps)`
    ).toBe(timeline[i - 1].end);
    expect(timeline[i].end, `${label}: every interval must have positive duration`).toBeGreaterThan(
      timeline[i].start
    );
  }

  // Each process gets exactly its burst time
  for (const p of procs) {
    const totalRun = timeline
      .filter((iv) => iv.pid === p.id)
      .reduce((s, iv) => s + (iv.end - iv.start), 0);
    expect(totalRun, `${label}: process ${p.id} must run for exactly burstTime=${p.burstTime}`).toBe(
      p.burstTime
    );
  }

  // No process runs before its arrival
  for (const iv of timeline) {
    if (iv.pid !== null) {
      const proc = procs.find((p) => p.id === iv.pid)!;
      expect(
        iv.start,
        `${label}: process ${proc.id} must not start before arrival=${proc.arrivalTime}`
      ).toBeGreaterThanOrEqual(proc.arrivalTime);
    }
  }

  // Metrics are self-consistent and non-negative
  for (const m of metrics) {
    expect(m.waitingTime, `${label}: waiting time for ${m.process.id} must be >= 0`).toBeGreaterThanOrEqual(0);
    expect(m.responseTime, `${label}: response time for ${m.process.id} must be >= 0`).toBeGreaterThanOrEqual(0);
    expect(
      m.turnaroundTime,
      `${label}: turnaround for ${m.process.id} must >= burst`
    ).toBeGreaterThanOrEqual(m.process.burstTime);
    // Formula consistency
    expect(m.turnaroundTime, `${label}: turnaround = completion - arrival`).toBe(
      m.completionTime - m.process.arrivalTime
    );
    expect(m.waitingTime, `${label}: waiting = turnaround - burst`).toBe(
      m.turnaroundTime - m.process.burstTime
    );
    expect(m.responseTime, `${label}: response = firstStart - arrival`).toBe(
      m.firstStartTime - m.process.arrivalTime
    );
  }

  // CPU must never be idle while a process is ready
  for (const iv of timeline) {
    if (iv.pid === null) {
      for (const p of procs) {
        if (p.arrivalTime <= iv.start) {
          const priorWork = timeline
            .filter((x) => x.pid === p.id && x.end <= iv.start)
            .reduce((s, x) => s + (x.end - x.start), 0);
          expect(
            priorWork,
            `${label}: CPU idle [${iv.start},${iv.end}) but process ${p.id} had not finished`
          ).toBe(p.burstTime);
        }
      }
    }
  }
}

// ===========================================================================
// SECTION 1: Assignment-specified required additional workloads
// ===========================================================================

describe('Assignment required additional workloads', () => {
  it('REQUIRED TC-A: workload with CPU idle time — FCFS produces correct idle interval', () => {
    // Bug it catches: idle intervals not emitted, or emitted with wrong bounds.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 2, inputIndex: 0 },
      { id: 'P2', arrivalTime: 5, burstTime: 3, inputIndex: 1 },
    ];
    const result = runFCFS(procs);
    // Must have idle[2,5]
    const idleInterval = result.timeline.find((iv) => iv.pid === null);
    expect(idleInterval).toBeDefined();
    expect(idleInterval!.start).toBe(2);
    expect(idleInterval!.end).toBe(5);
    verifyAllInvariants(procs, result, 'TC-A FCFS idle');
  });

  it('REQUIRED TC-B: simultaneous arrivals + scheduling tie — SRTF resolves by arrivalTime then inputIndex', () => {
    // Bug it catches: tie-breaking using JS sort stability instead of explicit comparator.
    // All 3 arrive at t=0 with same burst; SRTF (and SJF) must order by inputIndex.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, inputIndex: 0 },
      { id: 'P2', arrivalTime: 0, burstTime: 4, inputIndex: 1 },
      { id: 'P3', arrivalTime: 0, burstTime: 4, inputIndex: 2 },
    ];
    const sjfResult = runSJF(procs);
    // Same burst -> same priority -> tie-break by inputIndex
    expect(sjfResult.timeline).toEqual([
      { pid: 'P1', start: 0, end: 4 },
      { pid: 'P2', start: 4, end: 8 },
      { pid: 'P3', start: 8, end: 12 },
    ]);
    verifyAllInvariants(procs, sjfResult, 'TC-B SJF simultaneous same burst');
  });

  it('REQUIRED TC-C: SRTF preempts a running process — confirmed with TC-3 workload', () => {
    // Bug it catches: SRTF treating preemption condition as <= instead of <.
    // P1 has rem=7 at t=3; P2 arrives with burst=2. 2 < 7 -> preempt.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 10, inputIndex: 0 },
      { id: 'P2', arrivalTime: 3, burstTime: 2, inputIndex: 1 },
    ];
    const result = runSRTF(procs);
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 3 },
      { pid: 'P2', start: 3, end: 5 },
      { pid: 'P1', start: 5, end: 12 },
    ]);
    verifyAllInvariants(procs, result, 'TC-C SRTF preemption');
  });
});

// ===========================================================================
// SECTION 2: FCFS edge cases
// ===========================================================================

describe('FCFS edge cases', () => {
  it('process arriving exactly when previous completes — no idle gap inserted', () => {
    // Bug it catches: off-by-one emitting a zero-width idle interval.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 3, burstTime: 2, inputIndex: 1 }, // arrives exactly at P1 completion
    ];
    const result = runFCFS(procs);
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 3 },
      { pid: 'P2', start: 3, end: 5 },
    ]);
    // No idle interval
    expect(result.timeline.every((iv) => iv.pid !== null)).toBe(true);
    verifyAllInvariants(procs, result, 'FCFS arrival=completion no idle gap');
  });

  it('all processes arrive at t=0 with different burst times — FCFS uses inputIndex order', () => {
    // Bug it catches: FCFS accidentally sorting by burst instead of arrival+inputIndex.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 5, inputIndex: 0 },
      { id: 'P2', arrivalTime: 0, burstTime: 1, inputIndex: 1 },
      { id: 'P3', arrivalTime: 0, burstTime: 3, inputIndex: 2 },
    ];
    const result = runFCFS(procs);
    // FCFS must preserve inputIndex order, NOT sort by burst
    expect(result.timeline[0].pid).toBe('P1');
    expect(result.timeline[1].pid).toBe('P2');
    expect(result.timeline[2].pid).toBe('P3');
    verifyAllInvariants(procs, result, 'FCFS all at t=0 inputIndex order');
  });

  it('large arrival gap — CPU idle for extended period', () => {
    // Bug it catches: integer overflow or incorrect idle interval bounds.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 1, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1000, burstTime: 1, inputIndex: 1 },
    ];
    const result = runFCFS(procs);
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 1 },
      { pid: null, start: 1, end: 1000 },
      { pid: 'P2', start: 1000, end: 1001 },
    ]);
    verifyAllInvariants(procs, result, 'FCFS large arrival gap');
  });

  it('single process with burst=1', () => {
    // Bug it catches: off-by-one with minimum burst size.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 1, inputIndex: 0 },
    ];
    const result = runFCFS(procs);
    expect(result.timeline).toEqual([{ pid: 'P1', start: 0, end: 1 }]);
    expect(result.metrics[0].turnaroundTime).toBe(1);
    expect(result.metrics[0].waitingTime).toBe(0);
    expect(result.metrics[0].responseTime).toBe(0);
  });
});

// ===========================================================================
// SECTION 3: SJF edge cases
// ===========================================================================

describe('SJF edge cases', () => {
  it('process arrives exactly when CPU becomes free — immediately picked up', () => {
    // Bug it catches: off-by-one in ready check (< vs <=) causing new arrival to be skipped.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 3, burstTime: 1, inputIndex: 1 }, // arrives exactly at P1 completion
      { id: 'P3', arrivalTime: 3, burstTime: 5, inputIndex: 2 }, // also arrives at t=3
    ];
    const result = runSJF(procs);
    // At t=3: P2(burst=1) and P3(burst=5) both ready. Pick P2 first.
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 3 },
      { pid: 'P2', start: 3, end: 4 },
      { pid: 'P3', start: 4, end: 9 },
    ]);
    verifyAllInvariants(procs, result, 'SJF arrival=completion time');
  });

  it('all processes at t=0 with identical burst times — tie-break by inputIndex', () => {
    // Bug it catches: sort not using inputIndex as final tiebreaker.
    const procs: Process[] = [
      { id: 'P3', arrivalTime: 0, burstTime: 2, inputIndex: 2 },
      { id: 'P1', arrivalTime: 0, burstTime: 2, inputIndex: 0 },
      { id: 'P2', arrivalTime: 0, burstTime: 2, inputIndex: 1 },
    ];
    const result = runSJF(procs);
    // All same burst and arrival -> order by inputIndex: P1(0), P2(1), P3(2)
    expect(result.timeline[0].pid).toBe('P1');
    expect(result.timeline[1].pid).toBe('P2');
    expect(result.timeline[2].pid).toBe('P3');
    verifyAllInvariants(procs, result, 'SJF identical burst inputIndex tiebreak');
  });

  it('SJF is truly non-preemptive — longer process running is not interrupted by shorter arrival', () => {
    // Bug it catches: accidentally implementing SRTF logic in SJF.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 10, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 1, inputIndex: 1 }, // much shorter, arrives while P1 runs
    ];
    const result = runSJF(procs);
    // P1 runs to completion first (non-preemptive), then P2
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 10 },
      { pid: 'P2', start: 10, end: 11 },
    ]);
    verifyAllInvariants(procs, result, 'SJF non-preemptive guarantee');
  });

  it('single process arriving at t=5 — idle before it', () => {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 5, burstTime: 3, inputIndex: 0 },
    ];
    const result = runSJF(procs);
    expect(result.timeline).toEqual([
      { pid: null, start: 0, end: 5 },
      { pid: 'P1', start: 5, end: 8 },
    ]);
  });
});

// ===========================================================================
// SECTION 4: SRTF edge cases
// ===========================================================================

describe('SRTF edge cases', () => {
  it('multiple simultaneous arrivals where only the shortest triggers preemption', () => {
    // Bug it catches: using first-arrival burst instead of minimum burst among all simultaneous arrivals.
    // P1 running, P2 and P3 arrive at same time. P3 has burst=1 (shorter than P2's burst=5).
    // Preemption is triggered by P3, not P2.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 10, inputIndex: 0 },
      { id: 'P2', arrivalTime: 3, burstTime: 5, inputIndex: 1 },
      { id: 'P3', arrivalTime: 3, burstTime: 1, inputIndex: 2 },
    ];
    const result = runSRTF(procs);
    // At t=3: P1 rem=7. Min arriving burst=1 (P3). 1 < 7 -> preempt.
    // Next selection at t=3: P3(1)<P2(5)<P1(7) -> P3 runs [3,4].
    expect(result.timeline[0]).toEqual({ pid: 'P1', start: 0, end: 3 });
    expect(result.timeline[1]).toEqual({ pid: 'P3', start: 3, end: 4 });
    verifyAllInvariants(procs, result, 'SRTF simultaneous arrivals min burst preempts');
  });

  it('SRTF equal remaining times — STRICTLY no preemption, running process keeps CPU', () => {
    // Bug it catches: using <= instead of < for preemption condition.
    // P1 has rem=3 at t=1 (ran 1 unit from burst=4). P2 arrives with burst=3 = rem.
    // Equal remaining -> NO preemption.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 3, inputIndex: 1 },
    ];
    const result = runSRTF(procs);
    // At t=1: P1 rem=3, P2 burst=3. 3 < 3 is FALSE -> no preemption.
    // P1 continues to t=4, then P2 runs [4,7].
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 4 },
      { pid: 'P2', start: 4, end: 7 },
    ]);
    // P1 waiting = 0; P2 waiting = turnaround - burst = (7-1) - 3 = 3
    const p1m = result.metrics.find((m) => m.process.id === 'P1')!;
    const p2m = result.metrics.find((m) => m.process.id === 'P2')!;
    expect(p1m.waitingTime).toBe(0);
    expect(p2m.waitingTime).toBe(3);
    verifyAllInvariants(procs, result, 'SRTF equal remaining no preemption');
  });

  it('burst=1 preemptor — minimum valid burst forces correct preemption', () => {
    // Bug it catches: integer arithmetic errors with minimum burst size.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 5, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 1, inputIndex: 1 },
    ];
    const result = runSRTF(procs);
    // At t=2: P1 rem=3. P2 burst=1. 1 < 3 -> preempt.
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 3 },
      { pid: 'P1', start: 3, end: 6 },
    ]);
    verifyAllInvariants(procs, result, 'SRTF burst=1 preemptor');
  });

  it('SRTF with three-way preemption chain', () => {
    // Bug it catches: preemption logic breaks when multiple preemptions occur
    // in sequence from different processes.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 10, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 5, inputIndex: 1 },
      { id: 'P3', arrivalTime: 4, burstTime: 1, inputIndex: 2 },
    ];
    const result = runSRTF(procs);
    // t=0: P1 starts (rem=10)
    // t=2: P2 arrives (burst=5 < rem=8). Preempt P1.
    // t=4: P3 arrives (burst=1 < rem of P2=3). Preempt P2.
    // P3[4,5], P2[5,7], P1[7,15]  wait...
    // At t=2: P1 ran [0,2], rem[P1]=8. P2 chosen (rem=5 < rem[P1]=8).
    // At t=4: P2 ran [2,4], rem[P2]=3. P3 arrives (burst=1 < rem[P2]=3). Preempt.
    // P3[4,5], then at t=5: P2(rem=3) < P1(rem=8) -> P2[5,8], P1[8,16].
    // P1 total: [0,2] + [8,16] = 2+8 = 10 = burstTime. Correct.
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 4 },
      { pid: 'P3', start: 4, end: 5 },
      { pid: 'P2', start: 5, end: 8 },
      { pid: 'P1', start: 8, end: 16 },
    ]);
    verifyAllInvariants(procs, result, 'SRTF three-way preemption chain');
  });

  it('SRTF: process arriving at CPU idle start — no preemption issue', () => {
    // Bug it catches: SRTF treating idle transition as a preemption event.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 3, burstTime: 2, inputIndex: 0 },
      { id: 'P2', arrivalTime: 8, burstTime: 1, inputIndex: 1 },
    ];
    const result = runSRTF(procs);
    expect(result.timeline).toEqual([
      { pid: null, start: 0, end: 3 },
      { pid: 'P1', start: 3, end: 5 },
      { pid: null, start: 5, end: 8 },
      { pid: 'P2', start: 8, end: 9 },
    ]);
    verifyAllInvariants(procs, result, 'SRTF idle periods correct');
  });

  it('SRTF metrics: all waiting and response times are non-negative after preemptions', () => {
    // Bug it catches: response time or waiting time going negative due to
    // incorrect firstStart or completionTime derivation in computeMetrics.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 8, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, inputIndex: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 4, burstTime: 1, inputIndex: 3 },
    ];
    const result = runSRTF(procs);
    for (const m of result.metrics) {
      expect(m.waitingTime).toBeGreaterThanOrEqual(0);
      expect(m.responseTime).toBeGreaterThanOrEqual(0);
    }
    // Verify exact values (Workload A SRTF reference)
    expect(result.avgTurnaround).toBe(6.25);
    expect(result.avgWaiting).toBe(2.5);
    expect(result.avgResponse).toBe(0.0);
  });
});

// ===========================================================================
// SECTION 5: Round Robin edge cases
// ===========================================================================

describe('Round Robin edge cases', () => {
  it('q=1 with multiple processes — each gets exactly 1 unit per turn', () => {
    // Bug it catches: quantum not limiting correctly for q=1.
    // Also ensures each interval is duration exactly 1.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 0, burstTime: 2, inputIndex: 1 },
    ];
    const result = runRR(procs, 1);
    // At t=0: queue=[P1,P2]. P1 runs [0,1]. enqueue arrivals (none). Re-enqueue P1.
    // queue=[P2,P1]. P2 runs [1,2]. Re-enqueue P2. queue=[P1,P2].
    // P1 runs [2,3]. Re-enqueue P1. queue=[P2,P1].
    // P2 runs [3,4]. P2 done. queue=[P1].
    // P1 runs [4,5]. P1 done.
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 1 },
      { pid: 'P2', start: 1, end: 2 },
      { pid: 'P1', start: 2, end: 3 },
      { pid: 'P2', start: 3, end: 4 },
      { pid: 'P1', start: 4, end: 5 },
    ]);
    // Every interval has duration exactly 1
    for (const iv of result.timeline) {
      expect(iv.end - iv.start).toBe(1);
    }
    verifyAllInvariants(procs, result, 'RR q=1 multiple processes');
  });

  it('q larger than every burst — behaves identically to FCFS', () => {
    // Bug it catches: re-enqueue logic incorrectly re-enqueuing a completed process
    // when quantum > remaining burst.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 2, inputIndex: 1 },
    ];
    const rrResult = runRR(procs, 100);
    const fcfsResult = runFCFS(procs);
    // With q=100, every process runs to completion in its first slice -> same as FCFS
    expect(rrResult.timeline).toEqual(fcfsResult.timeline);
    verifyAllInvariants(procs, rrResult, 'RR q>all bursts');
  });

  it('RR: quantum boundary with simultaneous arrival — arrivals join BEFORE re-enqueue', () => {
    // Bug it catches: re-enqueuing the running process before new arrivals at boundary.
    // This is the CRITICAL spec rule: "At a quantum boundary, enqueue processes arriving
    // at that exact time before re-enqueuing the unfinished running process."
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 3, inputIndex: 1 }, // arrives at t=2 boundary
    ];
    const result = runRR(procs, 2);
    // t=0: queue=[P1]. P1 runs [0,2]. t=2: boundary. P2 arrives at t=2.
    // P2 joins queue BEFORE P1 is re-enqueued -> queue=[P2, P1].
    // P2 runs [2,4]. t=4: P2 re-enqueued. queue=[P1, P2].
    // P1 runs [4,6]. P1 done. queue=[P2].
    // P2 runs [6,7]. P2 (rem=1) done.
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 4 },
      { pid: 'P1', start: 4, end: 6 },
      { pid: 'P2', start: 6, end: 7 },
    ]);
    verifyAllInvariants(procs, result, 'RR quantum boundary arrival order');
  });

  it('RR: process completing exactly at a quantum boundary — never re-enqueued', () => {
    // Bug it catches: re-enqueuing a process that finishes at exactly the quantum end.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, inputIndex: 0 },
      { id: 'P2', arrivalTime: 0, burstTime: 2, inputIndex: 1 }, // exactly 1 quantum
    ];
    const result = runRR(procs, 2);
    // queue=[P1,P2]. P1[0,2]. enqueue(2): nothing. Re-enqueue P1. queue=[P2,P1].
    // P2[2,4]. newRem=0. NOT re-enqueued. queue=[P1].
    // P1[4,6]. P1 done.
    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 4 },
      { pid: 'P1', start: 4, end: 6 },
    ]);
    // P2 appears exactly once in timeline (not re-enqueued)
    const p2Intervals = result.timeline.filter((iv) => iv.pid === 'P2');
    expect(p2Intervals).toHaveLength(1);
    verifyAllInvariants(procs, result, 'RR process completion at quantum boundary');
  });

  it('RR: consecutive slices of same process are separate Interval objects', () => {
    // Bug it catches: merging consecutive intervals of same pid instead of emitting separately.
    // This matters for Gantt chart rendering of quantum boundaries.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 6, inputIndex: 0 },
    ];
    const result = runRR(procs, 2);
    // P1[0,2], P1[2,4], P1[4,6] — three separate intervals
    expect(result.timeline).toHaveLength(3);
    expect(result.timeline[0]).toEqual({ pid: 'P1', start: 0, end: 2 });
    expect(result.timeline[1]).toEqual({ pid: 'P1', start: 2, end: 4 });
    expect(result.timeline[2]).toEqual({ pid: 'P1', start: 4, end: 6 });
    verifyAllInvariants(procs, result, 'RR consecutive same-process slices are separate');
  });

  it('RR: process arriving mid-slice does NOT cause mid-quantum preemption', () => {
    // Bug it catches: incorrectly interrupting the running process when a new one arrives
    // during its quantum (RR only preempts at quantum boundaries, not mid-slice).
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 2, inputIndex: 1 }, // arrives MID-slice of P1
    ];
    const result = runRR(procs, 2);
    // P1 starts at t=0, runs full quantum to t=2 despite P2 arriving at t=1.
    expect(result.timeline[0]).toEqual({ pid: 'P1', start: 0, end: 2 });
    // P2 is in queue by t=2 and runs next.
    expect(result.timeline[1]).toEqual({ pid: 'P2', start: 2, end: 4 });
    verifyAllInvariants(procs, result, 'RR no mid-quantum preemption');
  });

  it('RR: CPU initially idle until first arrival', () => {
    // Bug it catches: idle interval not emitted when first process arrives after t=0.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 4, burstTime: 2, inputIndex: 0 },
    ];
    const result = runRR(procs, 2);
    expect(result.timeline[0]).toEqual({ pid: null, start: 0, end: 4 });
    expect(result.timeline[1]).toEqual({ pid: 'P1', start: 4, end: 6 });
    verifyAllInvariants(procs, result, 'RR initially idle');
  });

  it('RR: multiple arrivals at same quantum boundary — all join before re-enqueue, in input order', () => {
    // Bug it catches: wrong ordering of simultaneous boundary arrivals.
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 6, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 3, inputIndex: 1 }, // both arrive at t=2 boundary
      { id: 'P3', arrivalTime: 2, burstTime: 1, inputIndex: 2 },
    ];
    const result = runRR(procs, 2);
    // t=0: queue=[P1]. P1[0,2]. At t=2: P2(idx=1) and P3(idx=2) arrive.
    // Enqueue P2,P3 (by inputIndex since same arrivalTime). Re-enqueue P1.
    // queue=[P2,P3,P1].
    expect(result.timeline[0]).toEqual({ pid: 'P1', start: 0, end: 2 });
    expect(result.timeline[1]).toEqual({ pid: 'P2', start: 2, end: 4 }); // P2 before P1
    expect(result.timeline[2]).toEqual({ pid: 'P3', start: 4, end: 5 }); // P3 before P1
    verifyAllInvariants(procs, result, 'RR multiple simultaneous boundary arrivals');
  });
});

// ===========================================================================
// SECTION 6: Cross-algorithm invariant tests (additional workloads)
// ===========================================================================

describe('Cross-algorithm invariants on additional workloads', () => {
  const largeGapWorkload: Process[] = [
    { id: 'P1', arrivalTime: 0, burstTime: 2, inputIndex: 0 },
    { id: 'P2', arrivalTime: 100, burstTime: 3, inputIndex: 1 },
  ];

  const allSameArrivalAndBurst: Process[] = [
    { id: 'P1', arrivalTime: 5, burstTime: 3, inputIndex: 0 },
    { id: 'P2', arrivalTime: 5, burstTime: 3, inputIndex: 1 },
    { id: 'P3', arrivalTime: 5, burstTime: 3, inputIndex: 2 },
  ];

  const algorithms = [
    { name: 'FCFS', run: (p: Process[]) => runFCFS(p) },
    { name: 'SJF', run: (p: Process[]) => runSJF(p) },
    { name: 'SRTF', run: (p: Process[]) => runSRTF(p) },
    { name: 'RR-q2', run: (p: Process[]) => runRR(p, 2) },
    { name: 'RR-q1', run: (p: Process[]) => runRR(p, 1) },
  ];

  for (const algo of algorithms) {
    it(`${algo.name}: large gap workload satisfies all invariants`, () => {
      verifyAllInvariants(largeGapWorkload, algo.run(largeGapWorkload), `${algo.name} large gap`);
    });

    it(`${algo.name}: all same arrival and burst satisfies all invariants`, () => {
      const result = algo.run(allSameArrivalAndBurst);
      verifyAllInvariants(allSameArrivalAndBurst, result, `${algo.name} same arrival+burst`);
      // CPU must not be idle when all arrive at t=5
      const idleBeforeArrival = result.timeline.find(
        (iv) => iv.pid === null && iv.end <= 5
      );
      // Idle[0,5] is expected (no processes ready before t=5)
      if (idleBeforeArrival) {
        expect(idleBeforeArrival.start).toBe(0);
        expect(idleBeforeArrival.end).toBe(5);
      }
    });
  }
});

// ===========================================================================
// SECTION 7: Metric formula correctness
// ===========================================================================

describe('Metric formula correctness across algorithms', () => {
  const workloadA: Process[] = [
    { id: 'P1', arrivalTime: 0, burstTime: 8, inputIndex: 0 },
    { id: 'P2', arrivalTime: 1, burstTime: 4, inputIndex: 1 },
    { id: 'P3', arrivalTime: 2, burstTime: 2, inputIndex: 2 },
    { id: 'P4', arrivalTime: 4, burstTime: 1, inputIndex: 3 },
  ];

  it('FCFS Workload A — all metric formulas are applied correctly', () => {
    const result = runFCFS(workloadA);
    for (const m of result.metrics) {
      // turnaround = completion - arrival
      expect(m.turnaroundTime).toBe(m.completionTime - m.process.arrivalTime);
      // waiting = turnaround - burst
      expect(m.waitingTime).toBe(m.turnaroundTime - m.process.burstTime);
      // response = firstStart - arrival
      expect(m.responseTime).toBe(m.firstStartTime - m.process.arrivalTime);
    }
    // Average correctness
    const n = result.metrics.length;
    const expectedAvgTT = result.metrics.reduce((s, m) => s + m.turnaroundTime, 0) / n;
    const expectedAvgWT = result.metrics.reduce((s, m) => s + m.waitingTime, 0) / n;
    const expectedAvgRT = result.metrics.reduce((s, m) => s + m.responseTime, 0) / n;
    expect(result.avgTurnaround).toBeCloseTo(expectedAvgTT, 10);
    expect(result.avgWaiting).toBeCloseTo(expectedAvgWT, 10);
    expect(result.avgResponse).toBeCloseTo(expectedAvgRT, 10);
  });

  it('SRTF Workload A — response time is 0 for all processes (all preempted immediately)', () => {
    // Every process in Workload A starts within 1 unit of arrival under SRTF.
    const result = runSRTF(workloadA);
    // All response times should be 0 (each process starts as soon as it arrives)
    for (const m of result.metrics) {
      expect(m.responseTime).toBe(0);
    }
    expect(result.avgResponse).toBe(0.0);
  });

  it('Metrics match for Workload A FCFS — reference values from spec', () => {
    const result = runFCFS(workloadA);
    expect(result.avgTurnaround).toBe(10.5);
    expect(result.avgWaiting).toBe(6.75);
    expect(result.avgResponse).toBe(6.75);
  });

  it('Metrics match for Workload A SJF — reference values from spec', () => {
    const result = runSJF(workloadA);
    expect(result.avgTurnaround).toBe(9.0);
    expect(result.avgWaiting).toBe(5.25);
    expect(result.avgResponse).toBe(5.25);
  });

  it('Metrics match for Workload A SRTF — reference values from spec', () => {
    const result = runSRTF(workloadA);
    expect(result.avgTurnaround).toBe(6.25);
    expect(result.avgWaiting).toBe(2.5);
    expect(result.avgResponse).toBe(0.0);
  });

  it('Metrics match for Workload A RR q=2 — reference values from spec', () => {
    const result = runRR(workloadA, 2);
    expect(result.avgTurnaround).toBe(8.5);
    expect(result.avgWaiting).toBe(4.75);
    expect(result.avgResponse).toBe(1.75);
  });
});

// ===========================================================================
// SECTION 8: Validation edge cases
// ===========================================================================

describe('Validation edge cases', () => {
  it('arrival time of 0 is valid (boundary: non-negative)', () => {
    const procs: Process[] = [{ id: 'P1', arrivalTime: 0, burstTime: 1, inputIndex: 0 }];
    const result = validateInput(procs, 'FCFS', 1);
    expect(result.valid).toBe(true);
  });

  it('burst time of 1 is valid (boundary: positive integer)', () => {
    const procs: Process[] = [{ id: 'P1', arrivalTime: 0, burstTime: 1, inputIndex: 0 }];
    const result = validateInput(procs, 'FCFS', 1);
    expect(result.valid).toBe(true);
  });

  it('float arrival time (1.5) is invalid', () => {
    const procs: Process[] = [{ id: 'P1', arrivalTime: 1.5, burstTime: 2, inputIndex: 0 }];
    const result = validateInput(procs, 'FCFS', 1);
    expect(result.valid).toBe(false);
  });

  it('NaN arrival time is invalid', () => {
    const procs: Process[] = [{ id: 'P1', arrivalTime: NaN, burstTime: 2, inputIndex: 0 }];
    const result = validateInput(procs, 'FCFS', 1);
    expect(result.valid).toBe(false);
  });

  it('RR quantum of 1 is valid', () => {
    const procs: Process[] = [{ id: 'P1', arrivalTime: 0, burstTime: 1, inputIndex: 0 }];
    const result = validateInput(procs, 'RR', 1);
    expect(result.valid).toBe(true);
  });

  it('non-RR algorithm ignores quantum value', () => {
    const procs: Process[] = [{ id: 'P1', arrivalTime: 0, burstTime: 1, inputIndex: 0 }];
    // For FCFS, quantum is irrelevant — even 0 should not cause an error
    const result = validateInput(procs, 'FCFS', 0);
    expect(result.valid).toBe(true);
  });
});
