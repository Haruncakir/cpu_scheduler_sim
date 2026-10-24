import { describe, it, expect } from 'vitest';
import { runSJF } from '../src/scheduler/sjf';
import type { Process } from '../src/scheduler/types';

describe('SJF Scheduler (Non-preemptive)', () => {
  it('executes Workload A correctly with exact timeline and metrics', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 8, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, inputIndex: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 4, burstTime: 1, inputIndex: 3 },
    ];

    const result = runSJF(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 8 },
      { pid: 'P4', start: 8, end: 9 },
      { pid: 'P3', start: 9, end: 11 },
      { pid: 'P2', start: 11, end: 15 },
    ]);

    expect(result.metrics).toEqual([
      { process: processes[0], firstStartTime: 0, completionTime: 8, turnaroundTime: 8, waitingTime: 0, responseTime: 0 },
      { process: processes[1], firstStartTime: 11, completionTime: 15, turnaroundTime: 14, waitingTime: 10, responseTime: 10 },
      { process: processes[2], firstStartTime: 9, completionTime: 11, turnaroundTime: 9, waitingTime: 7, responseTime: 7 },
      { process: processes[3], firstStartTime: 8, completionTime: 9, turnaroundTime: 5, waitingTime: 4, responseTime: 4 },
    ]);

    expect(result.avgTurnaround).toBe(9.0);
    expect(result.avgWaiting).toBe(5.25);
    expect(result.avgResponse).toBe(5.25);
  });

  it('executes Workload B correctly with exact timeline and metrics', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 2, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 1, inputIndex: 1 },
      { id: 'P3', arrivalTime: 8, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 9, burstTime: 1, inputIndex: 3 },
    ];

    const result = runSJF(processes);

    expect(result.timeline).toEqual([
      { pid: null, start: 0, end: 2 },
      { pid: 'P2', start: 2, end: 3 },
      { pid: 'P1', start: 3, end: 6 },
      { pid: null, start: 6, end: 8 },
      { pid: 'P3', start: 8, end: 10 },
      { pid: 'P4', start: 10, end: 11 },
    ]);

    expect(result.metrics).toEqual([
      { process: processes[0], firstStartTime: 3, completionTime: 6, turnaroundTime: 4, waitingTime: 1, responseTime: 1 },
      { process: processes[1], firstStartTime: 2, completionTime: 3, turnaroundTime: 1, waitingTime: 0, responseTime: 0 },
      { process: processes[2], firstStartTime: 8, completionTime: 10, turnaroundTime: 2, waitingTime: 0, responseTime: 0 },
      { process: processes[3], firstStartTime: 10, completionTime: 11, turnaroundTime: 2, waitingTime: 1, responseTime: 1 },
    ]);

    expect(result.avgTurnaround).toBe(2.25);
    expect(result.avgWaiting).toBe(0.5);
    expect(result.avgResponse).toBe(0.5);
  });

  it('breaks ties for identical burst lengths by arrivalTime then inputIndex', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 2, inputIndex: 1 },
      { id: 'P3', arrivalTime: 1, burstTime: 2, inputIndex: 2 },
    ];

    const result = runSJF(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 4 },
      { pid: 'P2', start: 4, end: 6 },
      { pid: 'P3', start: 6, end: 8 },
    ]);
  });

  it('handles a single process', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 3, burstTime: 5, inputIndex: 0 },
    ];

    const result = runSJF(processes);

    expect(result.timeline).toEqual([
      { pid: null, start: 0, end: 3 },
      { pid: 'P1', start: 3, end: 8 },
    ]);
  });
});
