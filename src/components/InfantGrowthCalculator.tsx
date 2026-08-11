import React, {useId, useState} from 'react';
import {
  lengthForAgeBoy,
  lengthForAgeGirl,
  type GrowthRow,
  weightForAgeBoy,
  weightForAgeGirl,
  weightForLengthBoy,
  weightForLengthGirl,
} from '@site/src/data/whoGrowthStandards';
import styles from './widgets.module.css';

type GrowthSex = 'girl' | 'boy';
type InfantAgeUnit = 'months' | 'weeks';

const PERCENTILE_15_Z = -1.036433389;
const PERCENTILE_85_Z = 1.036433389;
const REFERENCE_LINES = [PERCENTILE_15_Z, 0, PERCENTILE_85_Z] as const;

function interpolate(rows: readonly GrowthRow[], x: number): GrowthRow {
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

function valueAtZ(row: GrowthRow, z: number): number {
  const [, l, m, s] = row;
  return Math.abs(l) < 1e-9 ? m * Math.exp(s * z) : m * ((1 + l * s * z) ** (1 / l));
}

function zScore(row: GrowthRow, value: number): number {
  const [, l, m, s] = row;
  return Math.abs(l) < 1e-9 ? Math.log(value / m) / s : (((value / m) ** l) - 1) / (l * s);
}

function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
    - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * erf);
}

function percentileFor(rows: readonly GrowthRow[], x: number, value: number): number {
  return normalCdf(zScore(interpolate(rows, x), value)) * 100;
}

function formatPercentile(value: number): string {
  if (value < 0.1) return '<0.1st';
  if (value > 99.9) return '>99.9th';
  const rounded = Math.round(value);
  const remainder = rounded % 100;
  const suffix = remainder >= 11 && remainder <= 13
    ? 'th'
    : rounded % 10 === 1 ? 'st' : rounded % 10 === 2 ? 'nd' : rounded % 10 === 3 ? 'rd' : 'th';
  return `${rounded}${suffix}`;
}

function percentileStatus(value: number): string {
  if (value < 15) return 'Below the WHO 15th-percentile reference line';
  if (value > 85) return 'Above the WHO 85th-percentile reference line';
  return 'Between the WHO 15th and 85th percentile reference lines';
}

interface GrowthChartProps {
  title: string;
  rows: readonly GrowthRow[];
  x: number;
  y: number;
  xLabel: string;
  yLabel: string;
}

