import { describe, it, expect } from 'vitest';
import { runRR } from '../src/scheduler/rr';
import type { Process } from '../src/scheduler/types';

describe('Round Robin Scheduler', () => {
  it('executes Workload A correctly with q=2', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 8, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, inputIndex: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 4, burstTime: 1, inputIndex: 3 },
    ];

    const result = runRR(processes, 2);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 4 },
      { pid: 'P3', start: 4, end: 6 },
      { pid: 'P1', start: 6, end: 8 },
      { pid: 'P4', start: 8, end: 9 },
      { pid: 'P2', start: 9, end: 11 },
      { pid: 'P1', start: 11, end: 13 },
      { pid: 'P1', start: 13, end: 15 },
    ]);

    expect(result.metrics).toEqual([
      { process: processes[0], firstStartTime: 0, completionTime: 15, turnaroundTime: 15, waitingTime: 7, responseTime: 0 },
      { process: processes[1], firstStartTime: 2, completionTime: 11, turnaroundTime: 10, waitingTime: 6, responseTime: 1 },
      { process: processes[2], firstStartTime: 4, completionTime: 6, turnaroundTime: 4, waitingTime: 2, responseTime: 2 },
      { process: processes[3], firstStartTime: 8, completionTime: 9, turnaroundTime: 5, waitingTime: 4, responseTime: 4 },
    ]);

    expect(result.avgTurnaround).toBe(8.5);
    expect(result.avgWaiting).toBe(4.75);
    expect(result.avgResponse).toBe(1.75);
  });

  it('executes Workload B correctly with q=2', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 2, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 1, inputIndex: 1 },
      { id: 'P3', arrivalTime: 8, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 9, burstTime: 1, inputIndex: 3 },
    ];

    const result = runRR(processes, 2);

    expect(result.timeline).toEqual([
      { pid: null, start: 0, end: 2 },
      { pid: 'P1', start: 2, end: 4 },
      { pid: 'P2', start: 4, end: 5 },
      { pid: 'P1', start: 5, end: 6 },
      { pid: null, start: 6, end: 8 },
      { pid: 'P3', start: 8, end: 10 },
      { pid: 'P4', start: 10, end: 11 },
    ]);

    expect(result.metrics).toEqual([
      { process: processes[0], firstStartTime: 2, completionTime: 6, turnaroundTime: 4, waitingTime: 1, responseTime: 0 },
      { process: processes[1], firstStartTime: 4, completionTime: 5, turnaroundTime: 3, waitingTime: 2, responseTime: 2 },
      { process: processes[2], firstStartTime: 8, completionTime: 10, turnaroundTime: 2, waitingTime: 0, responseTime: 0 },
      { process: processes[3], firstStartTime: 10, completionTime: 11, turnaroundTime: 2, waitingTime: 1, responseTime: 1 },
    ]);

    expect(result.avgTurnaround).toBe(2.75);
    expect(result.avgWaiting).toBe(1.0);
    expect(result.avgResponse).toBe(0.75);
  });

  it('TC-1: handles idle gap with RR', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 2, inputIndex: 0 },
      { id: 'P2', arrivalTime: 5, burstTime: 3, inputIndex: 1 },
    ];

    const result = runRR(processes, 2);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: null, start: 2, end: 5 },
      { pid: 'P2', start: 5, end: 7 },
      { pid: 'P2', start: 7, end: 8 },
    ]);
  });

  it('enqueues arrivals at exact quantum boundary before re-enqueuing running process', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 2, inputIndex: 1 },
    ];

    // At t=0: P1 runs [0,2].
    // At t=2: boundary. P2 arrives at t=2. P2 is enqueued before P1 is re-enqueued.
    // Ready queue is [P2, P1].
    // P2 runs [2,4] and finishes.
    // P1 runs [4,6] and finishes.
    const result = runRR(processes, 2);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 4 },
      { pid: 'P1', start: 4, end: 6 },
    ]);
  });

  it('never rejoins a completed process at quantum boundary', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 2, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 2, inputIndex: 1 },
    ];

    // P1 runs [0,2], completes at t=2.
    // Queue should only have P2. P2 runs [2,4].
    const result = runRR(processes, 2);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 4 },
    ]);
  });

  it('splits consecutive slices of the same process into separate Interval objects', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 5, inputIndex: 0 },
    ];

    // Only P1. Slices of q=2: [0,2], [2,4], [4,5].
    const result = runRR(processes, 2);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: 'P1', start: 2, end: 4 },
      { pid: 'P1', start: 4, end: 5 },
    ]);
  });

  it('operates correctly with quantum = 1', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 2, inputIndex: 0 },
      { id: 'P2', arrivalTime: 0, burstTime: 2, inputIndex: 1 },
    ];

    const result = runRR(processes, 1);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 1 },
      { pid: 'P2', start: 1, end: 2 },
      { pid: 'P1', start: 2, end: 3 },
      { pid: 'P2', start: 3, end: 4 },
    ]);
  });
});
