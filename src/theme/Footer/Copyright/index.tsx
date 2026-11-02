import React, {useEffect, useState} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';

type Deployment = {commit: string; date: string};

export default function FooterCopyright(): React.ReactElement {
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const url = useBaseUrl('/deployment.json');

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    const controller = new AbortController();
    void fetch(url, {cache: 'no-store', signal: controller.signal})
      .then(async response => {
        if (!response.ok) throw new Error(`Deployment metadata: HTTP ${response.status}`);
        const data: unknown = await response.json();
        if (!data || typeof data !== 'object'
          || !('commit' in data) || typeof data.commit !== 'string' || !/^[a-f0-9]{7,40}$/.test(data.commit)
          || !('date' in data) || typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
          throw new Error('Invalid deployment metadata');
        }
        setDeployment({commit: data.commit, date: data.date});
      })
      .catch(error => {
        if (!controller.signal.aborted) console.warn('Deployment info unavailable (possibly offline).', error);
      });
    return () => controller.abort();
  }, [url]);

  return (
    <div className="footer__copyright">
      <span className="footerPrompt">nima@github:~/my-learning-journey$</span>{' git log -1 → '}
      {deployment ? <>
        <a href={`https://github.com/nimatrueway/my-learning-journey/commit/${deployment.commit}`}>
          {deployment.commit.slice(0, 7)}
        </a>
        {' · deployed '}{deployment.date}{' · © '}{deployment.date.slice(0, 4)}
      </> : process.env.NODE_ENV === 'production' ? 'deployment info unavailable' : 'development build'}
      {' · press '}<kbd>?</kbd>{' for shortcuts'}
    </div>
  );
}
