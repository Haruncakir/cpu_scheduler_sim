import { describe, it, expect } from 'vitest';
import { tieBreak, computeMetrics } from '../src/scheduler/utils';
import type { Process, Interval } from '../src/scheduler/types';

describe('Shared Utilities', () => {
  describe('tieBreak', () => {
    it('breaks ties by smaller arrivalTime first', () => {
      const p1: Process = { id: 'P1', arrivalTime: 1, burstTime: 4, inputIndex: 1 };
      const p2: Process = { id: 'P2', arrivalTime: 2, burstTime: 2, inputIndex: 0 };
      expect(tieBreak(p1, p2)).toBeLessThan(0);
      expect(tieBreak(p2, p1)).toBeGreaterThan(0);
    });

    it('breaks ties by smaller inputIndex when arrivalTimes are equal', () => {
      const p1: Process = { id: 'P1', arrivalTime: 2, burstTime: 3, inputIndex: 0 };
      const p2: Process = { id: 'P2', arrivalTime: 2, burstTime: 1, inputIndex: 1 };
      expect(tieBreak(p1, p2)).toBeLessThan(0);
      expect(tieBreak(p2, p1)).toBeGreaterThan(0);
    });

    it('returns 0 when arrivalTime and inputIndex are identical', () => {
      const p1: Process = { id: 'P1', arrivalTime: 2, burstTime: 3, inputIndex: 0 };
      const p2: Process = { id: 'P1_clone', arrivalTime: 2, burstTime: 5, inputIndex: 0 };
      expect(tieBreak(p1, p2)).toBe(0);
    });
  });

  describe('computeMetrics', () => {
    it('computes accurate process metrics and averages from timeline', () => {
      const processes: Process[] = [
        { id: 'P1', arrivalTime: 0, burstTime: 8, inputIndex: 0 },
        { id: 'P2', arrivalTime: 1, burstTime: 4, inputIndex: 1 },
        { id: 'P3', arrivalTime: 2, burstTime: 2, inputIndex: 2 },
        { id: 'P4', arrivalTime: 4, burstTime: 1, inputIndex: 3 },
      ];

      // Workload A FCFS Reference Timeline:
      // P1[0,8], P2[8,12], P3[12,14], P4[14,15]
      const timeline: Interval[] = [
        { pid: 'P1', start: 0, end: 8 },
        { pid: 'P2', start: 8, end: 12 },
        { pid: 'P3', start: 12, end: 14 },
        { pid: 'P4', start: 14, end: 15 },
      ];

      const result = computeMetrics(processes, timeline);

      expect(result.metrics).toEqual([
        {
          process: processes[0],
          firstStartTime: 0,
          completionTime: 8,
          turnaroundTime: 8,
          waitingTime: 0,
          responseTime: 0,
        },
        {
          process: processes[1],
          firstStartTime: 8,
          completionTime: 12,
          turnaroundTime: 11,
          waitingTime: 7,
          responseTime: 7,
        },
        {
          process: processes[2],
          firstStartTime: 12,
          completionTime: 14,
          turnaroundTime: 12,
          waitingTime: 10,
          responseTime: 10,
        },
        {
          process: processes[3],
          firstStartTime: 14,
          completionTime: 15,
          turnaroundTime: 11,
          waitingTime: 10,
          responseTime: 10,
        },
      ]);

      expect(result.avgTurnaround).toBe(10.5);
      expect(result.avgWaiting).toBe(6.75);
      expect(result.avgResponse).toBe(6.75);
    });

    it('handles preempted processes with multiple intervals correctly', () => {
      const processes: Process[] = [
        { id: 'P1', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
        { id: 'P2', arrivalTime: 1, burstTime: 1, inputIndex: 1 },
      ];

      // P1 runs [0,1], P2 runs [1,2], P1 runs [2,4]
      const timeline: Interval[] = [
        { pid: 'P1', start: 0, end: 1 },
        { pid: 'P2', start: 1, end: 2 },
        { pid: 'P1', start: 2, end: 4 },
      ];

      const result = computeMetrics(processes, timeline);

      // P1: firstStart = 0, completion = 4, turnaround = 4, waiting = 4 - 3 = 1, response = 0 - 0 = 0
      // P2: firstStart = 1, completion = 2, turnaround = 1, waiting = 1 - 1 = 0, response = 1 - 1 = 0
      expect(result.metrics[0].firstStartTime).toBe(0);
      expect(result.metrics[0].completionTime).toBe(4);
      expect(result.metrics[0].turnaroundTime).toBe(4);
      expect(result.metrics[0].waitingTime).toBe(1);
      expect(result.metrics[0].responseTime).toBe(0);

      expect(result.metrics[1].firstStartTime).toBe(1);
      expect(result.metrics[1].completionTime).toBe(2);
      expect(result.metrics[1].turnaroundTime).toBe(1);
      expect(result.metrics[1].waitingTime).toBe(0);
      expect(result.metrics[1].responseTime).toBe(0);
    });

    it('handles empty process list gracefully', () => {
      const result = computeMetrics([], []);
      expect(result.metrics).toEqual([]);
      expect(result.avgTurnaround).toBe(0);
      expect(result.avgWaiting).toBe(0);
      expect(result.avgResponse).toBe(0);
    });
  });
});