function GrowthChart({title, rows, x, y, xLabel, yLabel}: GrowthChartProps): React.ReactElement {
  const [hoverX, setHoverX] = useState<number | null>(null);
  const width = 620;
  const height = 250;
  const padding = {top: 18, right: 18, bottom: 38, left: 48};
  const xMin = rows[0][0];
  const xMax = rows[rows.length - 1][0];
  const measurementZ = zScore(interpolate(rows, x), y);
  const referenceValues = rows.flatMap((row) => [
    valueAtZ(row, PERCENTILE_15_Z),
    valueAtZ(row, PERCENTILE_85_Z),
  ]);
  const projectionValues = rows.map((row) => valueAtZ(row, measurementZ));
  const yMinRaw = Math.min(y, ...referenceValues, ...projectionValues);
  const yMaxRaw = Math.max(y, ...referenceValues, ...projectionValues);
  const yPadding = Math.max((yMaxRaw - yMinRaw) * 0.08, 0.5);
  const yMin = Math.max(0, yMinRaw - yPadding);
  const yMax = yMaxRaw + yPadding;
  const plotX = (value: number) => padding.left
    + ((value - xMin) / (xMax - xMin)) * (width - padding.left - padding.right);
  const plotY = (value: number) => height - padding.bottom
    - ((value - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);
  const pathFor = (z: number) => rows.map((row, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${command}${plotX(row[0]).toFixed(1)},${plotY(valueAtZ(row, z)).toFixed(1)}`;
  }).join(' ');
  const activeX = hoverX ?? x;
  const activeRow = interpolate(rows, activeX);
  const activeValues = [
    {label: '15th', value: valueAtZ(activeRow, PERCENTILE_15_Z), className: styles.growthCurveLow},
    {label: 'Median', value: valueAtZ(activeRow, 0), className: styles.growthCurveMedian},
    {label: '85th', value: valueAtZ(activeRow, PERCENTILE_85_Z), className: styles.growthCurveHigh},
    {label: 'Projection', value: valueAtZ(activeRow, measurementZ), className: styles.growthProjection},
  ];
  const tooltipWidth = 178;
  const tooltipHeight = 94;
  const tooltipX = plotX(activeX) > width / 2
    ? plotX(activeX) - tooltipWidth - 10
    : plotX(activeX) + 10;
  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - bounds.left) / bounds.width) * width;
    const clampedX = Math.min(width - padding.right, Math.max(padding.left, svgX));
    setHoverX(xMin + ((clampedX - padding.left) / (width - padding.left - padding.right)) * (xMax - xMin));
  };

  return (
    <section className={styles.growthChartPanel}>
      <h3>{title}</h3>
      <svg className={styles.growthChart} viewBox={`0 0 ${width} ${height}`} role="img"
        aria-label={`${title}: measurement ${y.toFixed(1)} at ${x.toFixed(1)} ${xLabel}`}
        onPointerMove={handlePointerMove} onPointerLeave={() => setHoverX(null)}>
        {[0, 0.5, 1].map((ratio) => {
          const gridY = padding.top + ratio * (height - padding.top - padding.bottom);
          return <line key={ratio} x1={padding.left} x2={width - padding.right}
            y1={gridY} y2={gridY} className={styles.growthGridLine} />;
        })}
        {REFERENCE_LINES.map((z) => (
          <path key={z} d={pathFor(z)} className={z === 0
            ? styles.growthCurveMedian
            : z < 0 ? styles.growthCurveLow : styles.growthCurveHigh} />
        ))}
        <path d={pathFor(measurementZ)} className={styles.growthProjection} />
        <circle cx={plotX(x)} cy={plotY(y)} r="6" className={styles.growthPoint} />
        <line x1={plotX(activeX)} x2={plotX(activeX)} y1={padding.top}
          y2={height - padding.bottom} className={styles.growthCursorLine} />
        {activeValues.map((item) => (
          <circle key={item.label} cx={plotX(activeX)} cy={plotY(item.value)} r="4"
            className={item.className} />
        ))}
        <g className={styles.growthTooltip} pointerEvents="none">
          <rect x={tooltipX} y={padding.top + 4} width={tooltipWidth} height={tooltipHeight} rx="3" />
          <text x={tooltipX + 9} y={padding.top + 20}>
            <tspan className={styles.growthTooltipHeading}>{activeX.toFixed(1)} {xLabel}</tspan>
            {activeValues.map((item, index) => (
              <tspan key={item.label} x={tooltipX + 9} dy={index === 0 ? 17 : 15}>
                {item.label}: {item.value.toFixed(1)} {yLabel}
              </tspan>
            ))}
          </text>
        </g>
        <text x={padding.left} y={height - 9} className={styles.growthAxisLabel}>{xMin}</text>
        <text x={width - padding.right} y={height - 9} textAnchor="end"
          className={styles.growthAxisLabel}>{xMax} {xLabel}</text>
        <text x="8" y={padding.top + 5} className={styles.growthAxisLabel}>{yMax.toFixed(1)}</text>
        <text x="8" y={height - padding.bottom} className={styles.growthAxisLabel}>{yMin.toFixed(1)}</text>
        <text x="8" y={height / 2} className={styles.growthAxisLabel}>{yLabel}</text>
      </svg>
      <div className={styles.growthLegend} aria-hidden="true">
        <span className={styles.growthLegendLow}>15th percentile</span>
        <span className={styles.growthLegendMedian}>Median · 50th</span>
        <span className={styles.growthLegendHigh}>85th percentile</span>
        <span className={styles.growthLegendProjection}>Same-z projection</span>
        <span className={styles.growthLegendPoint}>Measurement</span>
      </div>
      <p className={styles.growthProjectionNote}>
        Projection holds the current WHO z-score constant across the chart. It is a visual guide, not a prediction.
      </p>
    </section>
  );
}

export default function InfantGrowthCalculator(): React.ReactElement {
  const ageId = useId();
  const lengthId = useId();
  const weightId = useId();
  const [sex, setSex] = useState<GrowthSex>('girl');
  const [ageUnit, setAgeUnit] = useState<InfantAgeUnit>('months');
  const [ageMonths, setAgeMonths] = useState(6);
  const [length, setLength] = useState(65);
  const [weight, setWeight] = useState(7);
  const displayedAge = ageUnit === 'months'
    ? Number(ageMonths.toFixed(1))
    : Math.round(ageMonths * 30.4375 / 7);
  const valid = ageMonths >= 0 && ageMonths <= 24 && length >= 45 && length <= 110
    && weight >= 1 && weight <= 30;
  const weightForLength = sex === 'girl' ? weightForLengthGirl : weightForLengthBoy;
  const lengthForAge = sex === 'girl' ? lengthForAgeGirl : lengthForAgeBoy;
  const weightForAge = sex === 'girl' ? weightForAgeGirl : weightForAgeBoy;
  const percentiles = valid ? {
    weightForLength: percentileFor(weightForLength, length, weight),
    lengthForAge: percentileFor(lengthForAge, ageMonths, length),
    weightForAge: percentileFor(weightForAge, ageMonths, weight),
  } : null;
  const ageMax = ageUnit === 'months' ? 24 : 104;
  const ageStep = ageUnit === 'months' ? 0.1 : 1;

  const updateAge = (value: number) => setAgeMonths(ageUnit === 'months'
    ? value
    : value * 7 / 30.4375);

  return (
    <div>
      <div className={styles.growthSetupGrid}>
        <fieldset className={styles.segmentedField}>
          <legend>Sex used by WHO chart</legend>
          <div className={styles.buttonRow}>
            {(['girl', 'boy'] as const).map((option) => (
              <button key={option} type="button"
                className={sex === option ? styles.activeButton : styles.button}
                aria-pressed={sex === option} onClick={() => setSex(option)}>
                {option === 'girl' ? 'Girl' : 'Boy'}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className={styles.segmentedField}>
          <legend>Age unit</legend>
          <div className={styles.buttonRow}>
            {(['months', 'weeks'] as const).map((unit) => (
              <button key={unit} type="button"
                className={ageUnit === unit ? styles.activeButton : styles.button}
                aria-pressed={ageUnit === unit} onClick={() => setAgeUnit(unit)}>
                {unit === 'months' ? 'Months' : 'Weeks'}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={styles.practiceGrid}>
        <label className={styles.control} htmlFor={ageId}>
          Age ({ageUnit})
          <span className={styles.numericControlRow}>
            <input id={ageId} type="number" min="0" max={ageMax} step={ageStep} value={displayedAge}
              onChange={(event) => updateAge(Number(event.target.value))} />
            <input type="range" min="0" max={ageMax} step={ageStep} value={displayedAge}
              aria-label={`Age in ${ageUnit} slider`}
              onChange={(event) => updateAge(Number(event.target.value))} />
          </span>
        </label>
        <label className={styles.control} htmlFor={lengthId}>
          Recumbent length (cm)
          <span className={styles.numericControlRow}>
            <input id={lengthId} type="number" min="45" max="110" step="0.1" value={length}
              onChange={(event) => setLength(Number(event.target.value))} />
            <input type="range" min="45" max="110" step="0.1" value={length}
              aria-label="Recumbent length slider"
              onChange={(event) => setLength(Number(event.target.value))} />
          </span>
        </label>
        <label className={styles.control} htmlFor={weightId}>
          Weight (kg)
          <span className={styles.numericControlRow}>
            <input id={weightId} type="number" min="1" max="30" step="0.1" value={weight}
              onChange={(event) => setWeight(Number(event.target.value))} />
            <input type="range" min="1" max="30" step="0.1" value={weight}
              aria-label="Baby weight slider"
              onChange={(event) => setWeight(Number(event.target.value))} />
          </span>
        </label>
      </div>

      {!valid || percentiles === null ? (
        <p className={styles.bmiWarning} role="alert">
          Enter age 0-24 months (0-104 weeks), recumbent length 45-110 cm, and weight 1-30 kg.
        </p>
      ) : (
        <div aria-live="polite">
          <div className={styles.growthMetrics}>
            {([
              ['Weight for length', percentiles.weightForLength],
              ['Length for age', percentiles.lengthForAge],
              ['Weight for age', percentiles.weightForAge],
            ] as const).map(([label, percentile]) => (
              <div key={label}>
                <span className={styles.bmiResultLabel}>{label}</span>
                <strong className={styles.growthPercentile}>{formatPercentile(percentile)}</strong>
                <small>{percentileStatus(percentile)}</small>
              </div>
            ))}
          </div>

          <div className={styles.growthCharts}>
            <GrowthChart title="Weight for length" rows={weightForLength}
              x={length} y={weight} xLabel="cm" yLabel="kg" />
            <GrowthChart title="Length for age" rows={lengthForAge}
              x={ageMonths} y={length} xLabel="months" yLabel="cm" />
            <GrowthChart title="Weight for age" rows={weightForAge}
              x={ageMonths} y={weight} xLabel="months" yLabel="kg" />
          </div>

          <div className={styles.bmiPercentileNote}>
            <strong>WHO growth snapshot, not a diagnosis</strong>
            <p>Percentiles are calculated from interpolated WHO LMS standards for {sex === 'girl' ? 'girls' : 'boys'}.
              One measurement cannot show growth velocity; plot accurate measurements over time with a clinician.</p>
          </div>
        </div>
      )}
    </div>
  );
}