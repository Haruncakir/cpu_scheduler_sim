# CPU Scheduling Simulator (CSE513 Assignment 1)

A browser-based CPU scheduling simulator built with TypeScript and Vite. Demonstrates CPU scheduling algorithms, execution timelines via an interactive Gantt chart, and performance metrics.

**Live Application**: [https://haruncakir.github.io/cpu_scheduler_sim/](https://haruncakir.github.io/cpu_scheduler_sim/)

---

## Implemented Scheduling Algorithms

1. **First-Come, First-Served (FCFS)**
   - Non-preemptive.
   - Selects earliest arriving process.
   - Ties broken by position in input list (`inputIndex`).

2. **Shortest Job First (SJF)**
   - Non-preemptive.
   - When CPU is free, selects ready process with smallest CPU burst time.
   - Ties broken by earlier arrival time, then input list position.

3. **Shortest Remaining Time First (SRTF)**
   - Preemptive and event-driven.
   - Preempts currently running process **only** when a newly arrived process has a **strictly shorter** remaining CPU burst.
   - On equal remaining time, the current running process continues without preemption.
   - Ties among ready processes broken by arrival time, then input list position.

4. **Round Robin (RR)**
   - Preemptive with configurable time quantum ($q \ge 1$).
   - Maintains a FIFO ready queue.
   - At a quantum boundary $t$:
     1. Enqueues all new arrivals occurring at or before $t$ (ordered by input index).
     2. Re-enqueues the unfinished running process. Completed processes never rejoin.
   - Consecutive time slices of the same process are preserved as distinct interval segments in the Gantt chart.

---

## Project Structure

```
├── CSE513-Assignment-1.pdf  # Authoritative assignment specification
├── index.html               # Main semantic HTML5 interface
├── package.json             # NPM project scripts and dependencies
├── tsconfig.json            # Strict TypeScript configuration
├── src/
│   ├── main.ts              # UI event handling, state, and simulation dispatch
│   ├── style.css            # Accessible, responsive CSS styling
│   ├── scheduler/
│   │   ├── types.ts         # Core scheduling interfaces (Process, Interval, Metrics)
│   │   ├── utils.ts         # Shared metric derivation and tie-breaking utilities
│   │   ├── fcfs.ts          # FCFS scheduling implementation
│   │   ├── sjf.ts           # Non-preemptive SJF implementation
│   │   ├── srtf.ts          # Event-driven preemptive SRTF implementation
│   │   ├── rr.ts            # Round Robin FIFO scheduling implementation
│   │   └── validate.ts      # Comprehensive input validation
│   └── ui/
│       ├── gantt.ts         # Proportional CSS flexbox Gantt chart & time axis
│       └── table.ts         # Results table & summary statistics
└── tests/
    ├── utils.test.ts        # Unit tests for shared tieBreak and computeMetrics
    ├── fcfs.test.ts         # FCFS unit tests (Workloads A, B, idle gap, ties)
    ├── sjf.test.ts          # SJF unit tests (Workloads A, B, ties)
    ├── srtf.test.ts         # SRTF unit tests (Workloads A, B, preemption, equal-time rule)
    ├── rr.test.ts           # RR unit tests (Workloads A, B, quantum boundary, q=1)
    ├── validate.test.ts     # Validation test suite
    ├── ui.test.ts           # UI helper test suite
    └── integration.test.ts  # Invariant tests across all algorithms × 5 workloads
```

---

## Prerequisites & Installation

- **Node.js**: v18.0.0 or higher
- **NPM**: v9.0.0 or higher

Clone the repository and install dependencies:
```bash
npm install
```

---

## Running the Simulator

### Local Development Server
Start the local development server:
```bash
npm run dev
```
Open your browser at the local URL printed in your terminal (typically `http://localhost:5173/`).

### Production Build
Compile TypeScript and bundle static assets into `dist/`:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

---

## Running Automated Tests

Run the test suite using Vitest:
```bash
npm test
```

Run test coverage report:
```bash
npm run test:coverage
```

Type-check without emitting:
```bash
npx tsc --noEmit
```

---

## Model Assumptions & Limitations

- **Single CPU**: Exactly one process executes on the CPU at any given time.
- **Zero Overhead**: Context switching and scheduling overhead are modeled as instantaneous (0 time units).
- **CPU Bursts Only**: Each process executes exactly one CPU burst with no I/O operations.
- **Time Units**: Discrete non-negative integer time units.
- **Interval Convention**: Slices are represented as half-open intervals $[start, end)$ where duration $= end - start$.
