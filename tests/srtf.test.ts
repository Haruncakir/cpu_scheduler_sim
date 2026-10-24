import { describe, it, expect } from 'vitest';
import { runSRTF } from '../src/scheduler/srtf';
import type { Process } from '../src/scheduler/types';

describe('SRTF Scheduler (Preemptive)', () => {
  it('executes Workload A correctly with exact timeline and metrics', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 8, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, inputIndex: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 4, burstTime: 1, inputIndex: 3 },
    ];

    const result = runSRTF(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 1 },
      { pid: 'P2', start: 1, end: 2 },
      { pid: 'P3', start: 2, end: 4 },
      { pid: 'P4', start: 4, end: 5 },
      { pid: 'P2', start: 5, end: 8 },
      { pid: 'P1', start: 8, end: 15 },
    ]);

    expect(result.metrics).toEqual([
      { process: processes[0], firstStartTime: 0, completionTime: 15, turnaroundTime: 15, waitingTime: 7, responseTime: 0 },
      { process: processes[1], firstStartTime: 1, completionTime: 8, turnaroundTime: 7, waitingTime: 3, responseTime: 0 },
      { process: processes[2], firstStartTime: 2, completionTime: 4, turnaroundTime: 2, waitingTime: 0, responseTime: 0 },
      { process: processes[3], firstStartTime: 4, completionTime: 5, turnaroundTime: 1, waitingTime: 0, responseTime: 0 },
    ]);

    expect(result.avgTurnaround).toBe(6.25);
    expect(result.avgWaiting).toBe(2.5);
    expect(result.avgResponse).toBe(0.0);
  });

  it('executes Workload B correctly (same as SJF for Workload B)', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 2, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 1, inputIndex: 1 },
      { id: 'P3', arrivalTime: 8, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 9, burstTime: 1, inputIndex: 3 },
    ];

    const result = runSRTF(processes);

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

  it('TC-3: preempts when new arrival has strictly shorter remaining time', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 10, inputIndex: 0 },
      { id: 'P2', arrivalTime: 3, burstTime: 2, inputIndex: 1 },
    ];

    const result = runSRTF(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 3 },
      { pid: 'P2', start: 3, end: 5 },
      { pid: 'P1', start: 5, end: 12 },
    ]);
  });

  it('TC-4: does NOT preempt on equal remaining time', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 4, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 2, inputIndex: 1 },
    ];

    const result = runSRTF(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 4 },
      { pid: 'P2', start: 4, end: 6 },
    ]);
  });

  it('handles process arriving during idle', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 5, burstTime: 3, inputIndex: 0 },
    ];

    const result = runSRTF(processes);

    expect(result.timeline).toEqual([
      { pid: null, start: 0, end: 5 },
      { pid: 'P1', start: 5, end: 8 },
    ]);
  });

  it('handles a process arriving after current completes', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 2, inputIndex: 0 },
      { id: 'P2', arrivalTime: 4, burstTime: 3, inputIndex: 1 },
    ];

    const result = runSRTF(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: null, start: 2, end: 4 },
      { pid: 'P2', start: 4, end: 7 },
    ]);
  });
});
