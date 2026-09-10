import React, {useState} from 'react';
import styles from './styles.module.css';

type Props = {
  onReload: () => void;
};

export default function PwaReloadPopup({onReload}: Props): React.ReactElement | null {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className={`alert alert--secondary ${styles.popup}`} role="status">
      <span>New version available</span>
      <div className={styles.actions}>
        <button className="button button--link" type="button" onClick={onReload}>
          Refresh
        </button>
        <button className="close" type="button" aria-label="Close" onClick={() => setVisible(false)}>
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
