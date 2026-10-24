import type { SimulationResult } from '../scheduler/types';

/**
 * Formats a metric number cleanly (e.g. 6.75 or integer 6).
 */
export function formatMetric(val: number): string {
  if (Number.isInteger(val)) {
    return val.toString();
  }
  return Number(val.toFixed(2)).toString();
}

/**
 * Renders the results metrics table and average summary row.
 */
export function renderResultsTable(container: HTMLElement, result: SimulationResult): void {
  container.innerHTML = '';

  if (result.metrics.length === 0) {
    container.innerHTML = '<p class="empty-hint">No simulation results to display.</p>';
    return;
  }

  const tableWrapper = document.createElement('div');
  tableWrapper.className = 'table-responsive';

  const table = document.createElement('table');
  table.className = 'metrics-table';
  table.setAttribute('aria-label', 'Scheduling simulation results');

  // Thead
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th scope="col">Process ID</th>
      <th scope="col">Arrival Time</th>
      <th scope="col">CPU Burst</th>
      <th scope="col">First Start</th>
      <th scope="col">Completion</th>
      <th scope="col">Turnaround</th>
      <th scope="col">Waiting</th>
      <th scope="col">Response</th>
    </tr>
  `;
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement('tbody');
  for (const m of result.metrics) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="font-medium">${escapeHtml(m.process.id)}</td>
      <td>${m.process.arrivalTime}</td>
      <td>${m.process.burstTime}</td>
      <td>${m.firstStartTime}</td>
      <td>${m.completionTime}</td>
      <td>${m.turnaroundTime}</td>
      <td>${m.waitingTime}</td>
      <td>${m.responseTime}</td>
    `;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  // Tfoot (Averages summary row)
  const tfoot = document.createElement('tfoot');
  tfoot.innerHTML = `
    <tr class="summary-row">
      <th scope="row" colspan="5" class="summary-title">Average</th>
      <td class="summary-value" title="Average Turnaround Time">${formatMetric(result.avgTurnaround)}</td>
      <td class="summary-value" title="Average Waiting Time">${formatMetric(result.avgWaiting)}</td>
      <td class="summary-value" title="Average Response Time">${formatMetric(result.avgResponse)}</td>
    </tr>
  `;
  table.appendChild(tfoot);

  tableWrapper.appendChild(table);
  container.appendChild(tableWrapper);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
