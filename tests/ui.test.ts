import { describe, it, expect } from 'vitest';
import { formatMetric } from '../src/ui/table';
import { getProcessColor } from '../src/ui/gantt';

describe('UI Helpers', () => {
  it('formats metric numbers correctly without trailing zeros when integer', () => {
    expect(formatMetric(6)).toBe('6');
    expect(formatMetric(6.75)).toBe('6.75');
    expect(formatMetric(2.3333)).toBe('2.33');
    expect(formatMetric(0)).toBe('0');
  });

  it('assigns stable distinct colors for processes', () => {
    const list = ['P1', 'P2', 'P3', 'P4'];
    const c1 = getProcessColor('P1', list);
    const c2 = getProcessColor('P2', list);
    expect(c1).not.toBe(c2);
    expect(getProcessColor('P1', list)).toBe(c1);
  });
});
