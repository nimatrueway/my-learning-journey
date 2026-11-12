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
import {formatPercentile, interpolate, percentileFor, valueAtZ, zScore} from '@site/src/lib/growthLms';
import DecimalInput from './DecimalInput';
import usePersistentState from './usePersistentState';
import styles from './widgets.module.css';

type GrowthSex = 'girl' | 'boy';
type InfantAgeUnit = 'months' | 'weeks';

const PERCENTILE_15_Z = -1.036433389;
const PERCENTILE_85_Z = 1.036433389;
const REFERENCE_LINES = [PERCENTILE_15_Z, 0, PERCENTILE_85_Z] as const;
const isGrowthSex = (value: unknown): value is GrowthSex => value === 'girl' || value === 'boy';
const isInfantAgeUnit = (value: unknown): value is InfantAgeUnit => value === 'months' || value === 'weeks';
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

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
  const [sex, setSex] = usePersistentState<GrowthSex>('calculator:body-measures:baby:sex', 'girl', isGrowthSex);
  const [ageUnit, setAgeUnit] = usePersistentState<InfantAgeUnit>(
    'calculator:body-measures:baby:age-unit',
    'months',
    isInfantAgeUnit,
  );
  const [ageMonths, setAgeMonths] = usePersistentState('calculator:body-measures:baby:age-months', 6, isFiniteNumber);
  const [length, setLength] = usePersistentState('calculator:body-measures:baby:length', 65, isFiniteNumber);
  const [weight, setWeight] = usePersistentState('calculator:body-measures:baby:weight', 7, isFiniteNumber);
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
            <DecimalInput id={ageId} value={displayedAge} onChange={updateAge} />
            <input type="range" min="0" max={ageMax} step={ageStep} value={Number.isFinite(displayedAge) ? displayedAge : 0}
              aria-label={`Age in ${ageUnit} slider`}
              onChange={(event) => updateAge(Number(event.target.value))} />
          </span>
        </label>
        <label className={styles.control} htmlFor={lengthId}>
          Recumbent length (cm)
          <span className={styles.numericControlRow}>
            <DecimalInput id={lengthId} value={length} onChange={setLength} />
            <input type="range" min="45" max="110" step="0.1" value={Number.isFinite(length) ? length : 45}
              aria-label="Recumbent length slider"
              onChange={(event) => setLength(Number(event.target.value))} />
          </span>
        </label>
        <label className={styles.control} htmlFor={weightId}>
          Weight (kg)
          <span className={styles.numericControlRow}>
            <DecimalInput id={weightId} value={weight} onChange={setWeight} />
            <input type="range" min="1" max="30" step="0.1" value={Number.isFinite(weight) ? weight : 1}
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