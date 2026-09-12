import React, {useState} from 'react';
import styles from './widgets.module.css';

type Mode = 'audio' | 'video';

interface MediaTokenVizProps {
  initialMode?: Mode;
}

export default function MediaTokenViz({initialMode = 'audio'}: MediaTokenVizProps): React.ReactElement {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [duration, setDuration] = useState(4);
  const [patchSize, setPatchSize] = useState(16);
  const [framesPerSecond, setFramesPerSecond] = useState(8);

  const audioTimeBins = duration * 100;
  const audioFrequencyBins = 80;
  const audioTokens = Math.ceil(audioTimeBins / patchSize) * Math.ceil(audioFrequencyBins / patchSize);
  const videoFrames = duration * framesPerSecond;
  const patchesPerFrame = Math.ceil(224 / patchSize) ** 2;
  const videoTokens = videoFrames * patchesPerFrame;
  const tokens = mode === 'audio' ? audioTokens : videoTokens;
  const attentionPairs = tokens ** 2;
  const previewColumns = Math.min(12, mode === 'audio' ? Math.ceil(audioTimeBins / patchSize) : framesPerSecond);
  const previewRows = Math.min(6, mode === 'audio' ? Math.ceil(audioFrequencyBins / patchSize) : Math.ceil(224 / patchSize));

  return (
    <div className={styles.widget}>
      <div className={styles.buttonRow} role="group" aria-label="Input modality">
        <button className={mode === 'audio' ? styles.activeButton : styles.button} onClick={() => setMode('audio')}>
          Audio
        </button>
        <button className={mode === 'video' ? styles.activeButton : styles.button} onClick={() => setMode('video')}>
          Video
        </button>
      </div>

      <div className={styles.mediaPatchGrid} style={{gridTemplateColumns: `repeat(${previewColumns}, 1fr)`}} aria-hidden="true">
        {Array.from({length: previewColumns * previewRows}, (_, index) => (
          <span key={index} style={{opacity: 0.35 + ((index * 7) % 10) / 16}} />
        ))}
      </div>

      <div className={styles.controls}>
        <label className={styles.control}>
          Clip length: {duration}s
          <input type="range" min="1" max="12" value={duration} onChange={(event) => setDuration(Number(event.target.value))} />
        </label>
        <label className={styles.control}>
          Patch size: {patchSize}×{patchSize}
          <input type="range" min="8" max="32" step="8" value={patchSize} onChange={(event) => setPatchSize(Number(event.target.value))} />
        </label>
        {mode === 'video' && (
          <label className={styles.control}>
            Sample rate: {framesPerSecond} fps
            <input type="range" min="2" max="24" step="2" value={framesPerSecond} onChange={(event) => setFramesPerSecond(Number(event.target.value))} />
          </label>
        )}
      </div>

      <p className={styles.statusLine}>
        {mode === 'audio'
          ? `${duration}s spectrogram (80 × ${audioTimeBins}) → ${tokens.toLocaleString()} patch tokens`
          : `${videoFrames} sampled frames × ${patchesPerFrame} patches → ${tokens.toLocaleString()} patch tokens`}
        {' · '}full attention compares about {attentionPairs.toLocaleString()} token pairs per layer.
      </p>
    </div>
  );
}