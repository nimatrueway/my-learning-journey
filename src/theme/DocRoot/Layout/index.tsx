import React from 'react';
import Layout from '@theme-original/DocRoot/Layout';
import type {Props} from '@theme/DocRoot/Layout';
import ReadingStatus from '@site/src/components/ReadingStatus';
import {WriterVaultProvider} from '@site/src/components/Locked';

export default function LayoutWrapper(props: Props): React.ReactElement {
  return (
    <WriterVaultProvider>
      <Layout {...props} />
      <ReadingStatus />
    </WriterVaultProvider>
  );
}
