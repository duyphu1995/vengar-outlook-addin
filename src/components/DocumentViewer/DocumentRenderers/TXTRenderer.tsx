import { IDocumentRendererProps } from './types';
import React from 'react';
import styles from './DocumentRenderers.module.scss';

export default function TXTRenderer({ fileData }: IDocumentRendererProps) {
  const decoder = new TextDecoder();
  const text = decoder.decode(fileData);

  return <div className={styles.txt}>{text}</div>;
}
TXTRenderer.fileTypes = ['txt'];
