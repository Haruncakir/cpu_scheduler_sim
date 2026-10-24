import type { Process } from './types';

export type ValidationResult = { valid: true } | { valid: false; errors: string[] };

const VALID_ALGORITHMS = new Set(['FCFS', 'SJF', 'SRTF', 'RR']);

/**
 * Validates input processes, chosen algorithm, and RR quantum.
 * Returns { valid: true } or { valid: false, errors: string[] } with clear error explanations.
 */
export function validateInput(
  processes: Process[],
  algorithm: string,
  quantum: number
): ValidationResult {
  const errors: string[] = [];

  // Validate algorithm
  if (!VALID_ALGORITHMS.has(algorithm)) {
    errors.push(`Unknown algorithm: "${algorithm}". Supported algorithms are FCFS, SJF, SRTF, RR.`);
  }

  // Validate RR quantum
  if (algorithm === 'RR') {
    if (!Number.isInteger(quantum) || quantum <= 0) {
      errors.push(`Round-robin quantum must be a positive integer (received: ${quantum}).`);
    }
  }

  // Validate process count
  if (processes.length === 0) {
    errors.push('At least one process must be provided.');
  }

  // Validate individual processes and check uniqueness
  const seenIds = new Set<string>();

  for (let i = 0; i < processes.length; i++) {
    const p = processes[i];
    const procDesc = p.id?.trim() ? `Process "${p.id.trim()}"` : `Process at position ${i + 1}`;

    if (!p.id || p.id.trim() === '') {
      errors.push(`Process ID cannot be empty (at row ${i + 1}).`);
    } else {
      const trimmedId = p.id.trim();
      if (seenIds.has(trimmedId)) {
        errors.push(`Duplicate process ID: "${trimmedId}". All process IDs must be unique.`);
      } else {
        seenIds.add(trimmedId);
      }
    }

    if (!Number.isInteger(p.arrivalTime) || p.arrivalTime < 0) {
      errors.push(`${procDesc} arrival time must be a nonnegative integer (received: ${p.arrivalTime}).`);
    }

    if (!Number.isInteger(p.burstTime) || p.burstTime <= 0) {
      errors.push(`${procDesc} CPU burst must be a positive integer (received: ${p.burstTime}).`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true };
}
