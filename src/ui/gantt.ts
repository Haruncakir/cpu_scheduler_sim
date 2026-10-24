import type { Interval } from '../scheduler/types';

const PROCESS_COLORS: string[] = [
  '#2563eb', // Blue
  '#0d9488', // Teal
  '#d97706', // Amber
  '#7c3aed', // Violet
  '#059669', // Emerald
  '#db2777', // Pink
  '#4f46e5', // Indigo
  '#ea580c', // Orange
  '#0284c7', // Sky
  '#9333ea', // Purple
];

/**
 * Returns a stable color for a process ID.
 */
export function getProcessColor(pid: string, idList: string[]): string {
  const index = idList.indexOf(pid);
  if (index >= 0) {
    return PROCESS_COLORS[index % PROCESS_COLORS.length];
  }
  // Fallback hash
  let hash = 0;
  for (let i = 0; i < pid.length; i++) {
    hash = pid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PROCESS_COLORS[Math.abs(hash) % PROCESS_COLORS.length];
}

/**
 * Renders a flexible, proportional Gantt chart into the specified container element.
 */
export function renderGanttChart(container: HTMLElement, timeline: Interval[], processIds: string[]): void {
  container.innerHTML = '';

  if (timeline.length === 0) {
    container.innerHTML = '<p class="empty-hint">No timeline to display.</p>';
    return;
  }

  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'gantt-wrapper';

  const bar = document.createElement('div');
  bar.className = 'gantt-bar';
  bar.setAttribute('role', 'img');
  bar.setAttribute('aria-label', 'CPU execution Gantt chart');

  const axis = document.createElement('div');
  axis.className = 'gantt-axis';

  for (let i = 0; i < timeline.length; i++) {
    const interval = timeline[i];
    const duration = interval.end - interval.start;

    // Gantt slice block
    const block = document.createElement('div');
    block.className = 'gantt-block';
    block.style.flex = `${duration} 0 0%`;

    const isIdle = interval.pid === null;
    if (isIdle) {
      block.classList.add('gantt-block-idle');
      block.setAttribute('title', `CPU Idle: [${interval.start}, ${interval.end}) (${duration} units)`);
      block.innerHTML = `<span class="gantt-label">Idle</span><span class="gantt-duration">${duration}</span>`;
    } else {
      block.classList.add('gantt-block-proc');
      const color = getProcessColor(interval.pid!, processIds);
      block.style.backgroundColor = color;
      block.setAttribute('title', `${interval.pid}: [${interval.start}, ${interval.end}) (${duration} units)`);
      block.innerHTML = `<span class="gantt-label">${escapeHtml(interval.pid!)}</span><span class="gantt-duration">${duration}</span>`;
    }

    bar.appendChild(block);

    // Axis tick for this interval
    const tick = document.createElement('div');
    tick.className = 'gantt-tick';
    tick.style.flex = `${duration} 0 0%`;

    const startLabel = document.createElement('span');
    startLabel.className = 'tick-start';
    startLabel.textContent = interval.start.toString();
    tick.appendChild(startLabel);

    // If it's the last interval, also append the final end label
    if (i === timeline.length - 1) {
      const endLabel = document.createElement('span');
      endLabel.className = 'tick-end';
      endLabel.textContent = interval.end.toString();
      tick.appendChild(endLabel);
    }

    axis.appendChild(tick);
  }

  chartWrapper.appendChild(bar);
  chartWrapper.appendChild(axis);
  container.appendChild(chartWrapper);
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
