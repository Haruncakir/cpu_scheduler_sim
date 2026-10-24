import { describe, it, expect } from 'vitest';
import { validateInput } from '../src/scheduler/validate';
import type { Process } from '../src/scheduler/types';

describe('Input Validation', () => {
  const validProcesses: Process[] = [
    { id: 'P1', arrivalTime: 0, burstTime: 5, inputIndex: 0 },
    { id: 'P2', arrivalTime: 2, burstTime: 3, inputIndex: 1 },
  ];

  it('validates a completely valid FCFS input', () => {
    const result = validateInput(validProcesses, 'FCFS', 1);
    expect(result.valid).toBe(true);
  });

  it('validates a completely valid RR input with positive integer quantum', () => {
    const result = validateInput(validProcesses, 'RR', 2);
    expect(result.valid).toBe(true);
  });

  it('fails when process list is empty', () => {
    const result = validateInput([], 'FCFS', 1);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toContain('At least one process must be provided.');
    }
  });

  it('fails when process ID is empty or whitespace', () => {
    const procs: Process[] = [
      { id: '  ', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
    ];
    const result = validateInput(procs, 'FCFS', 1);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Process ID cannot be empty'))).toBe(true);
    }
  });

  it('fails when process IDs are duplicated', () => {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 3, inputIndex: 0 },
      { id: 'P1', arrivalTime: 1, burstTime: 2, inputIndex: 1 },
    ];
    const result = validateInput(procs, 'FCFS', 1);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Duplicate process ID: "P1"'))).toBe(true);
    }
  });

  it('fails when arrivalTime is negative or non-integer', () => {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: -1, burstTime: 3, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1.5, burstTime: 2, inputIndex: 1 },
    ];
    const result = validateInput(procs, 'FCFS', 1);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('P1') && e.includes('nonnegative integer'))).toBe(true);
      expect(result.errors.some((e) => e.includes('P2') && e.includes('nonnegative integer'))).toBe(true);
    }
  });

  it('fails when burstTime is 0, negative, or non-integer', () => {
    const procs: Process[] = [
      { id: 'P1', arrivalTime: 0, burstTime: 0, inputIndex: 0 },
      { id: 'P2', arrivalTime: 1, burstTime: -2, inputIndex: 1 },
      { id: 'P3', arrivalTime: 2, burstTime: 2.5, inputIndex: 2 },
    ];
    const result = validateInput(procs, 'FCFS', 1);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('P1') && e.includes('positive integer'))).toBe(true);
      expect(result.errors.some((e) => e.includes('P2') && e.includes('positive integer'))).toBe(true);
      expect(result.errors.some((e) => e.includes('P3') && e.includes('positive integer'))).toBe(true);
    }
  });

  it('fails when algorithm is unknown', () => {
    const result = validateInput(validProcesses, 'UNKNOWN_ALGO', 1);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors.some((e) => e.includes('Unknown algorithm'))).toBe(true);
    }
  });

  it('fails when RR quantum is non-positive or non-integer', () => {
    const resZero = validateInput(validProcesses, 'RR', 0);
    expect(resZero.valid).toBe(false);
    if (!resZero.valid) {
      expect(resZero.errors.some((e) => e.includes('quantum must be a positive integer'))).toBe(true);
    }

    const resDec = validateInput(validProcesses, 'RR', 1.5);
    expect(resDec.valid).toBe(false);

    const resNeg = validateInput(validProcesses, 'RR', -2);
    expect(resNeg.valid).toBe(false);
  });
});
