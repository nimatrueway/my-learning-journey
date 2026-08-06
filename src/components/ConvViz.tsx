import React, {useEffect, useMemo, useRef, useState} from 'react';
import styles from './widgets.module.css';

// 8x8 grayscale cat face (0 = black, 1 = white)
const CAT: number[][] = [
  [0.1, 0.9, 0.1, 0.1, 0.1, 0.1, 0.9, 0.1],
  [0.1, 0.9, 0.9, 0.1, 0.1, 0.9, 0.9, 0.1],
  [0.1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.1],
  [0.1, 0.9, 0.2, 0.9, 0.9, 0.2, 0.9, 0.1],
  [0.1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.1],
  [0.1, 0.9, 0.9, 0.5, 0.5, 0.9, 0.9, 0.1],
  [0.1, 0.1, 0.9, 0.9, 0.9, 0.9, 0.1, 0.1],
  [0.1, 0.1, 0.1, 0.9, 0.9, 0.1, 0.1, 0.1],
];

type KernelName = 'edge detect' | 'vertical edges' | 'blur' | 'identity';

const KERNELS: Record<KernelName, number[][]> = {
  'edge detect': [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]],
  'vertical edges': [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
  blur: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]],
  identity: [[0, 0, 0], [0, 1, 0], [0, 0, 0]],
};

const CELL = 24;
const GAP = 2;

function convolve(img: number[][], k: number[][]): number[][] {
  const out: number[][] = [];
  for (let r = 0; r <= img.length - 3; r++) {
    const row: number[] = [];
    for (let c = 0; c <= img[0].length - 3; c++) {
      let s = 0;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) s += img[r + i][c + j] * k[i][j];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

function maxpool(img: number[][]): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < img.length; r += 2) {
    const row: number[] = [];
    for (let c = 0; c < img[0].length; c += 2) {
      row.push(Math.max(img[r][c], img[r][c + 1], img[r + 1][c], img[r + 1][c + 1]));
    }
    out.push(row);
  }
  return out;
}

function Grid({data, highlight, label}: {data: number[][]; highlight?: [number, number, number] | null; label: string}) {
  const vals = data.flat();
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const norm = (v: number) => (hi === lo ? 0.5 : (v - lo) / (hi - lo));
  const w = data[0].length * (CELL + GAP);
  const h = data.length * (CELL + GAP) + 18;
  return (
    <svg width={w} height={h} role="img" aria-label={label}>
      <text x={0} y={12} className={styles.probeLabel}>{label}</text>
      {data.map((row, r) =>
        row.map((v, c) => {
          const g = Math.round(norm(v) * 255);
          const inWin = highlight && r >= highlight[0] && r < highlight[0] + highlight[2] && c >= highlight[1] && c < highlight[1] + highlight[2];
          return (
            <rect key={`${r}-${c}`} x={c * (CELL + GAP)} y={18 + r * (CELL + GAP)} width={CELL} height={CELL}
              fill={`rgb(${g},${g},${g})`} stroke={inWin ? '#ff6b6b' : 'none'} strokeWidth={inWin ? 2.5 : 0} rx={3} />
          );
        }),
      )}
    </svg>
  );
}

export default function ConvViz({mode = 'conv'}: {mode?: 'conv' | 'pool'}): React.ReactElement {
  const [kernelName, setKernelName] = useState<KernelName>('edge detect');
  const [pos, setPos] = useState(0);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const output = useMemo(
    () => (mode === 'conv' ? convolve(CAT, KERNELS[kernelName]) : maxpool(CAT)),
    [kernelName, mode],
  );
  const outSize = output.length;
  const maxPos = outSize * outSize - 1;
  const winSize = mode === 'conv' ? 3 : 2;
  const stride = mode === 'conv' ? 1 : 2;
  const row = Math.floor(pos / outSize);
  const col = pos % outSize;

  useEffect(() => {
    if (!running) return undefined;
    timer.current = setInterval(() => {
      setPos((p) => {
        if (p >= maxPos) {
          setRunning(false);
          return p;
        }
        return p + 1;
      });
    }, 180);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, maxPos]);

  const shown = output.map((r, ri) => r.map((v, ci) => (ri * outSize + ci <= pos ? v : 0)));

  return (
    <div className={styles.widget}>
      {mode === 'conv' && (
        <div className={styles.buttonRow}>
          {(Object.keys(KERNELS) as KernelName[]).map((k) => (
            <button key={k} type="button" className={k === kernelName ? styles.activeButton : styles.button}
              onClick={() => { setKernelName(k); setPos(0); setRunning(false); }}>
              {k}
            </button>
          ))}
        </div>
      )}
      <div className={styles.gridRow}>
        <Grid data={CAT} highlight={[row * stride, col * stride, winSize]} label="input (8×8 cat)" />
        <Grid data={shown} highlight={[row, col, 1]} label={mode === 'conv' ? `output (${outSize}×${outSize})` : `pooled (${outSize}×${outSize})`} />
      </div>
      <div className={styles.buttonRow}>
        <button type="button" className={styles.activeButton} onClick={() => setRunning((r) => !r)}>
          {running ? 'pause' : 'slide'}
        </button>
        <button type="button" className={styles.button} onClick={() => { setPos((p) => Math.min(p + 1, maxPos)); }}>
          step
        </button>
        <button type="button" className={styles.button} onClick={() => { setPos(0); setRunning(false); }}>reset</button>
      </div>
      <p className={styles.statusLine}>
        {mode === 'conv'
          ? `window at (${row}, ${col}) · output = sum of (window × kernel) · one tiny pattern-detector, reused everywhere`
          : `window at (${row * 2}, ${col * 2}) · keeps only the MAX of each 2×2 patch · zoom out, keep the loudest signal`}
      </p>
    </div>
  );
}
