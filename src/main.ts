import './style.css';
import type { Process, SimulationResult } from './scheduler/types';
import { runFCFS } from './scheduler/fcfs';
import { runSJF } from './scheduler/sjf';
import { runSRTF } from './scheduler/srtf';
import { runRR } from './scheduler/rr';
import { validateInput } from './scheduler/validate';
import { renderGanttChart } from './ui/gantt';
import { renderResultsTable } from './ui/table';

// Pre-defined Workloads
const WORKLOAD_A: Omit<Process, 'inputIndex'>[] = [
  { id: 'P1', arrivalTime: 0, burstTime: 8 },
  { id: 'P2', arrivalTime: 1, burstTime: 4 },
  { id: 'P3', arrivalTime: 2, burstTime: 2 },
  { id: 'P4', arrivalTime: 4, burstTime: 1 },
];

const WORKLOAD_B: Omit<Process, 'inputIndex'>[] = [
  { id: 'P1', arrivalTime: 2, burstTime: 3 },
  { id: 'P2', arrivalTime: 2, burstTime: 1 },
  { id: 'P3', arrivalTime: 8, burstTime: 2 },
  { id: 'P4', arrivalTime: 9, burstTime: 1 },
];

// DOM elements
const processTbody = document.getElementById('process-tbody') as HTMLTableSectionElement;
const btnAddProcess = document.getElementById('btn-add-process') as HTMLButtonElement;
const btnLoadA = document.getElementById('btn-load-a') as HTMLButtonElement;
const btnLoadB = document.getElementById('btn-load-b') as HTMLButtonElement;
const algoSelect = document.getElementById('algo-select') as HTMLSelectElement;
const quantumField = document.getElementById('quantum-field') as HTMLElement;
const quantumInput = document.getElementById('quantum-input') as HTMLInputElement;
const btnRun = document.getElementById('btn-run') as HTMLButtonElement;
const validationErrors = document.getElementById('validation-errors') as HTMLElement;
const resultsSection = document.getElementById('results-section') as HTMLElement;
const ganttContainer = document.getElementById('gantt-container') as HTMLElement;
const metricsContainer = document.getElementById('metrics-container') as HTMLElement;

let nextProcNumber = 1;

/**
 * Creates a DOM table row for a process.
 */
function createProcessRow(id = '', arrival = 0, burst = 1): HTMLTableRowElement {
  const tr = document.createElement('tr');
  tr.className = 'proc-row';

  tr.innerHTML = `
    <td>
      <input
        type="text"
        class="form-control proc-id"
        aria-label="Process ID"
        value="${escapeAttr(id)}"
        placeholder="e.g. P1"
      />
    </td>
    <td>
      <input
        type="number"
        class="form-control proc-arrival"
        aria-label="Arrival Time"
        min="0"
        step="1"
        value="${arrival}"
      />
    </td>
    <td>
      <input
        type="number"
        class="form-control proc-burst"
        aria-label="CPU Burst"
        min="1"
        step="1"
        value="${burst}"
      />
    </td>
    <td>
      <button type="button" class="btn btn-danger-outline btn-remove-row" aria-label="Remove process">
        Remove
      </button>
    </td>
  `;

  const removeBtn = tr.querySelector('.btn-remove-row') as HTMLButtonElement;
  removeBtn.addEventListener('click', () => {
    tr.remove();
  });

  return tr;
}

/**
 * Populates the table with a given list of processes.
 */
function loadProcesses(list: Omit<Process, 'inputIndex'>[]): void {
  processTbody.innerHTML = '';
  for (const item of list) {
    processTbody.appendChild(createProcessRow(item.id, item.arrivalTime, item.burstTime));
  }
  nextProcNumber = list.length + 1;
}

/**
 * Reads and parses processes from the table rows.
 */
function readProcessesFromTable(): Process[] {
  const rows = Array.from(processTbody.querySelectorAll<HTMLTableRowElement>('.proc-row'));
  return rows.map((tr, index) => {
    const idInput = tr.querySelector('.proc-id') as HTMLInputElement;
    const arrivalInput = tr.querySelector('.proc-arrival') as HTMLInputElement;
    const burstInput = tr.querySelector('.proc-burst') as HTMLInputElement;

    const id = idInput ? idInput.value.trim() : '';
    const arrivalTime = arrivalInput && arrivalInput.value !== '' ? Number(arrivalInput.value) : NaN;
    const burstTime = burstInput && burstInput.value !== '' ? Number(burstInput.value) : NaN;

    return {
      id,
      arrivalTime,
      burstTime,
      inputIndex: index,
    };
  });
}

/**
 * Updates UI visibility based on algorithm choice.
 */
function updateAlgoVisibility(): void {
  const isRR = algoSelect.value === 'RR';
  quantumField.style.display = isRR ? 'flex' : 'none';
}

/**
 * Handles running the simulation.
 */
function handleRunSimulation(): void {
  const processes = readProcessesFromTable();
  const algorithm = algoSelect.value;
  const quantum = quantumInput.value !== '' ? Number(quantumInput.value) : NaN;

  // Validate input
  const valResult = validateInput(processes, algorithm, quantum);

  if (!valResult.valid) {
    validationErrors.style.display = 'block';
    validationErrors.innerHTML = `
      <strong>Validation Error${valResult.errors.length > 1 ? 's' : ''}:</strong>
      <ul>
        ${valResult.errors.map((err) => `<li>${escapeHtml(err)}</li>`).join('')}
      </ul>
    `;
    resultsSection.style.display = 'none';
    return;
  }

  // Clear validation errors
  validationErrors.style.display = 'none';
  validationErrors.innerHTML = '';

  // Execute scheduling algorithm
  let result: SimulationResult;
  switch (algorithm) {
    case 'FCFS':
      result = runFCFS(processes);
      break;
    case 'SJF':
      result = runSJF(processes);
      break;
    case 'SRTF':
      result = runSRTF(processes);
      break;
    case 'RR':
      result = runRR(processes, quantum);
      break;
    default:
      return;
  }

  // Render results
  resultsSection.style.display = 'block';
  renderGanttChart(ganttContainer, result.timeline, processes.map((p) => p.id));
  renderResultsTable(metricsContainer, result);

  // Smoothly scroll results into view
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function escapeAttr(text: string): string {
  return text.replace(/"/g, '&quot;');
}

// Event Listeners
btnAddProcess.addEventListener('click', () => {
  const newRow = createProcessRow(`P${nextProcNumber}`, 0, 1);
  nextProcNumber++;
  processTbody.appendChild(newRow);
  const idInput = newRow.querySelector('.proc-id') as HTMLInputElement;
  if (idInput) idInput.focus();
});

btnLoadA.addEventListener('click', () => {
  loadProcesses(WORKLOAD_A);
});

btnLoadB.addEventListener('click', () => {
  loadProcesses(WORKLOAD_B);
});

algoSelect.addEventListener('change', updateAlgoVisibility);
btnRun.addEventListener('click', handleRunSimulation);

// Initial Setup: Load Workload A and initialize visibility
loadProcesses(WORKLOAD_A);
updateAlgoVisibility();
