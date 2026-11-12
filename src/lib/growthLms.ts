import type {GrowthRow} from '@site/src/data/whoGrowthStandards';

export function interpolate(rows: readonly GrowthRow[], x: number): GrowthRow {
  if (x <= rows[0][0]) return rows[0];
  if (x >= rows[rows.length - 1][0]) return rows[rows.length - 1];
  const upperIndex = rows.findIndex((row) => row[0] >= x);
  const lower = rows[upperIndex - 1];
  const upper = rows[upperIndex];
  const ratio = (x - lower[0]) / (upper[0] - lower[0]);
  return [
    x,
    lower[1] + (upper[1] - lower[1]) * ratio,
    lower[2] + (upper[2] - lower[2]) * ratio,
    lower[3] + (upper[3] - lower[3]) * ratio,
  ];
}

export function valueAtZ(row: GrowthRow, z: number): number {
  const [, l, m, s] = row;
  return Math.abs(l) < 1e-9 ? m * Math.exp(s * z) : m * ((1 + l * s * z) ** (1 / l));
}

export function zScore(row: GrowthRow, value: number): number {
  const [, l, m, s] = row;
  return Math.abs(l) < 1e-9 ? Math.log(value / m) / s : (((value / m) ** l) - 1) / (l * s);
}

export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

export function percentileFor(rows: readonly GrowthRow[], x: number, value: number): number {
  return normalCdf(zScore(interpolate(rows, x), value)) * 100;
}

export function formatPercentile(value: number): string {
  if (value < 0.1) return '<0.1st';
  if (value > 99.9) return '>99.9th';
  const rounded = Math.round(value);
  const remainder = rounded % 100;
  const suffix = remainder >= 11 && remainder <= 13
    ? 'th'
    : rounded % 10 === 1 ? 'st' : rounded % 10 === 2 ? 'nd' : rounded % 10 === 3 ? 'rd' : 'th';
  return `${rounded}${suffix}`;
}
