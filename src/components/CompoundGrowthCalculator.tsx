import React, {useId, useState} from 'react';
import styles from './widgets.module.css';

type Mode = 'money' | 'users';

const W = 560;
const H = 280;
const MARGIN = {top: 12, right: 14, bottom: 30, left: 56};
const INNER_W = W - MARGIN.left - MARGIN.right;
const INNER_H = H - MARGIN.top - MARGIN.bottom;

function compact(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e4) return `${(value / 1e3).toFixed(1)}k`;
  return value.toLocaleString('en-US', {maximumFractionDigits: 0});
}

function toPath(series: number[], yMax: number): string {
  const last = Math.max(1, series.length - 1);
  return series
    .map((v, i) => {
      const x = MARGIN.left + (i / last) * INNER_W;
      const y = MARGIN.top + INNER_H - (Math.min(v, yMax) / yMax) * INNER_H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

interface FieldProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}

function Field({label, min, max, step, value, onChange}: FieldProps): React.ReactElement {
  const id = useId();
  return (
    <label className={styles.control} htmlFor={id}>
      {label}
      <span className={styles.numericControlRow}>
        <input id={id} type="number" min={min} max={max} step={step} value={value}
          onChange={(event) => onChange(Number(event.target.value))} />
        <input type="range" min={min} max={max} step={step} value={value}
          aria-label={`${label} slider`}
          onChange={(event) => onChange(Number(event.target.value))} />
      </span>
    </label>
  );
}

interface ChartProps {
  compound: number[];
  baseline: number[];
  xEnd: number;
  xUnit: string;
  ariaLabel: string;
  compoundLabel: string;
  baselineLabel: string;
}

function GrowthChart({compound, baseline, xEnd, xUnit, ariaLabel, compoundLabel, baselineLabel}: ChartProps): React.ReactElement {
  const yMax = Math.max(...compound, ...baseline, 1) * 1.05;
  const yTicks = [0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  return (
    <div className={styles.growthChartPanel}>
      <svg className={styles.growthChart} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
        {yTicks.map((tick) => {
          const y = MARGIN.top + INNER_H - (tick / yMax) * INNER_H;
          return (
            <g key={tick}>
              <line className={styles.growthGridLine} x1={MARGIN.left} x2={W - MARGIN.right} y1={y} y2={y} />
              <text className={styles.growthAxisLabel} x={MARGIN.left - 6} y={y + 4} textAnchor="end">
                {compact(tick)}
              </text>
            </g>
          );
        })}
        <line className={styles.growthGridLine} x1={MARGIN.left} x2={W - MARGIN.right}
          y1={MARGIN.top + INNER_H} y2={MARGIN.top + INNER_H} />
        {[0, 0.5, 1].map((f) => (
          <text key={f} className={styles.growthAxisLabel}
            x={MARGIN.left + f * INNER_W} y={H - 10} textAnchor="middle">
            {Math.round(f * xEnd)} {xUnit}
          </text>
        ))}
        <path className={styles.growthCurveLow} d={toPath(baseline, yMax)} />
        <path className={styles.growthCurveMedian} d={toPath(compound, yMax)} />
      </svg>
      <div className={styles.growthLegend}>
        <span className={styles.growthLegendMedian}>— {compoundLabel}</span>
        <span className={styles.growthLegendLow}>— {baselineLabel}</span>
      </div>
    </div>
  );
}

function MoneyMode(): React.ReactElement {
  const [principal, setPrincipal] = useState(10000);
  const [ratePct, setRatePct] = useState(7);
  const [years, setYears] = useState(20);
  const [contribution, setContribution] = useState(200);

  const valid = principal >= 0 && principal <= 1e9
    && ratePct >= 0 && ratePct <= 50
    && years >= 1 && years <= 60
    && contribution >= 0 && contribution <= 1e6;

  if (!valid) {
    return (
      <p className={styles.bmiWarning} role="alert">
        Enter a starting amount of 0-1,000,000,000, a return of 0-50%, 1-60 years,
        and a monthly contribution of 0-1,000,000.
      </p>
    );
  }

  const monthlyRate = ratePct / 100 / 12;
  const months = Math.round(years * 12);
  const balances: number[] = [principal];
  const contributed: number[] = [principal];
  let balance = principal;
  for (let m = 1; m <= months; m += 1) {
    balance = balance * (1 + monthlyRate) + contribution;
    balances.push(balance);
    contributed.push(principal + contribution * m);
  }
  const totalIn = contributed[months];
  const growth = balance - totalIn;
  const effectiveAnnual = (1 + monthlyRate) ** 12 - 1;
  const doublingYears = effectiveAnnual > 0 ? Math.log(2) / Math.log(1 + effectiveAnnual) : null;

  return (
    <>
      <div className={styles.practiceGrid}>
        <Field label="Starting amount" min={0} max={1000000} step={500} value={principal} onChange={setPrincipal} />
        <Field label="Annual return (%)" min={0} max={50} step={0.5} value={ratePct} onChange={setRatePct} />
        <Field label="Years" min={1} max={60} step={1} value={years} onChange={setYears} />
        <Field label="Monthly contribution" min={0} max={10000} step={50} value={contribution} onChange={setContribution} />
      </div>
      <div className={styles.growthMetrics} aria-live="polite">
        <div>
          <span className={styles.bmiResultLabel}>Final balance</span>
          <strong className={styles.growthPercentile}>{compact(balance)}</strong>
          <small>{ratePct}% compounded monthly for {years} years</small>
        </div>
        <div>
          <span className={styles.bmiResultLabel}>Total put in</span>
          <strong className={styles.growthPercentile}>{compact(totalIn)}</strong>
          <small>Starting amount plus every contribution</small>
        </div>
        <div>
          <span className={styles.bmiResultLabel}>Growth earned</span>
          <strong className={styles.growthPercentile}>{compact(Math.max(0, growth))}</strong>
          <small>
            {doublingYears === null
              ? 'At 0% the money never doubles on its own'
              : `Invested money doubles roughly every ${doublingYears.toFixed(1)} years`}
          </small>
        </div>
      </div>
      <GrowthChart
        compound={balances}
        baseline={contributed}
        xEnd={years}
        xUnit="yr"
        ariaLabel={`Balance versus total contributions over ${years} years`}
        compoundLabel="Balance with compounding"
        baselineLabel="Total contributions only"
      />
    </>
  );
}

function UsersMode(): React.ReactElement {
  const [startUsers, setStartUsers] = useState(100);
  const [weeklyPct, setWeeklyPct] = useState(5);
  const [weeks, setWeeks] = useState(104);

  const valid = startUsers >= 1 && startUsers <= 1e9
    && weeklyPct >= 0 && weeklyPct <= 50
    && weeks >= 1 && weeks <= 520;

  if (!valid) {
    return (
      <p className={styles.bmiWarning} role="alert">
        Enter 1-1,000,000,000 starting users, weekly growth of 0-50%, and 1-520 weeks.
      </p>
    );
  }

  const rate = weeklyPct / 100;
  const exponential: number[] = [];
  const linear: number[] = [];
  for (let t = 0; t <= weeks; t += 1) {
    exponential.push(startUsers * (1 + rate) ** t);
    linear.push(startUsers + startUsers * rate * t);
  }
  const finalUsers = exponential[weeks];
  const doublingWeeks = rate > 0 ? Math.log(2) / Math.log(1 + rate) : null;
  const yearlyMultiple = (1 + rate) ** 52;

  return (
    <>
      <div className={styles.practiceGrid}>
        <Field label="Starting users" min={1} max={100000} step={10} value={startUsers} onChange={setStartUsers} />
        <Field label="Weekly growth (%)" min={0} max={50} step={0.5} value={weeklyPct} onChange={setWeeklyPct} />
        <Field label="Weeks" min={1} max={520} step={1} value={weeks} onChange={setWeeks} />
      </div>
      <div className={styles.growthMetrics} aria-live="polite">
        <div>
          <span className={styles.bmiResultLabel}>Users after {weeks} weeks</span>
          <strong className={styles.growthPercentile}>{compact(finalUsers)}</strong>
          <small>Assuming the rate actually holds every single week</small>
        </div>
        <div>
          <span className={styles.bmiResultLabel}>Doubling time</span>
          <strong className={styles.growthPercentile}>
            {doublingWeeks === null ? '—' : `${doublingWeeks.toFixed(1)} wk`}
          </strong>
          <small>{doublingWeeks === null ? 'No growth means no doubling' : 'Rule of 72 estimate: 72 divided by the weekly percentage'}</small>
        </div>
        <div>
          <span className={styles.bmiResultLabel}>One year multiple</span>
          <strong className={styles.growthPercentile}>×{yearlyMultiple >= 100 ? compact(yearlyMultiple) : yearlyMultiple.toFixed(1)}</strong>
          <small>{weeklyPct}% weekly compounded over 52 weeks</small>
        </div>
      </div>
      <GrowthChart
        compound={exponential}
        baseline={linear}
        xEnd={weeks}
        xUnit="wk"
        ariaLabel={`Exponential versus linear user growth over ${weeks} weeks`}
        compoundLabel="Compounding weekly growth"
        baselineLabel="Same first-week gain, added linearly"
      />
    </>
  );
}

export default function CompoundGrowthCalculator(): React.ReactElement {
  const [mode, setMode] = useState<Mode>('money');
  return (
    <section className={styles.widget} aria-labelledby="compound-growth-title">
      <h2 id="compound-growth-title" className={styles.widgetTitle}>Compound growth calculator</h2>
      <div className={styles.buttonRow} role="group" aria-label="Calculator mode">
        <button type="button" className={mode === 'money' ? styles.activeButton : styles.button}
          aria-pressed={mode === 'money'} onClick={() => setMode('money')}>Compound interest</button>
        <button type="button" className={mode === 'users' ? styles.activeButton : styles.button}
          aria-pressed={mode === 'users'} onClick={() => setMode('users')}>User growth</button>
      </div>
      {mode === 'money' ? <MoneyMode /> : <UsersMode />}
    </section>
  );
}
