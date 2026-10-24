import { describe, it, expect } from 'vitest';
import { runFCFS } from '../src/scheduler/fcfs';
import type { Process } from '../src/scheduler/types';

describe('FCFS Scheduler', () => {
  it('executes Workload A correctly with exact timeline and metrics', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 8, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: 4, inputIndex: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 4, burstTime: 1, inputIndex: 3 },
    ];

    const result = runFCFS(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 8 },
      { pid: 'P2', start: 8, end: 12 },
      { pid: 'P3', start: 12, end: 14 },
      { pid: 'P4', start: 14, end: 15 },
    ]);

    expect(result.metrics).toEqual([
      { process: processes[0], firstStartTime: 0, completionTime: 8, turnaroundTime: 8, waitingTime: 0, responseTime: 0 },
      { process: processes[1], firstStartTime: 8, completionTime: 12, turnaroundTime: 11, waitingTime: 7, responseTime: 7 },
      { process: processes[2], firstStartTime: 12, completionTime: 14, turnaroundTime: 12, waitingTime: 10, responseTime: 10 },
      { process: processes[3], firstStartTime: 14, completionTime: 15, turnaroundTime: 11, waitingTime: 10, responseTime: 10 },
    ]);

    expect(result.avgTurnaround).toBe(10.5);
    expect(result.avgWaiting).toBe(6.75);
    expect(result.avgResponse).toBe(6.75);
  });

  it('executes Workload B correctly with exact timeline and metrics', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 2, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 2, burstTime: 1, inputIndex: 1 },
      { id: 'P3', arrivalTime: 8, burstTime: 2, inputIndex: 2 },
      { id: 'P4', arrivalTime: 9, burstTime: 1, inputIndex: 3 },
    ];

    const result = runFCFS(processes);

    expect(result.timeline).toEqual([
      { pid: null, start: 0, end: 2 },
      { pid: 'P1', start: 2, end: 5 },
      { pid: 'P2', start: 5, end: 6 },
      { pid: null, start: 6, end: 8 },
      { pid: 'P3', start: 8, end: 10 },
      { pid: 'P4', start: 10, end: 11 },
    ]);

    expect(result.metrics).toEqual([
      { process: processes[0], firstStartTime: 2, completionTime: 5, turnaroundTime: 3, waitingTime: 0, responseTime: 0 },
      { process: processes[1], firstStartTime: 5, completionTime: 6, turnaroundTime: 4, waitingTime: 3, responseTime: 3 },
      { process: processes[2], firstStartTime: 8, completionTime: 10, turnaroundTime: 2, waitingTime: 0, responseTime: 0 },
      { process: processes[3], firstStartTime: 10, completionTime: 11, turnaroundTime: 2, waitingTime: 1, responseTime: 1 },
    ]);

    expect(result.avgTurnaround).toBe(2.75);
    expect(result.avgWaiting).toBe(1.0);
    expect(result.avgResponse).toBe(1.0);
  });

  it('TC-1: handles idle gap between processes', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 2, inputIndex: 0 },
      { id: 'P2', arrivalTime: 5, burstTime: 3, inputIndex: 1 },
    ];

    const result = runFCFS(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 2 },
      { pid: null, start: 2, end: 5 },
      { pid: 'P2', start: 5, end: 8 },
    ]);
  });

  it('TC-2: handles simultaneous arrivals tie resolved by inputIndex', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 0, burstTime: 2, inputIndex: 1 },
      { id: 'P3', arrivalTime: 0, burstTime: 1, inputIndex: 2 },
    ];

    const result = runFCFS(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 3 },
      { pid: 'P2', start: 3, end: 5 },
      { pid: 'P3', start: 5, end: 6 },
    ]);
  });

  it('handles a single process', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 5, inputIndex: 0 },
    ];

    const result = runFCFS(processes);

    expect(result.timeline).toEqual([
      { pid: 'P1', start: 0, end: 5 },
    ]);
    expect(result.metrics[0].turnaroundTime).toBe(5);
    expect(result.metrics[0].waitingTime).toBe(0);
    expect(result.metrics[0].responseTime).toBe(0);
  });

  it('handles CPU initially idle when first process arrives after t=0', () => {
    const processes: Process[] = [
      { id: 'P1', arrivalTime: 3, burstTime: 4, inputIndex: 0 },
    ];

    const result = runFCFS(processes);

    expect(result.timeline).toEqual([
      { pid: null, start: 0, end: 3 },
      { pid: 'P1', start: 3, end: 7 },
    ]);
  });
});
