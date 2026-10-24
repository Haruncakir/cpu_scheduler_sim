export interface Process {
  id: string;
  arrivalTime: number;
  burstTime: number;
  inputIndex: number; // 0-based position in input list, for tie-breaking
}

export interface Interval {
  pid: string | null; // null = CPU idle
  start: number;      // inclusive
  end: number;        // exclusive
}

export interface ProcessMetrics {
  process: Process;
  firstStartTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
}

export interface SimulationResult {
  timeline: Interval[];
  metrics: ProcessMetrics[];
  avgTurnaround: number;
  avgWaiting: number;
  avgResponse: number;
}
